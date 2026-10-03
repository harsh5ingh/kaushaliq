import { useLocale } from "../../hooks/usePreferences";
export function RegionalDiagram() {
  const { t } = useLocale();
  return <figure className="regional-diagram">
    <svg viewBox="0 0 560 340" role="img" aria-label={t("regional.title")}>
      <path className="region-outline" d="M270 24 304 42 328 40 350 62 375 67 386 93 411 105 405 133 427 148 416 173 428 195 409 219 407 245 390 263 374 286 359 299 349 323 331 310 315 287 299 281 287 258 268 250 258 227 239 215 237 195 218 184 221 161 204 145 213 126 206 107 223 88 224 64 244 52 248 34Z" />
      <path className="region-route" d="M276 54Q310 104 301 156T281 232 334 282" />
      {[["national",276,54],["state",301,156],["district",281,232],["workforce",334,282]].map(([key,x,y])=><g key={key as string}><circle cx={x as number} cy={y as number} r="5" /><circle cx={x as number} cy={y as number} r="15" /></g>)}
    </svg>
    <div className="regional-levels"><span>{t("regional.national")}</span><span>{t("common.state")}</span><span>{t("common.district")}</span><span>{t("regional.workforce")}</span></div>
    <figcaption>{t("regional.note")}</figcaption>
  </figure>;
}
