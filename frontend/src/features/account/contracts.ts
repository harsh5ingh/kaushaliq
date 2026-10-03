export type Origin = 'SELF_REPORTED' | 'RESUME_DERIVED';
export interface Education { qualification:string; degree:string; field:string; year:number|null; origin:Origin; resume_id:string|null }
export interface UserSkill { name:string; canonical_id:null; taxonomy:null; proficiency:''|'beginner'|'intermediate'|'advanced'; origin:Origin; resume_id:string|null }
export interface ProfileSections {
  education:Education; interests:string[]; skills:UserSkill[];
  experience:{name:string; origin:Origin; resume_id:string|null}[];
  career:{goals:string[]; note:string}; geography:{current:string|null; preferred:string[]; relocation:boolean; remote:boolean};
  onboarding:{step:number; status:'not_started'|'in_progress'|'skipped'|'complete'};
  alerts:{email:boolean; skills:boolean; occupations:boolean; regions:boolean; datasets:boolean; reports:boolean};
}
export interface Resume { id:string; filename:string; uploaded_at:string; size:number; candidates:{skills:string[]; education:string[]; experience:string[]; text_available:boolean} }
export interface PersonalProfile {user:{id:string; name:string; email:string; provider:string}; phone_masked:string|null; sections:ProfileSections; resume:Resume|null; completion:{completed:string[]; total:number} }
export interface WatchItem {id:string; kind:string; entity_id:string; name:string; available:boolean}
export interface SavedAnalysis {id:string; title:string; route:string; query:Record<string,string>; updated_data:boolean}
export interface AccountSession {id:string; current:boolean; expires_at:string}
export interface Verification {verification_required:true; masked_target:string; state:'CONFIGURED'|'NOT_CONFIGURED'|'TEMPORARILY_UNAVAILABLE'; cooldown_seconds:number; csrfToken?:string}
