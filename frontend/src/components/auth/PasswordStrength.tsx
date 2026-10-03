import { useLocale } from '../../hooks/usePreferences';
import { passwordRequirements } from '../../features/account/passwordPolicy';
export function PasswordStrength({password}:{password:string}) {
  const {t}=useLocale(); const requirements=passwordRequirements(password);
  const met=requirements.filter(Boolean).length;
  // Explainable UI guidance, not a guarantee of cryptographic entropy.
  const score=met<3?1:met<5?2:password.length>=14 && new Set(password).size>=10?4:3;
  const names=['personal.weak','personal.medium','personal.strong','personal.veryStrong'] as const;
  const labels=['personal.reqLength','personal.reqUpper','personal.reqLower','personal.reqNumber','personal.reqSpecial'] as const;
  return <div className="password-strength"><p>{t('personal.strength')}: <strong>{t(names[score-1])}</strong></p><div className="strength-track" aria-hidden="true"><span style={{width:`${score*25}%`}} /></div><ul>{labels.map((key,index)=><li key={key}><span aria-hidden="true">{requirements[index]?'✓':'○'}</span> {t(key)}<span className="sr-only"> · {t(requirements[index]?'personal.met':'personal.notMet')}</span></li>)}</ul></div>;
}
