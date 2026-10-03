import { useLocale } from "../../hooks/usePreferences";
import { useState, useId } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CornerDownLeft, BrainCircuit, BriefcaseBusiness, Factory, MapPinned } from "lucide-react";
import { getNavigation } from "../../app/config/navigation";
import { Modal } from "../ui/Modal";
import { industries, occupations, regions, skills } from "../../data/labourMarket";
import { useIntelligenceData } from "../../features/real-intelligence/dataContext";

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const { t } = useLocale();
  const { mode, catalog } = useIntelligenceData();

  const navigation = getNavigation(t);

  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const needle = query.trim().toLocaleLowerCase();
  const navigationMatches = navigation.filter(item => `${item.label} ${item.title}`.toLocaleLowerCase().includes(needle))
    .map(item => ({ path: item.path, label: item.label, icon: item.icon, section: t("search.navigation") }));
  const sampleMatches = import.meta.env.DEV && mode === "sample" && needle ? [
    ...skills.map(item => ({ path: `/skills?skill=${item.id}`, label: t(item.nameKey), icon: BrainCircuit, section: t("common.skills") })),
    ...occupations.map(item => ({ path: `/occupations?occupation=${item.id}`, label: t(item.nameKey), icon: BriefcaseBusiness, section: t("common.occupations") })),
    ...industries.map(item => ({ path: `/industries?industry=${item.id}`, label: t(item.nameKey), icon: Factory, section: t("common.industries") })),
    ...regions.map(item => ({ path: `/regions?region=${item.id}`, label: t(item.nameKey), icon: MapPinned, section: t("common.regions") })),
  ].filter(item => item.label.toLocaleLowerCase().includes(needle)) : [];
  const realMatches = needle ? [
    ...(catalog?.regions.map(item => ({ path: `/regions?region=${item.region_id}`, label: item.name, icon: MapPinned, section: t("common.regions") })) || []),
    ...(catalog?.industries.map(item => ({ path: `/industries?industry=${item.industry_id}`, label: `${item.nic_code} · ${item.name}`, icon: Factory, section: t("real.reference") })) || []),
  ].filter(item => item.label.toLocaleLowerCase().includes(needle)).slice(0, 30) : [];
  const entityMatches = mode === "sample" ? sampleMatches : realMatches;
  const matches = [...navigationMatches, ...entityMatches];
  function select(path: string) { onClose(); navigate(path + (mode === "sample" ? `${path.includes("?") ? "&" : "?"}data=sample` : "")); }
  return <Modal title={t("search.title")} id="search-heading" onClose={onClose} className="command-palette">
    <div className="search-input-wrap"><Search size={20} aria-hidden="true" />
      <input data-initial-focus aria-label={t("search.pages")} role="combobox" aria-autocomplete="list" aria-expanded="true"
        aria-controls={listId} aria-activedescendant={matches[active] ? `${listId}-${active}` : undefined}
        placeholder={t("search.placeholder")} value={query}
        onChange={(event) => { setQuery(event.target.value); setActive(0); }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (matches.length) setActive((index) => (index + (event.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length);
          }
          if (event.key === "Enter" && matches[active]) { event.preventDefault(); select(matches[active].path); }
        }} />
    </div>
    <p className="search-disclosure">{mode === "real" ? t("real.searchNote") : needle ? t("workspace.searchEntities") : t("search.note")}</p>
    <p className="eyebrow palette-label">{t("search.navigation")}</p>
    <ul id={listId} role="listbox" aria-label={t("search.list")} className="command-results">
      {matches.map(({ path, label, icon: Icon, section }, index) => <li key={path} id={`${listId}-${index}`}
        role="option" aria-selected={active === index} className={active === index ? "selected" : ""}
        onMouseDown={(event) => event.preventDefault()} onMouseMove={() => setActive(index)} onClick={() => select(path)}>
        <Icon size={18} aria-hidden="true" /><span>{label}<small>{section}</small></span><CornerDownLeft size={16} aria-hidden="true" />
      </li>)}
    </ul>
    {matches.length === 0 && <p className="no-results" role="status">{needle ? t("workspace.searchNoResults") : t("search.empty")}</p>}
    <div className="palette-footer"><span><kbd>↑</kbd> <kbd>↓</kbd> {t("search.move")}</span><span><kbd>Enter</kbd> {t("search.open")}</span><span><kbd>Esc</kbd> {t("search.close")}</span></div>
  </Modal>;
}
