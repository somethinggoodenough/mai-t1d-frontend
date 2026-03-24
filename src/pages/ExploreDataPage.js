import React, { useState } from 'react';
import Slider from '@mui/material/Slider';
import { fetchDonors } from '../utils/donorQuery';
import './ExploreDataPage.css';

const FILTER_SECTIONS = [
  { key: 'donor', label: 'Donor Information' },
  { key: 'sample', label: 'Sample Information' },
  { key: 'model', label: 'Model Information' },
];

const DENSITY_OPTIONS = ['Sparse', 'Normal', 'Dense'];

const AGE_GROUPS = [
  { key: 'infancy', label: 'Infancy', min: 0, max: 1, step: 0.1, minLabel: '14 mo', maxLabel: '1 yr' },
  { key: 'childhood', label: 'Childhood', min: 1, max: 12, step: 1, minLabel: '1 yr', maxLabel: '12 yr' },
  { key: 'adolescence', label: 'Adolescence', min: 12, max: 18, step: 1, minLabel: '12 yr', maxLabel: '18 yr' },
  { key: 'adult', label: 'Adult', min: 18, max: 65, step: 1, minLabel: '18 yr', maxLabel: '65 yr' },
];

const CLINICAL_DIAGNOSIS_OPTIONS = [
  'T1DM', 'T1D Control', 'T1DM (recent DKA)', 'T1DM Recent onset',
  'Recent T1DM Unsuspected', 'T2DM Gastric Bypass', 'T2DM Polycystic Ovaries',
];

const T1D_STAGE_OPTIONS = ['Stage 1', 'Stage 2', 'Stage 3', 'No Stage'];

const DISEASE_STATUS_OPTIONS = ['AAB+', 'ATDM', 'ND', 'T1D', 'T2D'];

const AUTO_ANTIBODY_OPTIONS = ['GADA', 'IA-2', 'IAA', 'ZnT8'];

const AUTO_ANTIBODY_POSITIVE_OPTIONS = ['0', '1', '2', '3', '4'];

const FEATURE_OPTIONS = ['Protein/ADT', 'RNA', 'scRNA', 'ATAC', 'scATAC'];

const CELL_TYPE_OPTIONS = [
  'Alpha', 'Beta', 'Exocrine', 'Immune Lineage', 'CD45+', 'B Cell',
  'CD4 + T Cell', 'CD 8 + T Cell & Antigen', 'T Cell', 'CD3+',
];

const PROCESSING_TYPE_OPTIONS = ['FFPE', 'OCT'];

const DATA_MODALITY_OPTIONS = [
  'BCR-seq', 'Bulk ATAC-seq', 'BulkRNA-seq', 'CITE-seq Protein',
  'Calcium Imaging', 'CODEX', 'IMC', 'Flow Cytometry',
  'scRNA-seq', 'TCR-seq', 'snMultiomics', 'Histology',
  'Perifusion', 'Oxygen Consumption',
];

const inactiveSliderSx = {
  color: '#a5a5a5', height: 8, padding: '4px 0',
  '& .MuiSlider-thumb': { width: 12, height: 12, backgroundColor: '#a5a5a5', '&:hover, &.Mui-focusVisible': { boxShadow: '0 0 0 4px rgba(165,165,165,0.2)' } },
  '& .MuiSlider-track': { backgroundColor: '#a5a5a5', border: 'none' },
  '& .MuiSlider-rail': { backgroundColor: '#a5a5a5', opacity: 0.4 },
};

const activeSliderSx = {
  color: '#406eb4', height: 8, padding: '4px 0',
  '& .MuiSlider-thumb': { width: 12, height: 12, backgroundColor: '#406eb4', '&:hover, &.Mui-focusVisible': { boxShadow: '0 0 0 4px rgba(64,110,180,0.2)' } },
  '& .MuiSlider-track': { backgroundColor: '#406eb4', border: 'none' },
  '& .MuiSlider-rail': { backgroundColor: '#d9e2f0', opacity: 1 },
};

const CheckIcon = () => (
  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
    <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6.5" stroke="#a5a5a5" strokeWidth="1.2" />
    <path d="M8 7.2V11" stroke="#a5a5a5" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="8" cy="5.2" r="0.7" fill="#a5a5a5" />
  </svg>
);

