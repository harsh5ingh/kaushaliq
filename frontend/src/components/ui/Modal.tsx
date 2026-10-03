import { useLocale } from "../../hooks/usePreferences";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "./Buttons";

export function Modal({ title, id, children, onClose, className = "", descriptionId }: {
  title: string; id: string; children: ReactNode; onClose: () => void; className?: string; descriptionId?: string;
}) {
  const { t } = useLocale();

  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    dialog?.querySelector<HTMLElement>("[data-initial-focus]")?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={ref} aria-labelledby={id} aria-describedby={descriptionId} className={`modal ${className}`}
    onKeyDown={(event) => {
      if (event.key !== "Tab") return;
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter((element) => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }}>
    <div className="modal-heading"><h2 id={id}>{title}</h2><IconButton label={t("common.close")} onClick={onClose}><X size={20} /></IconButton></div>
    {children}
  </dialog>;
}
