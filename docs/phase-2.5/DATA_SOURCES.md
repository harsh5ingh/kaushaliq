# Phase 2.5 public sources

Research and retrieval: 3 October 2026 (India time). This release connects historical aggregates, not a real-time national labour-market feed. Registry: [source_registry.json](../../data/metadata/source_registry.json). Machine-readable connected status, exact retrieval timestamps and checksums are in the canonical snapshot and per-file receipts. A source is connected only after acquisition and validation.

## Connected

### MoSPI PLFS national series

[PIB release 2057970](https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=2057970&lang=2&reg=48), 23 September 2024. Publisher: MoSPI, distributed by PIB. Tables 1–6, ages 15+, 2017-18 through 2023-24 (July–June), LFPR/WPR/UR, usual status (ps+ss) and current weekly status, male/female/persons, rural/urban/combined. 378 rates. Unit: percentage, with different denominators for unemployment and participation/employment. Annual publication; cached HTML acquisition, offline extraction.

[PIB copyright policy](https://www.pib.gov.in/content/3604_2_CopyrightPolicy.aspx?lang=1&reg=3) permits accurate reproduction with prominent acknowledgement, excludes third-party material and misleading use. This policy is recorded; no CC/GODL licence is invented.

### MoSPI PLFS Annual Report 2023-24

[Official PDF](https://www.mospi.gov.in/sites/default/files/publication_reports/AnnualReport_PLFS2023-24L2.pdf), 572 PDF pages. Only tables 16, 17, 18 for ages 15+ usual status are ingested: PDF pages 125, 130, 135 / printed A-62, A-67, A-72. 36 states/UTs, 963 rates. National rows are cross-checked against PIB and not duplicated. Chandigarh rural cells are blank, not zero. No district/city extrapolation or individual microdata.

[MoSPI FAQ](https://mospi.gov.in/faq) identifies aggregate publications as free, open-access Category A. Open access is documented as such, not asserted to be a blanket commercial redistribution licence. Attribution retained; deployment should review applicable publication/portal terms separately. No personal unit-level data is ingested.

PLFS changed its sampling/design from January 2025: [official changes](https://mospi.gov.in/sites/default/files/publication_reports/PLFS_Changes-in-2025_rev.pdf). This release deliberately does not stitch newer observations to the historical series.

### NIC-2008 reference

[MoSPI Sixth Economic Census reference](https://mospi.gov.in/sites/default/files/6ec_dirEst/ec6_nic_2008_code.html). Published UTF-16 HTML, 19 sections, 82 divisions, 231 groups (332 entries). This is **partial**, not the complete NIC classification. Classes/subclasses absent. Division 02 absent even though groups 021–024 appear; parents remain null with evidence rather than invented rows. One HTML label contains a stray `>`; normalization is explicit. Hierarchy uses actual zero-padded code prefixes rather than display order.

NIC-2008 is chosen for historical PLFS compatibility, not claimed to be the newest classification. Public official aggregate/reference access; explicit standalone redistribution licence not found. No GODL/CC claim. No skill/occupation/industry mappings or demand values inferred.

### PMKVY training counts

[MSDE PIB release 2297203](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2297203&lang=1&reg=3), 10 August 2026. Annexure I: 35 states/UTs plus national total, FY2023-24 through FY2026-27; trained/certified persons, as of 30 June 2026. FY2026-27 partial. Ad-hoc parliamentary release, not a guaranteed recurring API. Published duplicate desktop/mobile tables are deduplicated only when identical. Sector Annexure II is not ingested.

287 accepted observations. National FY2024-25 trained total 2,038,319 differs from state-row sum 2,038,199 by 120. That national total is quarantined, not corrected or displayed. Lakshadweep absent. Certifications can refer to prior cohorts: certified may exceed trained in a year. No conversion rate, seats, capacity, placements or skill demand inferred. PIB reproduction policy applies with acknowledgement.

## Identified, not connected

- **NCO-2015 / DGE:** [official Volume I](https://www.dge.gov.in/sites/default/files/2024-05/National_Classification_of_Occupations_Vol_I-2015.pdf). [DGE website policy](https://dge.gov.in/website-policy) requires due permission for reproduction. Permission and validated extraction pending; no bulk occupation table ingested. Codes/skill levels not fabricated.
- **NSDC NOS/QP:** [official standards](https://nsdcindia.org/nos). Competency/qualification taxonomy, version and retirement status matter. Machine-readable acquisition, coverage and reuse terms unresolved. Taxonomy does not establish demand.
- **Training capacity/centres/courses:** MSDE/Skill India investigated; connected PMKVY publication contains counts only. Capacity/seat/enrolment/placement tables not verified here.
- **LGD geography:** [official resource](https://data.gov.in/resource/local-government-directory-lgd-districts). Retrieval unavailable during research. No LGD/Census codes adopted. Dataset-specific licence/schema must be checked before ingestion.
- **Survey of India boundaries:** [official portal](https://onlinemaps.surveyofindia.gov.in/AboutPortal.aspx). Administrative boundary products identified. Actual files, applicable product licence, CRS, vintage and update date not verified/downloaded. No third-party substitute or approximate India polygon published as authoritative GIS.
- **Demand:** [NCS vacancies release](https://www.pib.gov.in/PressReleaseIframePage.aspx?PRID=2198745&lang=2&reg=48), [employment exchange statistics](https://ncs.gov.in/EExStats). Mobilised/advertised vacancies are not hires or a census of national demand. Voluntary coverage, duplicate/repost treatment, period and taxonomy require investigation. No validated record feed ingested. Do not derive demand from PLFS employment.

GODL applies to resources actually released under it, not automatically to every government web page. Source-specific access/reuse conditions remain explicit.
