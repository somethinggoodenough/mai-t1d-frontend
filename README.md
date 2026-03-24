# MAI-T1D Frontend

**Multimodal AI in Type 1 Diabetes** — a web application for exploring multimodal T1D research data and querying a biomedical knowledge graph through natural language.

## About the Project

MAI-T1D provides researchers with two primary capabilities:

- **Explore Data** — Browse and filter donor, sample, and model information from T1D studies. Filters include clinical attributes (age, sex, BMI, HbA1c, clinical diagnosis, T1D stage, disease status, autoantibodies) and sample attributes (features, cell types, processing types, and data modalities such as CODEX, IMC, scRNA-seq, ATAC-seq, and more). Logical AND/OR operators allow fine-grained queries across categories.

- **AI Chat** — Ask natural language questions about T1D-related genes, diseases, SNPs, and other biomedical entities. Questions are sent to a backend AI agent service that queries the PanKgraph knowledge graph, searches literature, and returns formatted, cited answers.

## Frontend Architecture

### Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 |
| State Management | Redux Toolkit |
| UI Components | MUI v5 |
| Routing | React Router DOM v6 |
| HTTP Client | Axios |
| Graph Visualization | Cytoscape.js |
| Markdown Rendering | react-markdown + remark/rehype plugins |
| Build | Create React App with CRACO overrides |

### Project Structure

```
src/
├── index.js              # App entry, route definitions
├── pages/
│   ├── AIChatPage.js     # AI chat interface
│   └── ExploreDataPage.js # Data exploration with filters
├── redux/
│   ├── store.js          # Redux store configuration
│   ├── aiAgentSlice.js   # AI query dispatch & response handling
│   ├── aiAnswerSlice.js  # AI-generated summary requests
│   ├── feedbackSlice.js  # User feedback submission
│   └── uiSlice.ts        # UI state
├── axios/
│   └── axios.js          # Axios instances for API communication
├── components/           # Shared components
├── NavBar/               # Navigation bar
├── Footer/               # Page footer
└── theme/                # MUI theme configuration
```

### Routes

| Path | Page | Description |
|---|---|---|
| `/` | Home | Landing page |
| `/explore-data` | ExploreDataPage | Data exploration with filter sidebar |
| `/ai-chat` | AIChatPage | Natural language Q&A interface |
| `/publication` | Publication | Publications listing |

### Data Flow

User questions submitted through AI Chat are sent to the backend agent server (`POST /query`). The PlannerAgent orchestrates sub-agents to query the PanKgraph Neo4j knowledge graph via auto-generated Cypher, search literature, and match templates. Results are formatted with markdown and citations, then returned to the frontend via Redux async thunks.

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm

### Installation

```bash
npm install
```

### Available Scripts

- **`npm start`** — Run in development mode at [http://localhost:3000](http://localhost:3000)
- **`npm run build`** — Build for production into the `build/` folder
- **`npm test`** — Launch the test runner
