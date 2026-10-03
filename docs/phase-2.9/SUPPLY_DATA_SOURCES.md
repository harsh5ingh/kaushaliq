# Connected training sources

## PMKVY output — reused

Publisher: MSDE, disseminated by PIB. Dataset: [Redesigning PMKVY Courses, Annexure I](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2297203&lang=1&reg=3). Source ID `pmkvy-pib-2026`; publication 10 August 2026; observations FY2023-24 through FY2026-27, as of 30 June 2026. FY2026-27 is partial, not a full-year estimate.

287 validated administrative trained/certified observations are reused unchanged: 7 country records and 280 State/UT records (35 entities × four fiscal years × two metrics). The FY2024-25 country trained total is excluded, not repaired. Lakshadweep is absent from this activity table.

These are reported programme activity counts. Trained does not mean available workers; certified does not mean employed workers; same-year trained and certified totals need not describe the same cohort. No certification conversion, employment supply or annual seat-capacity calculation is made.

Raw: `data/raw/training/pib-2297203.html`; SHA-256 `65c46dac2c9db5c24ba4fb6251fa1857516913e4612c29c5c88ec42695134719`.

## PMKVY infrastructure — newly connected

Publisher: MSDE, disseminated by PIB. Dataset: [Skilling for Space and Geospatial Sectors, Annexure II](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2289890&lang=1&reg=3). Source ID `pmkvy-centres-pib-2026`; publication 27 July 2026; point observation/as-of 30 June 2026. Explicit acquisition on 3 October 2026; timestamp, final URL, bytes and checksum are in the immutable receipt.

36 State/UT PMKVY training-centre counts were acquired, schema-checked and normalized. Only the PMKVY centre column is ingested. The NAPS establishment column and other sector-related tables are excluded. The release title is not used to infer sector-specific centre allocation.

Examples used for verification: Andhra Pradesh 527, Karnataka 436, Uttar Pradesh 2,664, Lakshadweep 1. Andhra Pradesh's original `527$` cell is preserved. The `$` footnote states that six Konaseema centres are included; they are not added again or published as a district observation. No national centre total is published or manufactured.

Raw: `data/raw/training/pib-centres-2289890.html`, 753,113 bytes; SHA-256 `d6063f7a3075ec43c0e4350b158684d3dfd157b4fe4a7b8c03929d0987a471d2`. Receipt is the adjacent `.receipt.json` artifact. The source registry is `data/metadata/supply_source_registry.json`.

## Access and interpretation

Acquisition is a fixed public HTTPS snapshot, not a real-time feed. Updates are release-based/irregular. The [PIB copyright policy](https://www.pib.gov.in/content/3604_2_CopyrightPolicy.aspx?lang=1&reg=3) requires accurate, nonmisleading use and source attribution; third-party material is excluded from its general permission. This release is retained with publisher/dataset attribution. No blanket CC/GODL license is claimed.

TRAINING_CENTRES measures infrastructure. It does not establish operational status, seats, course availability, annual throughput, district allocation, occupation composition or current available workers. These dimensions remain unavailable. Existing geography identities are reused, with source labels and normalization evidence preserved.
