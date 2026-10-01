import "./App.css";

import {
  BarChart3,
  BrainCircuit,
  ChevronRight,
  Database,
  Gauge,
  Map,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";

const stats = [
  {
    label: "Active Job Signals",
    value: "24,680",
    change: "+12.8%",
    icon: Database,
  },
  {
    label: "Skills Tracked",
    value: "8,420",
    change: "+6.4%",
    icon: BrainCircuit,
  },
  {
    label: "Regional Skill Gaps",
    value: "1,284",
    change: "+9.2%",
    icon: Map,
  },
  {
    label: "Forecast Accuracy",
    value: "91.6%",
    change: "+3.1%",
    icon: Gauge,
  },
];

const navItems = [
  { label: "Overview", icon: BarChart3, active: true },
  { label: "Skill Demand", icon: TrendingUp },
  { label: "Skill Gap", icon: BrainCircuit },
  { label: "Forecasts", icon: Gauge },
  { label: "Regional Intelligence", icon: Map },
];

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">K</div>

          <div>
            <div className="brand-name">KaushalIQ</div>
            <div className="brand-caption">Labour Intelligence</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">INTELLIGENCE</div>

          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                className={`nav-item ${item.active ? "active" : ""}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.active && <ChevronRight size={16} />}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="footer-title">AI Labour Intelligence</div>
          <div className="footer-text">
            Turning labour-market signals into actionable skill insights.
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="eyebrow">LABOUR MARKET INTELLIGENCE</div>
            <h1>Workforce Overview</h1>
            <p>
              Monitor skill demand, supply gaps and emerging workforce trends.
            </p>
          </div>

          <div className="topbar-actions">
            <button className="search-button">
              <Search size={17} />
              <span>Search intelligence</span>
              <kbd>⌘ K</kbd>
            </button>

            <div className="profile">
              <div className="profile-avatar">A</div>
              <div>
                <div className="profile-name">Admin</div>
                <div className="profile-role">Policy Intelligence</div>
              </div>
            </div>
          </div>
        </header>

        <section className="stats-grid">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article className="stat-card" key={stat.label}>
                <div className="stat-top">
                  <div className="stat-icon">
                    <Icon size={19} />
                  </div>

                  <span className="stat-change">{stat.change}</span>
                </div>

                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </article>
            );
          })}
        </section>

        <section className="dashboard-grid">
          <article className="panel large-panel">
            <div className="panel-header">
              <div>
                <div className="panel-kicker">DEMAND SIGNAL</div>
                <h2>Emerging Skill Demand</h2>
              </div>

              <button className="panel-action">View analysis</button>
            </div>

            <div className="chart-placeholder">
              <div className="chart-bars">
                {[52, 68, 61, 84, 73, 92, 78, 96, 87, 100].map(
                  (height, index) => (
                    <div className="bar-column" key={index}>
                      <div
                        className="bar"
                        style={{ height: `${height}%` }}
                      />
                        <span>{index + 1}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-kicker">SKILL GAP</div>
                <h2>High-Risk Shortages</h2>
              </div>
            </div>

            <div className="gap-list">
              {[
                ["AI / ML Engineering", "High"],
                ["Cybersecurity", "High"],
                ["Cloud Architecture", "Medium"],
                ["Data Engineering", "Medium"],
              ].map(([skill, level]) => (
                <div className="gap-row" key={skill}>
                  <div className="gap-skill">
                    <div className="gap-dot" />
                    <span>{skill}</span>
                  </div>

                  <span className={`gap-level ${level.toLowerCase()}`}>
                    {level}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="lower-grid">
          <article className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-kicker">REGIONAL INTELLIGENCE</div>
                <h2>Skill Demand by Region</h2>
              </div>

              <button className="panel-action">Explore map</button>
            </div>

            <div className="map-placeholder">
              <Map size={34} />
              <span>Regional skill intelligence map</span>
              <small>GIS layer will be connected in the next phase.</small>
            </div>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-kicker">AI INSIGHTS</div>
                <h2>Intelligence Brief</h2>
              </div>

              <BrainCircuit size={20} />
            </div>

            <div className="insight">
              <div className="insight-icon">
                <TrendingUp size={18} />
              </div>

              <div>
                <strong>AI-related skills are accelerating.</strong>
                <p>
                  Demand signals indicate increasing requirements across
                  technology-intensive roles.
                </p>
              </div>
            </div>

            <div className="insight">
              <div className="insight-icon">
                <Users size={18} />
              </div>

              <div>
                <strong>Regional skill gaps detected.</strong>
                <p>
                  The forecasting engine will identify where workforce supply
                  is falling behind industry demand.
                </p>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

export default App;