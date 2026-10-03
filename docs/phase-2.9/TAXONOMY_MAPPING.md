# Taxonomy and mapping contracts

Contracts are in `backend/src/supply/models.py`. They support multiple named systems and explicit versions; NCO is not used as a universal ID.

## Distinct reference entities

`OccupationReference`: occupation ID, taxonomy system/version, code, title, optional description/parent, source/provenance, status and evidence.

`SkillReference`: skill ID plus explicit `entity_type=skill|NOS`. A NOS competency standard is not relabelled as an observed skill-demand measurement.

`QualificationReference`: qualification ID, `entity_type=qualification|QP|job_role` and optional NSQF level. Qualifications, packs, job roles, skills and occupations retain separate identity and meaning.

`TaxonomySource`: publisher/name/version, source URL, access date, coverage/purpose, license/access notes, snapshot/artifact reference and research status. VERIFIED/PARTIALLY_VERIFIED requires version and acquisition evidence. Current production occupation/skill/qualification lists are empty; no approved adapter exists.

## MappingRelationship

Fields: mapping ID; source/target systems and versions; source/target code/label; type; mapping status; confidence; review status; methodology version; provenance ID; Evidence.

Types: `EXACT_EQUIVALENCE`, `DOCUMENTED_CROSSWALK`, `PARENT_CHILD`, `RELATED`, `MANUAL_REVIEW`.

Statuses: `EXACT`, `DOCUMENTED`, `PARTIAL`, `AMBIGUOUS`, `UNMAPPED`, `REQUIRES_REVIEW`.

- EXACT requires confirmed equivalence and approved coded endpoints.
- DOCUMENTED requires confirmed, approved evidence; its relationship type still matters.
- PARTIAL retains partial confidence and never becomes exact.
- AMBIGUOUS/UNMAPPED/REQUIRES_REVIEW do not assign a production target code.
- RELATED and PARENT_CHILD do not establish interchangeable classifications.

Confidence is a categorical evidence/review state, not an invented numerical probability. No LLM or title similarity selects codes.

## Compatibility use and current gate

The assessment may recognize an explicitly approved EXACT/DOCUMENTED equivalence/crosswalk with source-hash evidence. RELATED, PARTIAL and unresolved relationships never grant equivalence. Source/target system and codes are checked. No production mapping exists in this phase, and no approved demand/current-worker metric pair exists, so the gap gate cannot open.

The publication validator deliberately rejects nonempty occupation/skill/qualification/mapping collections until a reviewed taxonomy acquisition adapter is implemented. A genuine training checksum alone cannot legitimize a made-up code. Future adapters must additionally bind versioned endpoints and exact raw relationship evidence; tests currently exercise the contracts using isolated TEST-ONLY fixtures, never canonical data.

Current mapping coverage is unavailable for every demand and supply observation. The counts of empty reference/mapping collections are repository coverage counts, not measured labour-market zeros.
