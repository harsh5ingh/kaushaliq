# Demand sources — Phase 2.8

## Actually acquired and validated

Source `ncs-active-pib-2025`: Ministry of Labour & Employment / National Career Service, disseminated by Press Information Bureau. Dataset: State/UT Annexure of active employers and vacancies. [Release 2147927](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2147927&reg=48&lang=2), published 24 July 2025. Observation date: **14 July 2025**, not the publication or retrieval date. Access: an explicitly reviewed HTTPS HTML download, not a portal scraper, API feed or job-record acquisition. Frequency: ad-hoc parliamentary publication; no guaranteed update schedule.

Only the exact **Active Vacancies** column is ingested. The employer column, approximate headline figures and jobseeker registrations are excluded. The Annexure contains 39 geography buckets and one national total. Three source dashes remain unavailable; 37 numeric records are published. This is observed administrative portal stock, not hires, unique jobs, a national vacancy census or real-time demand. Repost/duplicate/partner coverage treatment is not quantified by this publication. No occupation, skills, sector, district or employer-record breakdown exists in this snapshot.

Raw artifact: `data/raw/ncs/ncs-active-vacancies-2025-07-14.html`, 260789 bytes, retrieved `2026-10-03T10:00:43.247567+00:00`; adjacent receipt binds the source URL, final URL and SHA-256 `2947d1e2d741a85f1b237966e47a01270b35a582188c93352139752686b6a4f3`. Acquisition never overwrites a cached artifact. Internal raw locations are not returned by public APIs.

Reuse assessment: [PIB copyright policy](https://www.pib.gov.in/content/3604_2_CopyrightPolicy.aspx?lang=1&reg=3) permits accurate, nonmisleading attributed reproduction of its content and excludes third-party material from that permission. This is an official PIB-distributed ministerial release; source attribution remains visible. This is **not** a blanket GODL/CC licence, permission for arbitrary NCS portal scraping, or a government affiliation claim. Reassess rights if another publisher/material type is introduced.

Terms artifact `pib-terms-demand-2026`: `data/raw/terms/pib-demand-copyright-2026-10-03.html`, 137982 bytes, SHA-256 `7d7e940673f59fc4da266d9d61b166a81e241913155f840f8cc9f49454bae853`. This validates the terms assessment and is not a labour observation. The source registry contains publication and terms metadata, including observation/publication date, publisher, access method, geography, methodology, classification absence, update frequency and limitations.

## Investigated; not connected as demand

- [NCS statistics interface](https://www.ncs.gov.in/_layouts/15/ncsp/ViewStaticReport.aspx): no approved documented record-level current vacancy API/schema/licence was established. No uncontrolled scrape or fabricated current feed. Rounded cumulative vacancies-mobilised releases are not substituted for exact active-vacancy stock.
- [DGE NCO-2015](https://dge.gov.in/) and [website policy](https://dge.gov.in/website-policy): authoritative taxonomy candidate; policy requires permission for reproduction. Bulk permission-reviewed ingestion and a demand crosswalk remain pending. Public visibility is not proof of reuse permission. No title similarity is treated as an NCO mapping.
- [National Qualification Register](https://nqr.gov.in/aboutus) and [qualification search](https://www.nqr.gov.in/qualifications-search): NSQF qualification/NOS candidate, not demand data. Versioned extraction, access/reuse assessment and a documented occupation/demand crosswalk remain unestablished. Nothing ingested or assigned as an authoritative skill code.
- NSDC/NOS/SSC: official standards candidates; acquisition, version/reuse review and explicit crosswalk evidence remain pending. Qualification standards do not measure skill mentions or demand.
- [e-Shram](https://eshram.gov.in/): registrations concern unorganised workers, not vacancy demand. No worker data ingested; private registrant details are out of scope.
- Existing PLFS and PMKVY: retained from Phase 2.5, respectively labour-force supply context and administrative training counts. Neither becomes a vacancy series or compatible workforce supply/capacity simply by subtraction. Existing partial NIC references are classifications, not observed sector demand.

No additional source is claimed integrated or unavailable globally: these limitations describe **KaushalIQ's ingested coverage and verified access assessment**, not proof that no other public data exists.

## Reproduce

From `backend`, use `python -m src.data_pipeline.acquire --registry ../data/metadata/demand_source_registry.json`, then `python -m src.demand.build`. Cached snapshots are checksum-verified; publication is offline and deterministic. A new source/version requires a new reviewed registry/artifact and adapter review, not overwrite of the existing raw snapshot.
