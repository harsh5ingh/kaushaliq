# Phase 3 — Demand × Supply Gap Engine

Implementation completed with the existing production gate preserved: **gap_status=UNAVAILABLE; readiness=NOT_READY**. No verified gap dimension can currently be calculated. Connected NCS vacancy stock and PMKVY training output/infrastructure are not semantically comparable labour populations or periods.

## Implemented

- Strict canonical GapMeasure/CalculationMethod/GapResult and typed FastAPI gap response contracts, retaining original/source-normalized values, source/record/provenance IDs, dates, classifications, publication hashes, quality and Evidence.
- One reusable deterministic engine with thirteen compatibility checks, machine reasons and explanations. READY-only Decimal arithmetic, uncovered amount, direction and coverage; zero-demand coverage remains null. PARTIAL remains ineligible for arithmetic. No approved production method is connected.
- Version-keyed, cached read model over existing demand/supply repositories; exact geography pairing, validated filters and bounded pagination. No new ingestion, source acquisition, data model competing with canonical publications, database or dependency.
- Public `/api/v1/intelligence/gaps`, `/gaps/coverage`, `/gaps/quality`, `/gaps/evidence`. Existing `/compatibility` and `/gap/status` keep their legacy ten-check response and delegate to the new engine.
- Public `/skill-gaps` in the existing workspace shell and More/mobile navigation. Source-aware filters, explicitly disabled unsupported classification/common-period controls, source-context observation selector, pagination, compatibility explanation and shared EvidencePanel. READY-only measurement hierarchy is exercised with isolated fixtures. No fake chart was added to unavailable production data.
- Central English/Hindi messages, persisted existing preferences, light/dark/system themes, existing Loader/Skeleton/error/empty primitives, keyboard-visible focus, native dialog Escape/focus restoration and responsive layout.

## Real data and provenance

Existing source snapshots and canonical publication hashes are unchanged. 296 source-context assessments cover 34 shared canonical geographies; seven national pairs are exposed by the page's initial query. These are inspection pairs, not comparable gaps. Calculated records: zero. Original NCS and PMKVY values are not changed or summed.

The existing 120-person PMKVY discrepancy remains quarantined and excluded. Source-native training output is never described as available labour or training capacity. Geography, taxonomy and historical boundaries are not inferred.

Input and consumed mapping Evidence, reviewed method/version, transformation steps, checks and limitations explain any future derived result. A measured difference is not a causal claim. Source labels and exact publication metadata remain in their published language, with English `lang` markers where appropriate; UI and explanations are bilingual.

## Audit alignment

Preserved: Phase 2.8 demand pipeline; Phase 2.9 supply, taxonomy, compatibility and quarantine; Phase 2.5/2.6 raw/hash/evidence boundaries; Phase 2.7 account ownership/privacy; Phase 2.9.1 hero/loading/count-up; existing auth/session/OAuth configuration, public pages, branding and theme/language persistence.

Extended: legacy deterministic compatibility; existing repositories and safe-source DTO; real-data route dispatcher/navigation; centralized resources; shared evidence and loading primitives; existing browser harness.

New: canonical gap contracts, reusable reviewed comparability/calculation engine, query/coverage/quality/evidence read APIs, `/skill-gaps`, focused engine/API/browser tests and Phase 3 artifacts.

Limitations retained: no compatible demand/available-worker measure, approved occupation/skill/sector crosswalk, full measured-population coverage, district observations, training seats/capacity or scientifically justified forecasts. The unresolved 120-count discrepancy is not repaired by this phase.

Intentionally not implemented: empirical skill gaps, demand indices, forecasting/Phase 4, early warning, AI Analyst, scenario engines, district allocation, new account features or OAuth credential setup. No production method is approved solely to fill UI cards.

## Verification

Baseline: 87 backend tests; build/lint passed before edits. Final: 102 backend tests (15 new), compile check, frontend build/lint, all fourteen historical browser suites after a documented harness-port retry, seven auth/session/OAuth regression groups, and ten new Phase 3 browser groups passed. See VERIFICATION.md for artifacts, initial failures, screenshot matrix and scope limits.

Twenty production screenshots cover all five widths, both themes/languages; additional screenshots cover error, expanded mobile assessment and explicitly TEST-ONLY READY/PARTIAL/EMPTY/UNAVAILABLE fixtures. Screenshots were inspected; disabled-period text and coverage composition were refined. No accessibility certification is claimed.

No dependencies/environment variables were added. Existing main-chunk size advisory remains; measured bundle changes are documented in VERIFICATION.md. No commit, push, branch change, reset or unrelated deletion was performed. The broad inherited dirty working tree remains intact; CHANGE_MANIFEST.md distinguishes Phase 3 source changes from inherited Git status.
