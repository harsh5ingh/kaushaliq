# Phase 3 audit and implementation plan

Read Phase 2.8 demand, Phase 2.9 supply/schema/coverage/taxonomy/quality/compatibility and verification documentation, latest auth-hardening report, current model/repository/route implementations, workspace/provider/navigation/evidence/i18n primitives and existing backend/browser tests before code changes. Broad inherited uncommitted work is preserved.

## Existing reusable foundation

- Hash-bound cached canonical repositories: 37 NCS historical administrative observations; 323 PMKVY output/infrastructure records; unchanged PLFS/NIC/geography base. Existing raw snapshots, receipts, normalized/source-native values, Evidence and safe source DTOs.
- Ten-check deterministic compatibility assessment and public `/compatibility` plus `/gap/status`; currently no arithmetic. Preserve their legacy response/check contract while delegating readiness to the new engine.
- Reviewed mapping contracts, but empty production occupation/skill/qualification/crosswalk collections. Partial NIC is reference-only. No worker-availability/capacity/seats/district source or approved demand/supply pairing.
- Public verified workspace, centralized API/decoders, abortable query hooks, native accessible Modal/EvidencePanel, Skeleton/loading/error states, semantic theme tokens, persisted English/Hindi and URL filters.
- The 120-person PMKVY discrepancy remains quarantined; certified cohorts are not inferred from training cohorts. Auth/session/private-data code stays outside this phase.

## Missing and planned

1. Typed gap inputs/results, versioned evidence-backed calculation-method contract, deterministic checks, explicit READY/PARTIAL/NOT_READY and null derived fields outside READY. Production method registry starts empty because no approved comparable pair exists.
2. Reusable gate: metric/population semantics, unit, exact period, geography, taxonomy versions, required mappings, granularity, full coverage, source/hash/version binding, mapping approval and quality. No automatic conversions, overlap/proration, downscaling or inferred codes.
3. READY-only Decimal arithmetic for demand minus supply, uncovered amount and supply/demand; zero-demand ratio stays null. Typed result retains original values, input evidence, publication versions, transformations, quality and limitations. Test fixtures prove this capability; they do not publish labour observations.
4. Extend the existing compatibility/gap-status routes via a conservative legacy adapter. Add public read-only `/gaps` query and `/gaps/coverage`, `/gaps/quality`, `/gaps/evidence`; reuse `/compatibility` rather than duplicate that endpoint. Repositories remain the source of truth; no ingestion/database changes.
5. Add `/skill-gaps` to the existing real workspace navigation/dispatch. Data-aware assessment filters and unavailable classification controls, explicit states, original source-record context, compatibility detail and shared evidence dialog. No fake shortage chart; actual connected data remains NOT_READY/UNAVAILABLE.
6. Focused contract/gate/arithmetic/zero/edge/source/quality/filter tests; all historical browser suites plus auth-hardening and Phase 3 state/response/theme/language/responsive/accessibility checks. Screenshots of production NOT_READY and explicitly identified isolated test states. Preserve prior artifacts by redirecting outputs into this phase.
7. Verify canonical source hashes before/after, no private data import/write APIs/new dependencies, baseline and final build/lint/compile/tests; document exact available capabilities and data needed to unlock gaps. No forecasting, later products, commit or push.

## Baseline

Before source edits: 87 backend tests pass; frontend lint/build pass. Logs and pre-edit Git status/hashes are under `verification/`.