function FilterCheckbox({ checked, onChange, label, extraIcon }) {
  return (
    <label className={`filter-cb-label ${checked ? 'filter-cb-checked' : ''}`}>
      <input type="checkbox" checked={checked} onChange={onChange} className="filter-cb-input" />
      <span className={`filter-cb-box ${checked ? 'filter-cb-box-active' : ''}`}>
        {checked && <CheckIcon />}
      </span>
      <span className="filter-cb-text">{label}</span>
      {extraIcon && <span className="filter-cb-extra-icon">{extraIcon}</span>}
    </label>
  );
}

function FilterSliderRow({ checked, onCheck, label, value, min, max, step, onChange, minLabel, maxLabel }) {
  return (
    <div className="filter-slider-row">
      <label className={`filter-cb-label ${checked ? 'filter-cb-checked' : ''}`}>
        <input type="checkbox" checked={checked} onChange={onCheck} className="filter-cb-input" />
        <span className={`filter-cb-box ${checked ? 'filter-cb-box-active' : ''}`}>
          {checked && <CheckIcon />}
        </span>
        <span className="filter-cb-text">{label}</span>
      </label>
      <div className="filter-slider-container">
        <Slider
          value={value}
          min={min}
          max={max}
          step={step || 1}
          onChange={(_, val) => onChange(val)}
          disableSwap
          size="small"
          sx={checked ? activeSliderSx : inactiveSliderSx}
        />
        <div className="filter-slider-labels">
          <span className={checked ? 'filter-label-active' : ''}>{minLabel}</span>
          <span className={checked ? 'filter-label-active' : ''}>{maxLabel}</span>
        </div>
      </div>
    </div>
  );
}

function RelationToggle({ value, onChange }) {
  return (
    <div className="relation-toggle">
      <button
        className={`relation-btn ${value === 'or' ? 'relation-btn-active' : ''}`}
        onClick={() => onChange('or')}
      >or</button>
      <button
        className={`relation-btn ${value === 'and' ? 'relation-btn-active' : ''}`}
        onClick={() => onChange('and')}
      >and</button>
    </div>
  );
}

const INITIAL_DONOR_FILTERS = {
  age: { infancy: false, childhood: false, adolescence: false, adult: false },
  ageRanges: { infancy: [0, 1], childhood: [1, 12], adolescence: [12, 18], adult: [18, 65] },
  sex: { Female: false, Male: false },
  bmiChecked: false,
  bmiRange: [0, 60],
  hba1cChecked: false,
  hba1cRange: [4.4, 14],
  clinicalDiagnosis: {},
  t1dStage: {},
  diseaseStatus: {},
  diseaseDurationKnown: false,
  diseaseDurationRange: [0, 25],
  diseaseDurationUnknown: false,
  autoAntibody: {},
  autoAntibodyRelation: 'or',
  autoAntibodyPositive: {},
};

const INITIAL_SAMPLE_FILTERS = {
  feature: {},
  featureRelation: 'and',
  cellType: {},
  cellTypeRelation: 'and',
  processingType: {},
  processingTypeRelation: 'or',
  dataModality: {},
  dataModalityRelation: 'and',
};

function DonorCard({ donor }) {
  return (
    <article className="donor-card">
      <h3 className="donor-card-title">{donor.id}</h3>

      <div className="donor-card-body">
        <div className="donor-card-topline">
          <div className="donor-card-inline-pair">
            <span className="donor-card-label">Age</span>
            <span className="donor-card-value">{donor.age}</span>
          </div>
          <div className="donor-card-inline-pair">
            <span className="donor-card-label">Sex</span>
            <span className="donor-card-value">{donor.sex}</span>
          </div>
          <div className="donor-card-inline-pair">
            <span className="donor-card-label">BMI</span>
            <span className="donor-card-value">{donor.bmi}</span>
          </div>
        </div>

        <div className="donor-card-detail-list">
          <div className="donor-card-detail-row">
            <span className="donor-card-label">Disease Status</span>
            <span className="donor-card-value">{donor.diseaseStatus}</span>
          </div>
          <div className="donor-card-detail-row">
            <span className="donor-card-label">Program</span>
            <span className="donor-card-value">{donor.program}</span>
          </div>
          <div className="donor-card-detail-row">
            <span className="donor-card-label">Cell Type</span>
            <span className="donor-card-value">{donor.cellType}</span>
          </div>
          <div className="donor-card-detail-row">
            <span className="donor-card-label">Region</span>
            <span className="donor-card-value">{donor.region}</span>
          </div>
        </div>
      </div>

      <div className="donor-card-actions">
        <button type="button" className="donor-card-btn donor-card-btn-secondary">Preview</button>
        <button type="button" className="donor-card-btn donor-card-btn-primary">Save</button>
      </div>
    </article>
  );
}

