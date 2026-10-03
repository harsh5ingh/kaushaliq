# Quality, provenance and security

Existing immutable raw files, source registry, ingestion, normalization, publication validation and quarantine remain authoritative. The gap read model consumes already validated publications; it does not write observations or change training/demand semantics.

The 120-person national PMKVY TRAINED discrepancy for 2024–25 remains quarantined. No such national record enters the 296 assessments. Source hash preservation is recorded in `verification/source-hashes-before.json` and `source-hashes-after.json`.

Input warnings/unresolved flags, quarantine, estimates, scenarios, unapproved metric methods, mismatched periods/units/geographies, missing classification versions/crosswalks, unverified source hashes and insufficient compatible population coverage prevent arithmetic. Quality flags propagate. All failed checks have machine reason codes and human explanations; English/Hindi UI explanations are centralized language resources.

Every assessment retains input signal/source-record/provenance IDs, raw checksums, original values/units, source versions, demand/supply/base publication hashes, observation/publication dates, normalization versions and Evidence steps. Consumed mappings preserve their full reviewed contract. READY additionally records reviewed methodology and exact calculation transformations.

Source DTOs reuse the existing safe public whitelist. Gap endpoints are read-only/public; no account IDs, private user data, resumes, cookies or tokens are consumed. There is no arbitrary upload, approval or data-edit endpoint. Filters are bounded and enumerations validated server-side. Client approval/user parameters cannot activate calculations. Existing auth/CSRF/session/ownership architecture remains untouched and its regression suite was run.

No new dependency, environment variable, external credential or runtime network acquisition was introduced. No plaintext OTP/password/token was added to source or verification output. Local `.env` files were not read into output or modified.

This is a focused architectural/security check, not security certification or an accessibility conformance claim.
