# Add Academic Research to Your AI Agent in 5 Minutes

A practical guide for AI agent developers (LangChain, AutoGen, CrewAI) to add academic research intelligence — 600M+ papers, grants, citations, and author profiles — to their agents in minutes. No API keys required beyond your Apify token.

## What We're Building

An AI agent that can:
1. Search 600M+ academic papers across CrossRef, OpenAlex, Semantic Scholar
2. Find NIH and NSF grants for any research topic
3. Trace citation chains to understand research influence
4. Get institution and author research profiles with h-index
5. Track research trends over time
6. Generate systematic literature reviews

## Prerequisites

- Node.js 18+
- An Apify API token ([free account works](https://console.apify.com/settings/integrations))
- An AI agent framework: LangChain, AutoGen, or CrewAI

## The MCPs We're Using

| MCP | Purpose | Cost | Endpoint |
|-----|---------|------|----------|
| `academic-research-mcp` | 600M+ papers, grants, citations, profiles | $0.01-0.10/call | `academic-research-mcp.apify.actor` |
| `university-research-mcp` | Institution reports, patent landscapes, funding | $0.05-0.15/call | `university-research-mcp.apify.actor` |
| `healthcare-compliance-mcp` | FDA device approvals, MAUDE, ClinicalTrials | $0.03-0.15/call | `red-cars--healthcare-compliance-mcp.apify.actor` |

**Note:** `academic-research-mcp` provides paper-level intelligence (citations, authors, trends). Chain it with `university-research-mcp` for institutional-level analysis (tech transfer, spinouts, licensing) and `healthcare-compliance-mcp` for clinical trial and FDA device data.

## Step 1: Add the MCP Servers

### MCP Server Configuration

```json
{
  "mcpServers": {
    "academic-research": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-apify", "academic-research-mcp"],
      "env": {
        "APIFY_API_TOKEN": "${APIFY_API_TOKEN}"
      }
    },
    "university-research": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-apify", "university-research-mcp"],
      "env": {
        "APIFY_API_TOKEN": "${APIFY_API_TOKEN}"
      }
    },
    "healthcare-compliance": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-apify", "red-cars--healthcare-compliance-mcp"],
      "env": {
        "APIFY_API_TOKEN": "${APIFY_API_TOKEN}"
      }
    }
  }
}
```

### LangChain Configuration

```javascript
import { ApifyAdapter } from "@langchain/community/tools/apify";
import { ChatOpenAI } from "@langchain/openai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";

const tools = [
  new ApifyAdapter({
    token: process.env.APIFY_API_TOKEN,
    actorId: "academic-research-mcp",
  }),
  new ApifyAdapter({
    token: process.env.APIFY_API_TOKEN,
    actorId: "university-research-mcp",
  }),
  new ApifyAdapter({
    token: process.env.APIFY_API_TOKEN,
    actorId: "red-cars--healthcare-compliance-mcp",
  }),
];

const agent = await initializeAgentExecutorWithOptions(tools, new ChatOpenAI({
  model: "gpt-4",
  temperature: 0
}), { agentType: "openai-functions" });
```

### AutoGen Configuration

```javascript
import { MCPAgent } from "autogen-mcp";

const academicResearchAgent = new MCPAgent({
  name: "academic-research",
  mcpServers: [
    {
      name: "academic-research",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-apify", "academic-research-mcp"],
    },
    {
      name: "university-research",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-apify", "university-research-mcp"],
    },
    {
      name: "healthcare-compliance",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-apify", "red-cars--healthcare-compliance-mcp"],
    }
  ]
});
```

### CrewAI Configuration

```yaml
# crewai.yaml
tools:
  - name: academic_research
    type: apify
    actor_id: academic-research-mcp
    api_token: ${APIFY_API_TOKEN}

  - name: university_research
    type: apify
    actor_id: university-research-mcp
    api_token: ${APIFY_API_TOKEN}

  - name: healthcare_compliance
    type: apify
    actor_id: red-cars--healthcare-compliance-mcp
    api_token: ${APIFY_API_TOKEN}
```

## Step 2: Academic Research Queries

### Search Academic Papers

```javascript
const result = await academicResearchAgent.execute({
  action: "search_papers",
  query: "transformer attention mechanism time series forecasting",
  year_from: 2020,
  max_results: 10
});

console.log(result);
// Returns: papers with title, authors, year, DOI, journal,
//          citation count, source database
```

### Find Research Grants

```javascript
const result = await academicResearchAgent.execute({
  action: "find_grants",
  query: "machine learning NLP",
  funder_type: "all",
  max_results: 5
});

console.log(result);
// Returns: grants with title, agency (NIH/NSF), award ID,
//          amount, PI, institution, deadline
```

### Get Author Research Profile

```javascript
const result = await academicResearchAgent.execute({
  action: "author_research_profile",
  author_name: "Yoshua Bengio",
  institution: "University of Montreal",
  max_results: 10
});

console.log(result);
// Returns: author profile with h-index, top papers,
//          co-authors, citation metrics
```

### Research Trends Analysis

```javascript
const result = await academicResearchAgent.execute({
  action: "research_trends",
  topic: "CRISPR gene editing",
  year_from: 2015,
  year_to: 2025
});

console.log(result);
// Returns: trends with publication volume over time,
//          citation growth, emerging research areas
```

### Systematic Literature Review

```javascript
const result = await academicResearchAgent.execute({
  action: "systematic_review",
  query: "mRNA vaccine research 2020-2025",
  max_results: 50
});

console.log(result);
// Returns: deduplicated, citation-ranked papers across
//          all databases (CrossRef, OpenAlex, Semantic Scholar, PubMed)
```

### Get Paper Details by DOI

```javascript
const result = await academicResearchAgent.execute({
  action: "get_paper_details",
  doi: "10.48550/arXiv.1706.03762",
  max_results: 1
});

console.log(result);
// Returns: full paper metadata with abstract, authors,
//          funding information, publication venue
```

### Find Citations

```javascript
const result = await academicResearchAgent.execute({
  action: "find_citations",
  doi: "10.48550/arXiv.1706.03762",
  citation_type: "forward",
  max_results: 20
});

console.log(result);
// Returns: papers that cite the specified paper,
//          sorted by recency with citation counts
```

## Step 3: Chain Academic + University + Healthcare Intelligence

### Full Example: Biotech Investment Research

```javascript
import { ApifyClient } from 'apify';

const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

async function buildBiotechResearch(topic) {
  console.log(`=== Biotech Research: ${topic} ===\n`);

  // Step 1: Search academic papers
  console.log('[1/5] Searching academic literature...');
  const papers = await apify.call('academic-research-mcp', {
    action: 'search_papers',
    query: topic,
    year_from: 2020,
    max_results: 20
  });

  // Step 2: Find related grants
  console.log('[2/5] Finding research grants...');
  const grants = await apify.call('academic-research-mcp', {
    action: 'find_grants',
    query: topic,
    max_results: 10
  });

  // Step 3: Get research trends
  console.log('[3/5] Analyzing research trends...');
  const trends = await apify.call('academic-research-mcp', {
    action: 'research_trends',
    topic: topic,
    year_from: 2018,
    year_to: 2025
  });

  // Step 4: Find top institutions
  console.log('[4/5] Mapping top research institutions...');
  const topPaper = papers.data?.papers?.[0];
  let institutionReport = null;
  if (topPaper && topPaper.institutions?.[0]) {
    institutionReport = await apify.call('university-research-mcp', {
      action: 'institution_report',
      institution: topPaper.institutions[0].name
    });
  }

  // Step 5: Check clinical trials if healthcare topic
  console.log('[5/5] Checking clinical trials...');
  const trials = await apify.call('red-cars--healthcare-compliance-mcp', {
    action: 'search_clinical_trials',
    condition: topic,
    phase: 'PHASE3',
    status: 'RECRUITING',
    max_results: 5
  });

  // Build report
  const report = {
    topic: topic,
    papers: {
      total: papers.data?.total || 0,
      topPapers: papers.data?.papers?.slice(0, 5) || []
    },
    grants: {
      total: grants.data?.total || 0,
      items: grants.data?.grants?.slice(0, 5) || []
    },
    trends: {
      publicationGrowth: trends.data?.publication_growth || 'N/A',
      citationGrowth: trends.data?.citation_growth || 'N/A'
    },
    institutions: {
      topInstitution: institutionReport?.data?.institution_name || 'N/A',
      compositeScore: institutionReport?.data?.compositeScore || 'N/A'
    },
    clinicalTrials: {
      phase3Count: trials.data?.total || 0,
      recruiting: trials.data?.trials?.filter(t => t.status === 'RECRUITING').length || 0
    }
  };

  console.log('\n=== RESEARCH SUMMARY ===');
  console.log(`Topic: ${report.topic}`);
  console.log(`Papers found: ${report.papers.total}`);
  console.log(`Grants found: ${report.grants.total}`);
  console.log(`Publication trend: ${report.trends.publicationGrowth}`);
  console.log(`Top institution: ${report.institutions.topInstitution}`);
  console.log(`Phase 3 trials: ${report.clinicalTrials.phase3Count} (${report.clinicalTrials.recruiting} recruiting)`);

  return report;
}

buildBiotechResearch('mRNA therapeutics').catch(console.error);
```

### Expected Output

```
=== Biotech Research: mRNA therapeutics ===

[1/5] Searching academic literature...
[2/5] Finding research grants...
[3/5] Analyzing research trends...
[4/5] Mapping top research institutions...
[5/5] Checking clinical trials...

=== RESEARCH SUMMARY ===
Topic: mRNA therapeutics
Papers found: 12,847
Grants found: 34
Publication trend: +240% (2018-2025)
Top institution: University of Pennsylvania
Phase 3 trials: 8 (3 recruiting)
```

## MCP Tool Reference

### Academic Research MCP

**Endpoint:** `academic-research-mcp.apify.actor`

| Tool | Price | Description | Key Parameters |
|------|-------|-------------|----------------|
| `search_papers` | $0.02 | Search 600M+ papers | `query`, `year_from`, `year_to`, `max_results` |
| `get_paper_details` | $0.01 | Get metadata by DOI | `doi`, `max_results` |
| `find_citations` | $0.02 | Find citing papers | `doi`, `citation_type`, `max_results` |
| `find_grants` | $0.03 | NIH/NSF/Foundation grants | `query`, `funder_type`, `max_results` |
| `institution_research_profile` | $0.05 | Institution h-index, stats | `institution_name`, `field`, `max_results` |
| `author_research_profile` | $0.03 | Author h-index, top papers | `author_name`, `institution`, `max_results` |
| `research_trends` | $0.05 | Topic trends over time | `topic`, `year_from`, `year_to` |
| `systematic_review` | $0.10 | Full literature review | `query`, `max_results` |

### University Research MCP

**Endpoint:** `university-research-mcp.apify.actor`

| Tool | Price | Description | Key Parameters |
|------|-------|-------------|----------------|
| `institution_report` | $0.10 | Full institution intelligence | `institution`, `field` |
| `researcher_profile` | $0.05 | Top 10 researchers at institution | `institution`, `field` |
| `patent_landscape` | $0.05 | USPTO/EPO patent filings | `institution`, `field` |
| `funding_analysis` | $0.05 | Grant breakdown by agency | `institution`, `field` |
| `benchmark_institutions` | $0.15 | Compare 2-5 institutions | `institutions[]`, `field` |

### Healthcare Compliance MCP

**Endpoint:** `red-cars--healthcare-compliance-mcp.apify.actor`

| Tool | Price | Description | Key Parameters |
|------|-------|-------------|----------------|
| `search_clinical_trials` | $0.05 | ClinicalTrials.gov search | `condition`, `phase`, `status` |
| `search_fda_approvals` | $0.03 | FDA device approvals | `searchTerm`, `deviceState` |
| `search_maude_reports` | $0.05 | FDA adverse event reports | `manufacturer`, `deviceName` |

## Cost Summary

| MCP | Typical Query | Est. Cost |
|-----|---------------|-----------|
| academic-research-mcp | Paper search | ~$0.02 |
| academic-research-mcp | Grant discovery | ~$0.03 |
| academic-research-mcp | Systematic review | ~$0.10 |
| university-research-mcp | Institution report | ~$0.10 |
| healthcare-compliance-mcp | Clinical trial search | ~$0.05 |

Full biotech research (5 MCP calls): ~$0.30 per report

## Next Steps

1. Clone the [academic-research-mcp](https://github.com/red-cars-io/academic-research-mcp) repo
2. Copy `.env.example` to `.env` and add your `APIFY_API_TOKEN`
3. Run `npm install`
4. Try the examples: `node examples/paper-search.js`

## Related Repositories

- [University Research MCP](https://github.com/red-cars-io/university-research-mcp) - Institution reports, patent landscapes, funding analysis
- [Healthcare Compliance MCP](https://github.com/red-cars-io/healthcare-compliance-mcp) - FDA device approvals, MAUDE, ClinicalTrials
- [Drug Intelligence MCP](https://github.com/red-cars-io/drug-intelligence-mcp) - FDA drug labels, adverse events, drug interactions
- [Patent Search MCP](https://github.com/red-cars-io/patent-search-mcp) - Patent lookup by number, citation chains
- [Tech Scouting Report MCP](https://github.com/red-cars-io/tech-scouting-report-mcp) - Technology commercialization intelligence