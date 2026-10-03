import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/components.css";
import "./styles/public.css";
import "./styles/auth.css";
import "./styles/chrome.css";
import "./styles/footer.css";
import "simplebar-react/dist/simplebar.min.css";
import "./styles/phase231.css";

import App from "./app/App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
import "./styles/phase23.css";
import "./styles/phase24.css";
import "./styles/phase25.css";
import "./styles/visualization.css";
import './styles/personal.css';
import './styles/demand.css';
import './styles/supply.css';
import './styles/gaps.css';
