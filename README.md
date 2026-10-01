# KaushalIQ

### AI-Powered Labour Market Intelligence & Skill Demand-Supply Forecasting Platform

KaushalIQ is an AI-enabled labour market intelligence platform designed to analyse **skill demand, workforce supply, regional employment trends, emerging skills, and future skill gaps**.

The platform converts fragmented labour-market signals into actionable intelligence for **students, job seekers, training institutions, employers, policymakers, and skill-development administrators**.

---

## 🎯 Problem Statement

**SIH26246 — AI-Enabled Labour Market Intelligence and Skill Demand-Supply Forecasting Engine**

### Organization
**Ministry of Skill Development and Entrepreneurship (MSDE)**

### Category
**Software**

### Theme
**Miscellaneous**

### Problem

Labour-market requirements are continuously changing because of technological advancements, industry growth, regional economic conditions, changing employer requirements, and emerging occupations.

However, labour-market information is distributed across different sources, making it difficult to identify:

- Which skills are currently in demand?
- Which skills are becoming more important?
- Where are skill shortages concentrated?
- Is workforce supply keeping pace with employer demand?
- Which skills are likely to experience higher demand in the future?
- Which regions and industries require targeted skill-development interventions?

KaushalIQ addresses this problem through a unified data and intelligence platform combining **labour-demand signals, workforce-supply information, skill normalization, regional analysis, trend detection, and forecasting**.

---

# 💡 Proposed Solution

KaushalIQ provides a unified Labour Market Intelligence platform that transforms raw labour-market data into actionable skill intelligence.

```text
                 LABOUR MARKET DATA
                         │
           ┌─────────────┼─────────────┐
           ↓             ↓             ↓
       Job Demand    Workforce      Economic /
        Signals       Supply        Industry Data
           │             │             │
           └─────────────┼─────────────┘
                         ↓
                 DATA NORMALIZATION
                         ↓
                   SKILL EXTRACTION
                         ↓
                  SKILL TAXONOMY
                         ↓
               DEMAND ↔ SUPPLY ENGINE
                         ↓
                   SKILL GAP INDEX
                         ↓
                  TREND ANALYSIS
                         ↓
                   FORECASTING
                         ↓
              REGIONAL INTELLIGENCE
                         ↓
                    AI INSIGHTS
                         ↓
                 KAUSHALIQ DASHBOARD
```

---

# 🎯 Objectives

KaushalIQ aims to:

1. Collect labour-market data from multiple sources.
2. Normalize job titles and skills into a common taxonomy.
3. Measure current skill demand.
4. Estimate workforce skill supply.
5. Identify demand-supply gaps.
6. Detect emerging and declining skills.
7. Forecast future skill demand.
8. Provide regional and industry-level intelligence.
9. Present insights through an interactive dashboard.
10. Support evidence-based workforce and skill-development planning.

---

# 🧠 Core Intelligence Modules

## 1. Labour Demand Intelligence

KaushalIQ analyses labour-demand signals such as:

- Job postings
- Job titles
- Required skills
- Industry
- Location
- Experience requirements
- Employment type
- Salary information where available
- Posting date

These signals are used to estimate current demand for occupations and skills.

---

## 2. Workforce Supply Intelligence

The platform analyses workforce-related information such as:

- Trained workers
- Employed workers
- Unemployed workers
- Education level
- Experience level
- Skill availability
- Regional workforce distribution

This helps estimate the available workforce supply for different skills and regions.

---

## 3. Skill Normalization

Different employers can describe the same skill using different terms.

Example:

```text
Python
Python Programming
Python3
Python Developer
Python Programming Skills
```

can be mapped to:

```text
Canonical Skill:
Python
```

KaushalIQ uses a standardized skill taxonomy to reduce duplication and improve demand-supply analysis.

---

# 📊 Skill Demand Intelligence

The demand engine combines multiple signals:

```text
Job Frequency
      +
Demand Growth
      +
Industry Relevance
      +
Regional Demand
      +
Recency
      ↓
Skill Demand Index
```

The exact weighting can be refined after evaluating the available datasets and validation results.

---

# 📉 Skill Supply Intelligence

The supply engine estimates skill availability using workforce and training-related indicators.

```text
Trained Workforce
        +
Employment Data
        +
Regional Availability
        +
Experience Distribution
        ↓
Skill Supply Index
```

---

# ⚠️ Skill Gap Intelligence

The platform compares labour demand with workforce supply.

```text
              DEMAND
                 │
                 ▼
          ┌─────────────┐
          │  SKILL GAP  │
          └─────────────┘
                 ▲
                 │
              SUPPLY
```

For the initial prototype, the gap can be represented as:

```text
Skill Gap = Demand Index - Supply Index
```

The production implementation can use normalized demand/supply ratios and additional statistical factors.

---

# 🔮 Skill Demand Forecasting

Historical labour-market observations can be used to identify future trends.

```text
Historical Labour Data
          ↓
Feature Engineering
          ↓
Trend Detection
          ↓
Forecasting Model
          ↓
Future Skill Demand
```

Potential approaches include:

