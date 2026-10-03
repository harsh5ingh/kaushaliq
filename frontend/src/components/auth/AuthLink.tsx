import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { authSearch, type AuthMode } from "./authNavigation";

export function AuthLink({ mode, children, className = "", onClick }: {
  mode: AuthMode; children: ReactNode; className?: string; onClick?: () => void;
}) {
  const location = useLocation();
  return <Link to={{ pathname: location.pathname, search: authSearch(location.search, mode), hash: location.hash }}
    state={{ authOverlay: true }} className={className} onClick={onClick} aria-haspopup="dialog">{children}</Link>;
}
