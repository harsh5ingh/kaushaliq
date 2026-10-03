# KaushalIQ frontend

Phase 1 establishes the application shell and design system. It does not implement labour-market analytics.

## Run locally

From `D:\SIH part 2\KaushalIQ\frontend`:

```powershell
npm install
npm run dev
```

Open the localhost URL printed by Vite. Use a Node version compatible with the lockfile (Vite requires Node 20.19+ on the 20.x line, or 22.12+); verification used Node 26.7.0.

To use the optional **Check connection** control, start the existing backend in a second terminal from `D:\SIH part 2\KaushalIQ\backend`:

```powershell
.\.venv\Scripts\python.exe -m uvicorn src.main:app --host 127.0.0.1 --port 8000
```

The current virtual environment works on this computer with Python 3.13.15. On another machine, create a virtual environment and install the pinned backend requirements first.

Vite proxies `/api` to `http://127.0.0.1:8000`. Set `API_PROXY_TARGET` before starting Vite to use another local backend. The client can use a different origin/base path through `VITE_API_BASE_URL`; this is public build-time configuration and must never contain secrets. Production hosting needs an SPA fallback to `index.html` and an `/api` reverse proxy (or an explicit API base URL with suitable CORS). No production host is configured in this phase.

## Checks

```powershell
npm run build
npm run lint
```

The build includes strict TypeScript checking. A browser integration check is available:

```powershell
npm run check:browser
```

It requires Playwright resolvable as `playwright`, or the `PLAYWRIGHT_MODULE` environment variable set to an existing Playwright package directory. Verification used the host-provided Playwright; no browser-test package was added to the application dependencies. It launches installed Edge by default; `BROWSER_CHANNEL` can select another installed Playwright-compatible channel. `KAUSHALIQ_PYTHON` can override the backend Python executable.

The check starts temporary frontend/backend processes on free ports and stops them afterward. It exercises route refresh, back/forward history, keyboard palette navigation, mobile drawer focus, sample disclosure, real API success/failure/retry, reduced motion, local fonts and horizontal overflow. Screenshots, logs and results are saved under `docs/phase-1/verification/` in the project root. No external network is permitted by the browser test.

## Structure

- `src/app/`: application entry, routing and shared navigation/evidence metadata.
- `src/pages/`: overview composition, a shared intentional capability state for five planned routes, and missing-page recovery. Five identical wrapper files are intentionally avoided.
- `src/components/layout/`: shell, header and sidebar.
- `src/components/navigation/`: actual links and the keyboard command palette.
- `src/components/ui/`: panels, headers, buttons, badges, native dialogs and loading/empty/error states.
- `src/components/dashboard/`: typed KPI presentation.
- `src/components/charts/`: typed ChartCard container; no fabricated series or chart.
- `src/features/overview/`: explicitly labelled display fixtures and the real service-health panel.
- `src/hooks/` and `src/services/`: cancellable health request state and a small fetch boundary with runtime response validation.
- `src/types/`: metric, evidence-kind and page contracts.
- `src/styles/`: design tokens, base typography/accessibility rules and component/responsive styles.

Routing uses one React Router dependency. The font is a self-hosted Inter variable Latin WOFF2 asset with font-display swap and system fallbacks. Recharts stays installed but is not imported until there is a valid analytical series.

## Product boundaries

Routes: `/`, `/skills`, `/regions`, `/occupations`, `/industries`, `/forecast`.

Only the overview has display content. Its metric numbers are illustrative constants, the skills are example labels, and 2026 is a presentation year. No data files substantiate those values. The other pages explain their unavailable/planned status. Search filters only known page names; it does not search labour-market records.

Observed, Derived, Forecast, Scenario and Sample have distinct labelled styles and explanations. Only Sample is attached to demonstration content. The other labels are demonstrated in a legend, not assigned to nonexistent results. The profile explicitly says that sign-in is not available.

The native modal dialogs include labelled controls, focus containment and restoration, Escape, a noninteractive background and scroll locking. The palette supports Ctrl/Cmd+K, arrows and Enter. Reduced-motion settings disable entrance, hover and skeleton motion. These are tested foundations, not a claim of WCAG compliance.

## Next boundary

Phase 2 should introduce one real, small India-focused workflow: dataset provenance and coverage, validation, normalization, a backend repository/calculation/API, and a real typed Recharts view. No Phase 2 engine is implemented here.

References: [React Router](https://reactrouter.com/start/declarative/installation), [Fontsource Inter](https://fontsource.org/fonts/inter).