- Statistical time-series models
- Regression models
- Gradient boosting
- Machine-learning ensembles
- Other forecasting approaches selected according to dataset size and quality

The final model will be selected based on validation performance.

---

# 🗺️ Regional Intelligence

KaushalIQ is designed to provide location-aware labour-market analysis.

```text
India
  ↓
State
  ↓
District / Region
  ↓
Industry
  ↓
Occupation
  ↓
Skill
```

This can help identify:

- Regional skill shortages
- Emerging employment clusters
- Regional demand trends
- Workforce availability
- Industry-specific regional requirements

---

# 🏭 Industry Intelligence

KaushalIQ can analyse skill demand across industries such as:

- Information Technology
- Manufacturing
- Healthcare
- Finance
- Construction
- Transportation & Logistics
- Retail
- Renewable Energy
- Telecommunications
- Other sectors represented in the available data

Industry-level analysis can reveal changing workforce requirements.

---

# 🤖 AI / ML Layer

The AI/ML layer is designed to support:

### Skill Extraction

Extract relevant skills from job descriptions and labour-market text.

### Skill Classification

Map extracted skills into standardized categories.

### Trend Detection

Identify rapidly increasing or decreasing demand.

### Demand Forecasting

Estimate future skill-demand patterns using historical observations.

### Anomaly Detection

Detect unusual changes in regional, industry, or skill demand.

### AI Insights

Convert analytical results into human-readable explanations.

Example:

```text
Cybersecurity

Current Demand: High
Supply Availability: Moderate
Skill Gap: Significant

Observed Signal:
Demand has increased across multiple technology-related
job categories.

Forecast:
Demand is expected to continue increasing based on the
available historical trend.
```

---

# 📈 Dashboard

KaushalIQ provides an intelligence dashboard containing:

### Overview
High-level labour-market KPIs.

### Skill Demand
Current demand for skills and occupations.

### Skill Gaps
Demand versus workforce supply.

### Forecasts
Expected future demand.

### Regional Intelligence
Geographic distribution of demand and skill gaps.

### Industry Intelligence
Industry-specific skill trends.

### AI Insights
Automatically generated explanations from analytical results.

---

# 🖥️ Current Dashboard

The initial frontend MVP includes:

- KaushalIQ branding
- Navigation sidebar
- Workforce overview
- KPI cards
- Skill-demand visualization
- Skill-gap panel
- Regional intelligence section
- AI insights section

The dashboard will progressively be connected to the backend analytics engine.

---

# 🏗️ System Architecture

```text
┌──────────────────────────────────────────────┐
│                DATA SOURCES                  │
│ Jobs | Workforce | Industry | Regional Data  │
└───────────────────────┬──────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────┐
│               DATA INGESTION                 │
│        CSV | APIs | Structured Data          │
└───────────────────────┬──────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────┐
│             DATA PROCESSING                  │
│ Cleaning | Validation | Normalization        │
└───────────────────────┬──────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────┐
│                SKILL ENGINE                  │
│ Extraction | Mapping | Taxonomy              │
└───────────────────────┬──────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────┐
│             ANALYTICS & ML ENGINE            │
│ Demand | Supply | Gap | Trends | Forecasting │
└───────────────────────┬──────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────┐
│                FASTAPI BACKEND               │
│      REST APIs | Business Logic | AI        │
└───────────────────────┬──────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────┐
│               REACT FRONTEND                 │
│ Dashboard | Charts | Maps | Insights         │
└──────────────────────────────────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Lucide React
- Recharts
- CSS

## Backend

- Python
- FastAPI
- Uvicorn
- Pydantic
- python-dotenv

## Data & Analytics

Planned components:

- Pandas
- NumPy
- Scikit-learn
- Statistical analysis
- Time-series forecasting
- NLP
- Geospatial processing where required

## Database

The final database will be selected according to the data architecture.

Potential options include:

- PostgreSQL
- PostgreSQL + PostGIS
- SQLite for lightweight prototyping

## AI / ML

Potential components:

- NLP-based skill extraction
- Skill classification
- Demand forecasting
- Trend analysis
- Anomaly detection
- AI-generated analytical explanations

---

# 📂 Project Structure

```text
kaushaliq/
│
├── backend/
│   ├── .venv/
│   ├── src/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── main.py
│   │   └── routes/
│   │       ├── __init__.py
│   │       └── health.py
│   │
│   ├── .env.example
│   ├── .gitignore
│   └── requirements.txt
│
├── data/
│   ├── raw/
│   ├── processed/
│   └── sample/
│
├── docs/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── .gitignore
├── package-lock.json
└── README.md
```

---

# 📦 Data Architecture

KaushalIQ separates raw data from processed analytical data.

```text
data/
│
├── raw/
│   └── Original source datasets
│
├── processed/
│   └── Cleaned and normalized datasets
│
└── sample/
    └── Small development/demo datasets
