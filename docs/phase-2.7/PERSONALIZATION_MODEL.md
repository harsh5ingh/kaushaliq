# Personalization model

The seven-step optional onboarding collects education, interests, skills, career goals, geography and resume, then completion. Back, save/continue, skip and exit are persisted; public intelligence is never gated by profile completion. The completion indicator counts five optional structured sections, not employability or skill quality. Resume is optional and does not reduce completion.

Education is user-reported qualification/degree/field/year. Thirteen selectable interest areas and nine career goals are preference labels, not a newly invented labour-market taxonomy. Interests allow future canonical mapping without pretending it exists now. User skills are user-written descriptions with optional self-assessed proficiency; canonical ID/taxonomy remain null until a verified skill catalogue exists.

Origins currently supported: `SELF_REPORTED`, `RESUME_DERIVED`. The client cannot manufacture `VERIFIED`; even a confirmed resume candidate remains resume-derived, not independently verified. Editing extracted structured fields changes origin to self-reported. User-origin metadata is distinct from public analytical `OBSERVED/DERIVED/FORECAST/SCENARIO/UNAVAILABLE` statuses.

Geography uses the 37 actual canonical country/state/UT references. Current/preferred region, relocation and remote preferences are explicit user choices. There is no IP/device geolocation, district invention, ethnicity/gender inference or private-context adjustment of published rates.

My Intelligence contains actual saved personal context, persistent watchlist and saved query configurations. Current catalogue supports region and NIC industry follows; skills/occupations are unavailable until verified entity catalogues exist. Follow identifiers are checked against the canonical publication; stale follows can be disclosed as unavailable. Saved analysis stores route, bounded query/filter configuration and publication hash, never fabricated/frozen results. Reopening executes the existing verified page; `updated_data` compares current publication hash. The UI currently exposes observed national/region-period configurations; richer query builders can extend this boundary later.

Alert preferences store email/category opt-ins only. No delivery scheduler, invented demand alert, skill-gap alert or forecast event is generated. No personalized score, recommendation model, forecast, placement estimate or AI Analyst is implemented. Private user context prepares future evidence-grounded workflows without changing public truth.
