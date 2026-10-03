# Taxonomy source investigation

Research date: 3 October 2026. Machine-readable research records: `data/metadata/taxonomy_source_registry.json`; checksum-bound source metadata is included in the canonical supply publication. A research entry is not an ingested reference.

## Connected reference

The existing [MoSPI NIC 2008 Sixth Economic Census reference](https://mospi.gov.in/sites/default/files/6ec_dirEst/ec6_nic_2008_code.html) is reused: 332 entries, comprising 19 sections, 82 divisions and 231 groups. Status `PARTIALLY_VERIFIED`, version NIC-2008. Classes/subclasses and the missing parent division 02 are not invented. Raw snapshot/checksum and source evidence already exist from Phase 2.5.

The explorer distinguishes these industrial classification entries from observed intelligence. NIC presence establishes neither occupation demand nor PMKVY course alignment. No NIC↔NCO/NOS crosswalk was ingested.

## NCO 2015

Publisher: Directorate General of Employment. Purpose: occupation classification; version 2015. Status `REQUIRES_PERMISSION`, no connected rows/checksum. The [DGE website policy](https://dge.gov.in/website-policy) requires permission for partial/full reproduction. None was obtained. No mirror, title-derived code or copied NCO dataset was used. This is an access/permission limitation for this implementation, not a claim that NCO does not exist.

## NSQF / NQR / NCVET

Investigated [NQR qualification search](https://www.nqr.gov.in/qualifications-search), [NSQF](https://ncvet.gov.in/wp-content/uploads/2023/07/National-Skills-Qualification-Framework-notification-June-2023.pdf), [NCVET NOS/micro-credential guidelines](https://www.ncvet.gov.in/wp-content/uploads/2023/07/Guidelines-for-Development-Approval-Usage-of-National-Occupational-Standards-NOS-Micro-Credentials-MC.pdf), and the [Kaushalverse repository](https://www.kaushalverse.ncvet.gov.in/homepage/repository).

NQR source status `REFERENCE_ONLY`: publicly accessible reference material was inspected, but no qualification acquisition adapter or canonical rows were published. [NQR copyright policy](https://www.nqr.gov.in/copyright-policy) permits accurate attributed reproduction of its own material and excludes material explicitly under third-party copyright. This does not make every awarding-body file blocked, nor establish a bulk license for every file. Document/version/rights, archive/current status and the migration to Kaushalverse still need review.

A specific [NASSCOM qualification file](https://www.nqr.gov.in/qualification/file/SSC%20Q0802%20IT%20Software%20Solution%20for%20Business%20Qualification%20File%20V1.0.pdf) was examined as a research example. It distinguishes qualification ID, NSQF level and NOS identifiers, and its NCO/ISCO-alignment field reports NCO-2015/NIL. That is not a verified NCO crosswalk. Its review date, validity and awarding-body document status need resolution before canonical ingestion. No codes from that file were added to production data.

NSQF describes qualification levels, not labour demand, worker availability or seat capacity. It is not interchangeable with a skill code or occupation code.

## NSDC / SSC NOS and QP

Investigated the official [NSDC standards endpoint](https://nsdcindia.org/nos). Fetch was unsuccessful in this run. Status `UNAVAILABLE` means not ingested here; it does not assert that all standards are inaccessible. Per-file versions/rights and authoritative relationships remain unestablished. No third-party mirror was acquired.

## Publication outcome

- Occupation references: empty, unavailable.
- Skill/NOS references: empty, unavailable.
- Qualification/QP/job-role references: empty, unavailable.
- Mapping relationships: empty, unavailable.
- Industrial reference: 332 existing partial NIC entries, reference-only presentation.

The typed contracts and isolated model tests support future reviewed ingestion; they are not evidence of connected taxonomy coverage. All unavailable research records retain null checksum/artifact fields rather than fabricated evidence. Only the NIC publication receives an actual raw hash through the existing source receipt.
