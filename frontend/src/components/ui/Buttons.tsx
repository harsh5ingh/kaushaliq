import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { pending?: boolean };
type Variant = "primary" | "secondary" | "quiet" | "destructive";

export function Button({ variant = "primary", pending = false, disabled, className = "", ...props }: ButtonProps & { variant?: Variant }) {
  return <button type="button" className={`button button-${variant} ${className}`} {...props} disabled={disabled || pending} aria-busy={pending || undefined} />;
}
export function PrimaryButton(props: ButtonProps) { return <Button {...props} variant="primary" />; }
export function SecondaryButton(props: ButtonProps) { return <Button {...props} variant="secondary" />; }
export function IconButton({ label, pending = false, disabled, className = "", ...props }: ButtonProps & { label: string }) {
  return <button type="button" aria-label={label} title={label} className={`icon-button ${className}`} {...props} disabled={disabled || pending} aria-busy={pending || undefined} />;
}
