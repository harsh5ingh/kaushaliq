# Quality and source integrity

Current publication: 40 extracted records, 37 published numeric signals, 34 VALID geographic mappings (one country + 33 State/UT), 3 WARNING/unmapped source geographies. Three source dash records are kept in the quality exclusion list as UNAVAILABLE rather than erroneous numbers. `quality.quarantined` contains excluded rows and preserves their individual status/reason; it does not reclassify dashes as corrupt data.

The two responsive HTML copies are identical. They are one source observation set, not 80 records. Numeric geography buckets reconcile exactly to the source total. This reconciliation does **not** convert the three missing dashes into zero. The employer column is excluded from vacancy measures.

Historical separate UT labels, multi-state coverage and unspecified geography remain unassigned. No district reference or spatial boundary is fabricated. Occupation/skill/sector each has 37 UNAVAILABLE mappings. No inferred code, fuzzy title match, numerical confidence, demand score, forecast or gap is generated.

Validation rejects duplicate source/canonical/mapping identity, unknown canonical geography, invalid/unsafe/nonintegral/negative/nonfinite count, malformed unit/grouping, reverse/ambiguous dates or observed intervals after their publication, incompatible classification fields, conflicting mapping and provenance hashes. Invalid normalization inputs are quarantined. Source schema/date/table-copy/reconciliation changes block the entire build instead of silently publishing changed semantics. The repository verifies snapshot SHA, raw provenance map, base version and strict record contracts before read queries.

Snapshot staleness is disclosed as historical, with observed, published and retrieved dates kept distinct. Ad-hoc update frequency provides no SLA; ingestion never implies the dated values are current. No automatic provider/network/simulation fallback occurs.

Raw NCS SHA: `2947d1e2d741a85f1b237966e47a01270b35a582188c93352139752686b6a4f3`. Existing base SHA remains `c85d2e9e26d103803d2419b7f2f95110130a3063636cceaf03c5d81211841eae`. Demand snapshot SHA is recorded in its generated manifest. Integrity is tamper detection against deployed artifacts, not a digital publisher signature.

Tests include exact source counts, checksum/cache acquisition, rejected schema drift/conflicting responsive copies, duplicates/invalid quarantine, unsafe values, units/time, reviewed exact/crosswalk/ambiguous/unmapped taxonomy rules, missing/obsolete geography, canonical reproducibility, APIs and incompatible filters, no private filesystem exposure, unavailable gaps/forecasts and fail-closed corruption. Synthetic mapping/status fixtures are isolated test inputs only. Frontend hash/source binding and matching observation/coverage publication versions are enforced and browser-tested.
