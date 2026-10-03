# What KaushalIQ can answer

Machine source of truth: `data/metadata/demand_coverage.json` and GET `/api/v1/intelligence/demand/coverage`; pipeline-produced, not a manually checked feature list. `data/metadata/demand_source_registry.json` binds actual artifacts and terms.

Connected demand: NCS portal **active vacancies as of 14 July 2025**, published 24 July 2025. Exactly 37 numeric observations: national total, 33 matched State/UT records, 3 unresolved geography buckets. Geography mapping is 33 EXACT plus 1 DOCUMENTED (national Total alias), 3 UNMAPPED. Three dashes remain unavailable: Andaman and Nicobar Islands, Dadra and Nagar Haveli, Ladakh. No compatible observation exists for the current merged DNH/Daman&Diu entity.

National published total: 4,005,028 vacancies. Multi-state: 1,613,586; State not specified: 2,056,384; historical Daman and Diu: 6. These retain source labels and **must not be added again to the national total**. Assigned State/UT comparisons exclude all three unresolved buckets. National coverage means a national **portal** total, not exhaustive Indian vacancy coverage.

Native metric: `active_vacancies` / `vacancies` / OBSERVED administrative stock. Direction unavailable. Only one period; no trend/change rate. No occupational, skill, sector or district demand. No unique-job treatment, hiring outcomes, representative weighting or comprehensive demand denominator supplied.

Preserved existing observations: 1,341 PLFS rates, 287 PMKVY administrative counts, 332 partial NIC reference entries and 37 geography references. Their endpoints/publication are unchanged. Supply/training/reference roles remain distinct from demand. No private user/resume fields are used.

Unconnected demand dimensions are explicitly UNAVAILABLE: current record-level feed, occupation/NCO demand, skill/NSQF/NOS demand, sector demand, district observations/GIS, sufficient historical demand sequence, scientifically defensible forecast, compatible demand–supply gap, composite index and training capacity. NCO/NOS research identifies reference candidates; it does not establish mappings or demand counts.

Sources not integrated: e-Shram worker registrations, unapproved NCS feeds and permission-unresolved NCO bulk references. Absence means verified source not ingested, not numeric zero and not a claim that no labour demand exists there.
