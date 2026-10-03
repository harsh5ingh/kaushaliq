import { useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useLocale } from "../../hooks/usePreferences";

export function AuthField({ label, error, hint, ...input }: InputHTMLAttributes<HTMLInputElement> & {
  label: string; error?: string; hint?: string;
}) {
  const id = useId();
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);
  const isPassword = input.type === "password";
  return <div className="auth-field">
    <label htmlFor={id}>{label}</label>
    <div className={`auth-input-wrap ${isPassword ? "has-password-toggle" : ""}`}>
      <input {...input} id={id} type={isPassword && visible ? "text" : input.type} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} />
      {isPassword && <button className="password-visibility" type="button" aria-label={t(visible ? "auth.hidePassword" : "auth.showPassword")} aria-pressed={visible} onClick={() => setVisible((current) => !current)}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button>}
    </div>
    {hint && !error && <span id={`${id}-hint`} className="field-hint">{hint}</span>}
    {error && <span id={`${id}-error`} className="field-error">{error}</span>}
  </div>;
}