export default function ExploreDataPage() {
  const [openSections, setOpenSections] = useState({});
  const [density, setDensity] = useState('Normal');
  const [filters, setFilters] = useState(INITIAL_DONOR_FILTERS);
  const [sampleFilters, setSampleFilters] = useState(INITIAL_SAMPLE_FILTERS);
  const [donorCards, setDonorCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [queryError, setQueryError] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleFilter = (group, key) => {
    setFilters((prev) => ({
      ...prev,
      [group]: { ...prev[group], [key]: !prev[group][key] },
    }));
  };

  const setFilterValue = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSampleFilter = (group, key) => {
    setSampleFilters((prev) => ({
      ...prev,
      [group]: { ...prev[group], [key]: !prev[group][key] },
    }));
  };

  const setSampleFilterValue = (key, value) => {
    setSampleFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClear = () => {
    setFilters(INITIAL_DONOR_FILTERS);
    setSampleFilters(INITIAL_SAMPLE_FILTERS);
    setDonorCards([]);
    setQueryError(null);
    setShowResults(false);
  };

  const handleApply = async () => {
    setIsLoading(true);
    setQueryError(null);
    setShowResults(true);
    try {
      const cards = await fetchDonors(filters, sampleFilters);
      setDonorCards(cards);
    } catch (err) {
      setQueryError(err.message || 'Failed to fetch donors');
      setDonorCards([]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderToggleCheckboxGroup = (title, options, stateKey, relationKey, stateObj, toggleFn, setValFn) => (
    <div className="filter-group">
      <div className="filter-group-header-row">
        <span className="filter-group-header">{title}</span>
        <RelationToggle
          value={stateObj[relationKey]}
          onChange={(val) => setValFn(relationKey, val)}
        />
      </div>
      <div className="filter-cb-grid">
        {options.map((opt) => (
          <FilterCheckbox
            key={opt}
            checked={!!stateObj[stateKey][opt]}
            onChange={() => toggleFn(stateKey, opt)}
            label={opt}
          />
        ))}
      </div>
    </div>
  );

  const renderSampleFilters = () => (
    <>
      {renderToggleCheckboxGroup('Feature', FEATURE_OPTIONS, 'feature', 'featureRelation', sampleFilters, toggleSampleFilter, setSampleFilterValue)}
      {renderToggleCheckboxGroup('Cell Type', CELL_TYPE_OPTIONS, 'cellType', 'cellTypeRelation', sampleFilters, toggleSampleFilter, setSampleFilterValue)}
      {renderToggleCheckboxGroup('Processing Type', PROCESSING_TYPE_OPTIONS, 'processingType', 'processingTypeRelation', sampleFilters, toggleSampleFilter, setSampleFilterValue)}
      {renderToggleCheckboxGroup('Data Modality', DATA_MODALITY_OPTIONS, 'dataModality', 'dataModalityRelation', sampleFilters, toggleSampleFilter, setSampleFilterValue)}
    </>
  );

  const renderDonorFilters = () => (
    <>
      {/* Age */}
      <div className="filter-group">
        <div className="filter-group-header">Age</div>
        <div className="filter-group-rows">
          {AGE_GROUPS.map(({ key, label, min, max, step, minLabel, maxLabel }) => (
            <FilterSliderRow
              key={key}
              checked={filters.age[key]}
              onCheck={() => toggleFilter('age', key)}
              label={label}
              value={filters.ageRanges[key]}
              min={min}
              max={max}
              step={step}
              onChange={(val) => setFilters((p) => ({ ...p, ageRanges: { ...p.ageRanges, [key]: val } }))}
              minLabel={minLabel}
              maxLabel={maxLabel}
            />
          ))}
        </div>
      </div>

      {/* Sex */}
      <div className="filter-group">
        <div className="filter-group-header">Sex</div>
        <div className="filter-cb-grid">
          {['Female', 'Male'].map((opt) => (
            <FilterCheckbox
              key={opt}
              checked={!!filters.sex[opt]}
              onChange={() => toggleFilter('sex', opt)}
              label={opt}
            />
          ))}
        </div>
      </div>

      {/* BMI */}
      <div className="filter-group">
        <div className="filter-group-header">BMI</div>
        <div className="filter-slider-row filter-slider-row-single">
          <label className={`filter-cb-label filter-cb-label-narrow ${filters.bmiChecked ? 'filter-cb-checked' : ''}`}>
            <input type="checkbox" checked={filters.bmiChecked} onChange={() => setFilterValue('bmiChecked', !filters.bmiChecked)} className="filter-cb-input" />
            <span className={`filter-cb-box ${filters.bmiChecked ? 'filter-cb-box-active' : ''}`}>
              {filters.bmiChecked && <CheckIcon />}
            </span>
          </label>
          <div className="filter-slider-container filter-slider-container-wide">
            <Slider
              value={filters.bmiRange}
              min={0}
              max={60}
              step={0.1}
              onChange={(_, val) => setFilterValue('bmiRange', val)}
              disableSwap
              size="small"
              sx={filters.bmiChecked ? activeSliderSx : inactiveSliderSx}
            />
            <div className="filter-slider-labels">
              <span className={filters.bmiChecked ? 'filter-label-active' : ''}>{filters.bmiRange[0]}</span>
              <span className={filters.bmiChecked ? 'filter-label-active' : ''}>{filters.bmiRange[1].toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* HbA1c */}
      <div className="filter-group">
        <div className="filter-group-header">HbA1c</div>
        <div className="filter-slider-row filter-slider-row-single">
          <label className={`filter-cb-label filter-cb-label-narrow ${filters.hba1cChecked ? 'filter-cb-checked' : ''}`}>
            <input type="checkbox" checked={filters.hba1cChecked} onChange={() => setFilterValue('hba1cChecked', !filters.hba1cChecked)} className="filter-cb-input" />
            <span className={`filter-cb-box ${filters.hba1cChecked ? 'filter-cb-box-active' : ''}`}>
              {filters.hba1cChecked && <CheckIcon />}
            </span>
          </label>
          <div className="filter-slider-container filter-slider-container-wide">
            <Slider
              value={filters.hba1cRange}
              min={4.4}
              max={14}
              step={0.1}
              onChange={(_, val) => setFilterValue('hba1cRange', val)}
              disableSwap
              size="small"
              sx={filters.hba1cChecked ? activeSliderSx : inactiveSliderSx}
            />
            <div className="filter-slider-labels">
              <span className={filters.hba1cChecked ? 'filter-label-active' : ''}>{filters.hba1cRange[0].toFixed(1)}</span>
              <span className={filters.hba1cChecked ? 'filter-label-active' : ''}>{filters.hba1cRange[1].toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Diagnosis */}
      <div className="filter-group">
        <div className="filter-group-header">Clinical Diagnosis</div>
        <div className="filter-cb-grid">
          {CLINICAL_DIAGNOSIS_OPTIONS.map((opt) => (
            <FilterCheckbox
              key={opt}
              checked={!!filters.clinicalDiagnosis[opt]}
              onChange={() => toggleFilter('clinicalDiagnosis', opt)}
              label={opt}
            />
          ))}
        </div>
      </div>

      {/* T1D Stage */}
      <div className="filter-group">
        <div className="filter-group-header">T1D Stage</div>
        <div className="filter-cb-grid">
          {T1D_STAGE_OPTIONS.map((opt) => (
            <FilterCheckbox
              key={opt}
              checked={!!filters.t1dStage[opt]}
              onChange={() => toggleFilter('t1dStage', opt)}
              label={opt}
              extraIcon={<InfoIcon />}
            />
          ))}
        </div>
      </div>

      {/* Disease Status */}
      <div className="filter-group">
        <div className="filter-group-header">Disease Status</div>
        <div className="filter-cb-grid">
          {DISEASE_STATUS_OPTIONS.map((opt) => (
            <FilterCheckbox
              key={opt}
              checked={!!filters.diseaseStatus[opt]}
              onChange={() => toggleFilter('diseaseStatus', opt)}
              label={opt}
            />
          ))}
        </div>
      </div>

      {/* Disease Duration */}
      <div className="filter-group">
        <div className="filter-group-header">Disease Duration</div>
        <div className="filter-group-rows">
          <FilterSliderRow
            checked={filters.diseaseDurationKnown}
            onCheck={() => setFilterValue('diseaseDurationKnown', !filters.diseaseDurationKnown)}
            label="Known"
            value={filters.diseaseDurationRange}
            min={0}
            max={25}
            step={1}
            onChange={(val) => setFilterValue('diseaseDurationRange', val)}
            minLabel="0 yr"
            maxLabel="25 yr"
          />
          <FilterCheckbox
            checked={filters.diseaseDurationUnknown}
            onChange={() => setFilterValue('diseaseDurationUnknown', !filters.diseaseDurationUnknown)}
            label="Unknown"
          />
        </div>
      </div>

      {/* Auto Antibody */}
      <div className="filter-group">
        <div className="filter-group-header-row">
          <span className="filter-group-header">Auto Antibody</span>
          <RelationToggle
            value={filters.autoAntibodyRelation}
            onChange={(val) => setFilterValue('autoAntibodyRelation', val)}
          />
        </div>
        <div className="filter-cb-grid">
          {AUTO_ANTIBODY_OPTIONS.map((opt) => (
            <FilterCheckbox
              key={opt}
              checked={!!filters.autoAntibody[opt]}
              onChange={() => toggleFilter('autoAntibody', opt)}
              label={opt}
            />
          ))}
        </div>
      </div>

      {/* Auto Antibody Positive */}
      <div className="filter-group">
        <div className="filter-group-header">Auto Antibody Positive</div>
        <div className="filter-cb-grid">
          {AUTO_ANTIBODY_POSITIVE_OPTIONS.map((opt) => (
            <FilterCheckbox
              key={opt}
              checked={!!filters.autoAntibodyPositive[opt]}
              onChange={() => toggleFilter('autoAntibodyPositive', opt)}
              label={opt}
            />
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="explore-data-page">
      {/* Toolbar row */}
      <div className="explore-toolbar">
        <div className="toolbar-left">
          <span className="filters-heading">Filters</span>
          <div className="toolbar-buttons">
            <button className="btn-clear" onClick={handleClear}>Clear</button>
            <button className="btn-apply" onClick={handleApply}>Apply</button>
          </div>
        </div>
        <div className="toolbar-right">
          <div className="density-toggle">
            {DENSITY_OPTIONS.map((opt) => (
              <button
                key={opt}
                className={`density-option ${density === opt ? 'density-active' : ''}`}
                onClick={() => setDensity(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="explore-body">
        {/* Left sidebar */}
        <aside className="filter-sidebar">
          {FILTER_SECTIONS.map(({ key, label }) => {
            const isOpen = !!openSections[key];
            return (
              <div key={key} className="filter-section">
                <button
                  className={`filter-section-header ${isOpen ? 'filter-section-header-open' : ''}`}
                  onClick={() => toggleSection(key)}
                  aria-expanded={isOpen}
                >
                  <span className="filter-section-label">{label}</span>
                  <svg
                    className={`chevron-icon ${isOpen ? 'chevron-open' : ''}`}
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M6 9L12 15L18 9" stroke="#2c2c2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="filter-section-body">
                    {key === 'donor' && renderDonorFilters()}
                    {key === 'sample' && renderSampleFilters()}
                    {key === 'model' && <p className="filter-placeholder">Filters coming soon</p>}
                  </div>
                )}
              </div>
            );
          })}
        </aside>

        {/* Main content area */}
        <main className="explore-content">
          {!showResults && (
            <div className="explore-empty-state">
              <p className="explore-empty-text">Apply filters to search donor cards.</p>
            </div>
          )}
          {showResults && isLoading && (
            <div className="explore-empty-state">
              <p className="explore-empty-text">Loading donors...</p>
            </div>
          )}
          {showResults && !isLoading && queryError && (
            <div className="explore-empty-state">
              <p className="explore-empty-text">Error: {queryError}</p>
            </div>
          )}
          {showResults && !isLoading && !queryError && donorCards.length === 0 && (
            <div className="explore-empty-state">
              <p className="explore-empty-text">No donors match the selected filters.</p>
            </div>
          )}
          {showResults && !isLoading && !queryError && donorCards.length > 0 && (
            <div className={`donor-results donor-results-${density.toLowerCase()}`}>
              {donorCards.map((donor) => (
                <DonorCard key={donor.id} donor={donor} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
