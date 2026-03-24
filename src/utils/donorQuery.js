const QUERY_API_URL = 'https://6npdtqo4sa.execute-api.us-east-1.amazonaws.com/prod/query';

const AGE_GROUPS = [
  { key: 'infancy',     min: 0,  max: 1  },
  { key: 'childhood',   min: 1,  max: 12 },
  { key: 'adolescence', min: 12, max: 18 },
  { key: 'adult',       min: 18, max: 65 },
];

// Metadata column name for each UI data modality label
const DATA_MODALITY_TO_COL = {
  'BCR-seq':            'BCR-seq',
  'Bulk ATAC-seq':      'Bulk ATAC-seq',
  'BulkRNA-seq':        'Bulk RNA-seq',
  'CITE-seq Protein':   'CITE-seq Protein',
  'Calcium Imaging':    'Calcium Imaging',
  'CODEX':              'CODEX',
  'IMC':                'IMC',
  'Flow Cytometry':     'Flow Cytometry',
  'scRNA-seq':          'scRNA-seq',
  'TCR-seq':            'TCR-seq',
  'snMultiomics':       'snMultiomics',
  'Histology':          'Histology',
  'Perifusion':         'Perifusion',
  'Oxygen Consumption': 'Oxygen Consumption',
};

// Modality tables that have a Cell_Type column (used for cell type filtering)
const MODALITY_TO_CELL_TABLE = {
  'BCR-seq':        'modalities.`BCR-seq`',
  'Bulk ATAC-seq':  'modalities.`Bulk_ATAC-seq`',
  'BulkRNA-seq':    'modalities.`Bulk_RNA-seq`',
  'Flow Cytometry': 'modalities.`Flow_Cytometry`',
  'scRNA-seq':      'modalities.`scRNA-seq`',
  'TCR-seq':        'modalities.`TCR-seq`',
};

// Modality tables that have a Region column (used for region display)
const MODALITY_TO_REGION_TABLE = {
  'CITE-seq Protein': 'modalities.`CITE-seq_Protein`',
  'Calcium Imaging':  'modalities.`Calcium_Imaging`',
  'CODEX':            'modalities.CODEX',
  'Perifusion':       'modalities.Perifusion',
  'snMultiomics':     'modalities.snMultiomics',
};

// Maps UI cell type labels to the actual DB Cell_Type values
// Unmapped labels (e.g. CD45+) will be passed as-is, likely matching nothing
const UI_CELL_TYPE_MAP = {
  'Alpha':        'alpha',
  'Beta':         'beta',
  'B Cell':       'B cell',
  'T Cell':       'T cell',
  'Immune Lineage': 'Immune_lineage',
};

// All modality tables with Cell_Type — used for the cell_types display column
const ALL_CELL_TYPE_TABLES = [
  'modalities.`BCR-seq`',
  'modalities.`Bulk_ATAC-seq`',
  'modalities.`Bulk_RNA-seq`',
  'modalities.`Flow_Cytometry`',
  'modalities.`scRNA-seq`',
  'modalities.`TCR-seq`',
];

const DIAG_TO_STATUS = {
  'ND': 'ND', 'T1DM': 'T1D', 'T1DM Recent': 'T1D', 'T1DM/MODY': 'T1D',
  'T2DM': 'T2D', 'T2DM Gastric Bypass': 'T2D',
};

// Subquery for displaying cell types on the donor card (across all Cell_Type tables)
function buildCellTypeDisplaySubquery() {
  const union = ALL_CELL_TYPE_TABLES
    .map((t) => `SELECT \`Cell_Type\`, \`Donor\` FROM ${t}`)
    .join(' UNION ALL ');
  return `(SELECT GROUP_CONCAT(DISTINCT ct.\`Cell_Type\` ORDER BY ct.\`Cell_Type\` SEPARATOR ', ') FROM (${union}) ct WHERE ct.\`Donor\` = m.donor_ID AND ct.\`Cell_Type\` IS NOT NULL AND ct.\`Cell_Type\` != '') AS cell_types`;
}

// Subquery for displaying regions on the donor card from the selected modality tables.
// OR mode = union of all regions; AND mode = intersection.
function buildRegionSubquery(selectedModalities, modalityRelation) {
  const regionTables = selectedModalities
    .filter((m) => MODALITY_TO_REGION_TABLE[m])
    .map((m) => MODALITY_TO_REGION_TABLE[m]);

  if (regionTables.length === 0) return 'NULL AS regions';

  const selects = regionTables.map(
    (t) => `SELECT \`Region\` FROM ${t} WHERE \`Donor\` = m.donor_ID AND \`Region\` IS NOT NULL AND \`Region\` != ''`,
  );

  if (modalityRelation === 'or' || regionTables.length === 1) {
    return `(SELECT GROUP_CONCAT(DISTINCT r.\`Region\` ORDER BY r.\`Region\` SEPARATOR ', ') FROM (${selects.join(' UNION ')}) r) AS regions`;
  }

  // AND mode: keep only regions that appear in ALL region-having tables for this donor
  const n = regionTables.length;
  const srcSelects = regionTables.map(
    (t, i) => `SELECT \`Region\`, ${i} AS src FROM ${t} WHERE \`Donor\` = m.donor_ID AND \`Region\` IS NOT NULL AND \`Region\` != ''`,
  );
  return `(SELECT GROUP_CONCAT(DISTINCT ir.\`Region\` ORDER BY ir.\`Region\` SEPARATOR ', ') FROM (SELECT \`Region\` FROM (${srcSelects.join(' UNION ALL ')}) all_r GROUP BY \`Region\` HAVING COUNT(DISTINCT src) = ${n}) ir) AS regions`;
}