```

## Labour Demand Data

Expected fields:

```text
job_id
job_title
company
industry
location
posted_date
required_skills
experience_level
employment_type
salary_min
salary_max
```

## Workforce Supply Data

Expected fields:

```text
region
skill
trained_workers
employed_workers
unemployed_workers
education_level
experience_level
year
```

## Skill Taxonomy

Expected fields:

```text
skill_id
canonical_skill
aliases
category
sub_category
```

## Regional Data

Expected fields:

```text
state
district
latitude
longitude
population
labour_force
employment
```

## Industry Data

Expected fields:

```text
industry
region
year
employment
growth_rate
```

The exact fields will depend on the final datasets used.

---

# 🔌 Backend API

KaushalIQ uses FastAPI for backend services.

## Current API

```text
GET /api/health
```

Example response:

```json
{
  "status": "ok",
  "app": "KaushalIQ",
  "version": "0.1.0"
}
```

FastAPI automatically provides interactive API documentation:

```text
/docs
```

---

# 🔐 Security

Sensitive configuration is not committed to Git.

Ignored files include:

```text
.env
.venv/
node_modules/
dist/
```

A safe environment template is provided through:

```text
backend/.env.example
```

---

# ⚙️ Local Development

## Prerequisites

Install:

- Node.js
- npm
- Python 3.x
- Git

---

## Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Production build:

```powershell
npm run build
```

---

## Backend Setup

Create the virtual environment:

```powershell
cd backend
python -m venv .venv
```

Activate:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Run backend:

```powershell
python -m uvicorn src.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

---

# 🔄 Development Workflow

```text
1. Collect Labour-Market Data
              ↓
2. Validate Data
              ↓
3. Clean & Normalize
              ↓
4. Extract Skills
              ↓
5. Map Skills to Taxonomy
              ↓
6. Calculate Demand
              ↓
7. Calculate Supply
              ↓
8. Identify Skill Gaps
              ↓
9. Detect Trends
              ↓
10. Forecast Future Demand
              ↓
11. Expose Results through API
              ↓
12. Visualize in Dashboard
```

---

# 🎯 MVP Scope

The initial SIH prototype will focus on:

- Labour-demand dataset ingestion
- Skill extraction and normalization
- Skill-demand analysis
- Workforce supply representation
- Demand-supply comparison
- Skill-gap identification
- Trend analysis
- Basic forecasting
- Regional visualization
- Interactive dashboard
- FastAPI integration
- AI-generated insights

The architecture is designed to support additional datasets and more advanced ML models in future versions.

---

# 🚀 Future Scope

## 1. Real-Time Labour Signals

Continuous ingestion of new labour-market signals.

## 2. Personalized Career Intelligence

Potential recommendations based on:

- Current skills
- Location
- Education
- Experience
- Emerging labour demand

## 3. Training Recommendation Engine

Connect identified skill gaps with relevant training programs.

## 4. Employer Intelligence

Provide insights into:

- Skill availability
- Regional talent pools
- Emerging skills
- Hiring trends

## 5. Government Skill Planning

Support evidence-based planning for:

- Skill-development programs
- Training capacity
- Regional interventions
- Emerging occupations

## 6. Skill-Gap Early Warning System

Detect rapidly growing skill shortages before they become critical.

## 7. Digital Labour-Market Intelligence Model

Build a continuously updated representation connecting:

```text
Skills
  ↕
Workers
  ↕
Jobs
  ↕
Industries
  ↕
Regions
  ↕
Training
```

---

# 📊 Current Development Status

| Component | Status |
|---|---|
| Repository | ✅ Initialized |
| Frontend | ✅ MVP Dashboard |
| React + TypeScript | ✅ |
| FastAPI Backend | ✅ |
| API Health Endpoint | ✅ |
| Configuration System | ✅ |
| Git Security | ✅ |
| Data Directory | ✅ |
| Data Ingestion | 🔄 In Progress |
| Skill Taxonomy | 🔄 Planned |
| Demand Engine | 🔄 Planned |
| Supply Engine | 🔄 Planned |
| Skill-Gap Engine | 🔄 Planned |
| Forecasting | 🔄 Planned |
| Regional Intelligence | 🔄 Planned |
| AI Insights | 🔄 Planned |
| Production Deployment | ⏳ Future |

---

# 👥 Intended Users

KaushalIQ is designed to support:

- Government skill-development administrators
- Policymakers
- Training institutions
- Workforce planners
- Employers
- Students
- Job seekers
- Researchers

---

# 🌱 Vision

> **Turn fragmented labour-market data into actionable skill intelligence.**

KaushalIQ aims to make labour-market trends **measurable, understandable, and forecastable**, enabling more data-driven workforce planning and skill-development decisions.

---

# 📌 Smart India Hackathon

**Problem Statement ID:** SIH26246

**Problem Statement:** AI-Enabled Labour Market Intelligence and Skill Demand-Supply Forecasting Engine

**Organization:** Ministry of Skill Development and Entrepreneurship (MSDE)

**Category:** Software

**Theme:** Miscellaneous

**Event:** Smart India Hackathon 2026

---

# 📜 License

This project is currently being developed as a prototype for **Smart India Hackathon 2026**.

License and open-source terms can be finalized after the hackathon.
