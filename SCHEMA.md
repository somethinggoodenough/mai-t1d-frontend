# HPAP Metadata Storage README

## Overview

This project stores information from two original Excel workbooks:

1. `HPAP_metadata_final_updated.xlsx`
2. `HPAP_metadata_all_modalities_final.xlsx`

To preserve the structure of the original source files while making them easier to query in MySQL, each workbook was split by sheet, and the sheets were organized into two separate databases based on their content type:

* `donors` database
* `modalities` database

This design keeps the ingestion process simple and traceable: each worksheet in the original Excel files maps to one table in MySQL.

---

## Original Excel Files

### 1. `HPAP_metadata_final_updated.xlsx`

This workbook contains donor-level metadata and summary information.

Original sheets:

* `Metadata`
* `cell counts`
* `AAb_cPeptide_Metadata`
* `Summary by Diagnosis`

### 2. `HPAP_metadata_all_modalities_final.xlsx`

This workbook contains modality-level metadata across multiple assay and data types.

Original sheets:

* `Data Track`
* `Overview`
* `Summary`
* `Bulk ATAC-seq`
* `Bulk RNA-seq`
* `CITE-seq Protein`
* `Flow Cytometry`
* `snMultiomics`
* `scATAC-seq`
* `scRNA-seq`
* `IMC`
* `BCR-seq`
* `TCR-seq`
* `Perifusion`
* `Histology`
* `CyTOF`
* `CODEX`
* `Calcium Imaging`
* `Patch-seq`
* `Oxygen Consumption`

---

## Database Organization

## 1. `donors` database

The `donors` database stores sheets from `HPAP_metadata_final_updated.xlsx`, because these sheets primarily describe donor-level biological, clinical, and summary information.

### Tables in `donors`

| Original Excel Sheet    | Stored Table Name       |
| ----------------------- | ----------------------- |
| `Metadata`              | `Metadata`              |
| `cell counts`           | `cell_counts`           |
| `AAb_cPeptide_Metadata` | `AAb_cPeptide_Metadata` |
| `Summary by Diagnosis`  | `Summary_by_Diagnosis`  |

### Notes

* Table names were normalized slightly where needed for MySQL convenience.
* Spaces were replaced with underscores in some table names.
* Column names were preserved as closely as possible to the original sheet headers.
* When duplicate column names existed in Excel, they had to be disambiguated in CSV/MySQL form, for example `T1D stage_1` and `T1D stage_2`.

---

## 2. `modalities` database

The `modalities` database stores sheets from `HPAP_metadata_all_modalities_final.xlsx`, because these sheets describe assay-specific or modality-specific metadata.

### Tables in `modalities`

| Original Excel Sheet | Stored Table Name    |
| -------------------- | -------------------- |
| `Data Track`         | `Data_Track`         |
| `Overview`           | `Overview`           |
| `Summary`            | `Summary`            |
| `Bulk ATAC-seq`      | `Bulk_ATAC-seq`      |
| `Bulk RNA-seq`       | `Bulk_RNA-seq`       |
| `CITE-seq Protein`   | `CITE-seq_Protein`   |
| `Flow Cytometry`     | `Flow_Cytometry`     |
| `snMultiomics`       | `snMultiomics`       |
| `scATAC-seq`         | `scATAC-seq`         |
| `scRNA-seq`          | `scRNA-seq`          |
| `IMC`                | `IMC`                |
| `BCR-seq`            | `BCR-seq`            |
| `TCR-seq`            | `TCR-seq`            |
| `Perifusion`         | `Perifusion`         |
| `Histology`          | `Histology`          |
| `CyTOF`              | `CyTOF`              |
| `CODEX`              | `CODEX`              |
| `Calcium Imaging`    | `Calcium_Imaging`    |
| `Patch-seq`          | `Patch-seq`          |
| `Oxygen Consumption` | `Oxygen_Consumption` |

### Notes

* Table names were adjusted slightly when sheet names contained spaces.
* Column names were preserved from the original sheet headers.
* These tables are intended to represent modality-level records rather than donor-level master metadata.

---

## Storage Workflow

The storage process followed these steps.

### Step 1. Split the original Excel workbooks by sheet

Each worksheet in the two original Excel files was exported into an independent `.xlsx` or `.csv` file.

This made it easier to:

* inspect sheet-level structure
* define table schemas separately
* import each sheet into MySQL as an independent table

### Step 2. Separate donor-level and modality-level content

The split files were grouped into two logical databases:

* donor-oriented sheets -> `donors`
* modality-oriented sheets -> `modalities`

### Step 3. Create MySQL tables

For each sheet:

* one MySQL table was created
* the table schema was inferred from the sheet header and observed values
* original column names were preserved as much as possible

### Step 4. Import CSV files into MySQL

After table creation, the CSV versions of each sheet were imported using `LOAD DATA LOCAL INFILE`.

Example workflow:

```sql
USE donors;

LOAD DATA LOCAL INFILE '/home/ec2-user/HPAP_metadata_final_updated__Metadata.csv'
INTO TABLE `Metadata`
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;
```

The same pattern was used for each table in both databases.

---

## Why Two Databases?

The two databases reflect two different levels of organization in the original Excel sources.

### `donors`

Used for:

* donor-level metadata
* diagnosis summaries
* cell counts
* autoantibody and c-peptide metadata

### `modalities`

Used for:

* assay-specific metadata
* modality-specific files and records
* tracking data availability, storage, contacts, and source provenance

This separation makes downstream querying cleaner. For example:

* donor-centric questions can be answered from `donors`
* modality-centric questions can be answered from `modalities`

---

## Naming Conventions

### Table names

Table names were adapted slightly for SQL compatibility:

* spaces were often replaced with underscores
* sheet names were otherwise preserved as much as possible

### Column names

Column names were intentionally kept close to the original Excel headers, including:

* spaces
* parentheses
* symbols
* mixed capitalization

Because of this, SQL queries should use backticks around table names and column names.

Example:

```sql
SELECT `Donor ID`, `GADA(+/-)`
FROM `AAb_cPeptide_Metadata`
LIMIT 5;
```

---

## Important Caveats

1. Excel is a presentation format, not a database format.
   Some sheets may contain formatting-oriented fields, merged-cell legacy structures, or `Unnamed` columns that were preserved during import.

2. Duplicate column names in Excel must be disambiguated.
   MySQL does not allow duplicate column names in one table.

3. Some numeric-looking columns were imported as text when the raw values were mixed or inconsistent.
   This was done to avoid data loss during ingestion.

4. Table schemas were designed for faithful storage of the original files, not full normalization.
   Further cleaning and normalization can be done later depending on analysis goals.

---

## Summary

In short:

* `HPAP_metadata_final_updated.xlsx` was stored in the `donors` database
* `HPAP_metadata_all_modalities_final.xlsx` was stored in the `modalities` database
* each worksheet became one table
* the original Excel headers were preserved as much as possible
* data was imported sheet by sheet using CSV plus MySQL `LOAD DATA LOCAL INFILE`

This design prioritizes:

* traceability back to the original Excel files
* simple one-sheet-to-one-table mapping
* convenient SQL querying without overcomplicating the first-stage ingestion