function buildDonorQuery(filters, sampleFilters) {
  const conditions = [];

  // Age
  const ageConditions = [];
  AGE_GROUPS.forEach(({ key }) => {
    if (filters.age[key]) {
      const [rMin, rMax] = filters.ageRanges[key];
      ageConditions.push(`(CAST(age_years AS DECIMAL) BETWEEN ${rMin} AND ${rMax})`);
    }
  });
  if (ageConditions.length > 0) conditions.push(`(${ageConditions.join(' OR ')})`);

  // Sex
  const selectedSexes = Object.entries(filters.sex).filter(([, v]) => v).map(([k]) => k);
  if (selectedSexes.length > 0) {
    conditions.push(`sex IN (${selectedSexes.map((s) => `'${s}'`).join(', ')})`);
  }

  // BMI
  if (filters.bmiChecked) {
    conditions.push(`(CAST(BMI AS DECIMAL) BETWEEN ${filters.bmiRange[0]} AND ${filters.bmiRange[1]})`);
  }

  // HbA1c
  if (filters.hba1cChecked) {
    conditions.push(`(CAST(\`HbA1C (percentage)\` AS DECIMAL) BETWEEN ${filters.hba1cRange[0]} AND ${filters.hba1cRange[1]})`);
  }

  // Clinical Diagnosis — uses donors.AAb_cPeptide_Metadata where values match the UI options
  const CLINICAL_DIAG_MAP = {
    'T1DM':                  'T1DM',
    'T1D Control':            'T1D control',
    'T1DM (recent DKA)':     'T1DM (recent DKA)',
    'T1DM Recent onset':     'T1DM Recent onset',
    'Recent T1DM Unsuspected': 'Recent T1DM Unsuspected',
    'T2DM Gastric Bypass':   'T2DM Gastric bypass',
    'T2DM Polycystic Ovaries': 'T2DM polycystic ovaries',
  };
  const selectedDiag = Object.entries(filters.clinicalDiagnosis).filter(([, v]) => v).map(([k]) => k);
  if (selectedDiag.length > 0) {
    const dbValues = selectedDiag.map((d) => CLINICAL_DIAG_MAP[d]).filter(Boolean);
    if (dbValues.length > 0) {
      const inList = dbValues.map((v) => `'${v}'`).join(', ');
      conditions.push(
        `EXISTS (SELECT 1 FROM donors.AAb_cPeptide_Metadata aab WHERE aab.\`Donor ID\` = m.donor_ID AND aab.\`Clinical Diagnosis\` IN (${inList}))`,
      );
    }
  }

  // T1D Stage
  const selectedStages = Object.entries(filters.t1dStage).filter(([, v]) => v).map(([k]) => k);
  if (selectedStages.length > 0) {
    const stageConditions = selectedStages.map((s) =>
      s === 'No Stage' ? "`T1D stage_1` = 'No stage'" : `\`T1D stage_1\` LIKE '${s}%'`,
    );
    conditions.push(`(${stageConditions.join(' OR ')})`);
  }

  // Disease Status — ND / T1D / T2D map to Metadata; AAB+ and ATDM have no DB value (1=0)
  const selectedStatus = Object.entries(filters.diseaseStatus).filter(([, v]) => v).map(([k]) => k);
  if (selectedStatus.length > 0) {
    const statusConditions = selectedStatus.map((s) => {
      switch (s) {
        case 'ND':   return "m.clinical_diagnosis = 'ND'";
        case 'T1D':  return "m.clinical_diagnosis LIKE 'T1DM%'";
        case 'T2D':  return "m.clinical_diagnosis LIKE 'T2DM%'";
        case 'AAB+': return '1=0';
        case 'ATDM': return '1=0';
        default:     return null;
      }
    }).filter(Boolean);
    if (statusConditions.length > 0) conditions.push(`(${statusConditions.join(' OR ')})`);
  }

  // Disease Duration
  if (filters.diseaseDurationKnown && !filters.diseaseDurationUnknown) {
    conditions.push("disease_duration != 'Unknown'");
  } else if (!filters.diseaseDurationKnown && filters.diseaseDurationUnknown) {
    conditions.push("disease_duration = 'Unknown'");
  }

  // Auto Antibody Positive count
  const selectedAAPos = Object.entries(filters.autoAntibodyPositive).filter(([, v]) => v).map(([k]) => k);
  if (selectedAAPos.length > 0) {
    const aaPosConditions = selectedAAPos.map((n) => `n_autoantibodies LIKE '%-${n}'`);
    conditions.push(`(${aaPosConditions.join(' OR ')})`);
  }

  // Auto Antibody (GADA / IA-2 / IAA / ZnT8) — ignored (no direct filterable DB column)
  // Feature filter — ignored (no corresponding DB column)
  // Processing Type filter — ignored (no corresponding DB column)

  // Data Modality — check presence flag in Metadata
  const selectedModalities = Object.entries(sampleFilters.dataModality).filter(([, v]) => v).map(([k]) => k);
  if (selectedModalities.length > 0) {
    const modalityCols = selectedModalities.map((d) => DATA_MODALITY_TO_COL[d]).filter(Boolean);
    const op = sampleFilters.dataModalityRelation === 'and' ? ' AND ' : ' OR ';
    conditions.push(`(${modalityCols.map((c) => `m.\`${c}\` > 0`).join(op)})`);
  }

  // Cell Type — filter within each selected modality's actual table.
  // Modalities without a Cell_Type column produce an impossible condition (1=0).
  const selectedCellTypes = Object.entries(sampleFilters.cellType).filter(([, v]) => v).map(([k]) => k);
  if (selectedCellTypes.length > 0 && selectedModalities.length > 0) {
    const dbCellTypes = selectedCellTypes.map((c) => UI_CELL_TYPE_MAP[c] || c);

    const perModalityConds = selectedModalities.map((mod) => {
      const table = MODALITY_TO_CELL_TABLE[mod];
      if (!table) return '1=0'; // no Cell_Type column in this table

      if (sampleFilters.cellTypeRelation === 'or') {
        const ctList = dbCellTypes.map((c) => `'${c}'`).join(', ');
        return `EXISTS (SELECT 1 FROM ${table} ct WHERE ct.\`Donor\` = m.donor_ID AND ct.\`Cell_Type\` IN (${ctList}))`;
      }
      // AND: every selected cell type must be present
      return dbCellTypes
        .map((c) => `EXISTS (SELECT 1 FROM ${table} ct WHERE ct.\`Donor\` = m.donor_ID AND ct.\`Cell_Type\` = '${c}')`)
        .join(' AND ');
    });

    const op = sampleFilters.dataModalityRelation === 'and' ? ' AND ' : ' OR ';
    conditions.push(`(${perModalityConds.join(op)})`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const cellTypeDisplay = buildCellTypeDisplaySubquery();
  const regionDisplay = buildRegionSubquery(selectedModalities, sampleFilters.dataModalityRelation);

  return `SELECT m.\`donor_ID\`, m.\`age_years\`, m.\`sex\`, m.\`BMI\`, m.\`clinical_diagnosis\`, m.\`T1D stage_1\`, m.\`disease_duration\`, m.\`HbA1C (percentage)\`, m.\`gada\`, m.\`ia_2\`, m.\`iaa\`, m.\`znt8\`, m.\`n_autoantibodies\`, m.\`scRNA-seq\`, m.\`scATAC-seq\`, m.\`snMultiomics\`, m.\`CITE-seq Protein\`, m.\`TEA-seq\`, m.\`BCR-seq\`, m.\`TCR-seq\`, m.\`Bulk RNA-seq\`, m.\`Bulk ATAC-seq\`, m.\`WGS\`, m.\`Calcium Imaging\`, m.\`Flow Cytometry\`, m.\`Oxygen Consumption\`, m.\`Perifusion\`, m.\`CODEX\`, m.\`IMC\`, m.\`Histology\`, ${cellTypeDisplay}, ${regionDisplay} FROM donors.Metadata m ${where} ORDER BY m.donor_ID`;
}

export function mapRowToDonorCard(row) {
  const diseaseStatus = DIAG_TO_STATUS[row.clinical_diagnosis] || row.clinical_diagnosis || '—';
  return {
    id: row.donor_ID,
    age: row.age_years || '—',
    sex: row.sex || '—',
    bmi: row.BMI || '—',
    diseaseStatus,
    program: row.donor_ID ? row.donor_ID.split('-')[0] : '—',
    cellType: row.cell_types || '—',
    region: row.regions || '—',
  };
}

export async function fetchDonors(filters, sampleFilters) {
  const query = buildDonorQuery(filters, sampleFilters);
  const response = await fetch(QUERY_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, params: [] }),
  });
  const json = await response.json();
  if (!json.success) throw new Error(json.error || 'Query failed');
  return (json.data || []).map(mapRowToDonorCard);
}
