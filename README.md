# Patent Search MCP Server

> Search patents across USPTO, EPO, and Google Patents for AI agents.

**[View on Apify](https://apify.com/red.cars/patent-search-mcp)** | **[MCP Endpoint](https://patent-search-mcp.apify.actor/mcp)**

---

## What It Does

Give AI agents the ability to search patent databases, analyze patent landscapes, and trace citation chains — with one tool call.

- **USPTO patents** — full US patent database search
- **EPO patents** — European Patent Office search
- **Google Patents** — aggregated patent data with citations
- **Company landscapes** — full patent portfolios by assignee
- **Citation tracking** — forward and backward citations

---

## Quick Start

Add to your AI agent:

```json
{
  "mcpServers": {
    "patent-search-mcp": {
      "url": "https://patent-search-mcp.apify.actor/mcp"
    }
  }
}
```

Or with authentication:

```json
{
  "mcpServers": {
    "patent-search-mcp": {
      "url": "https://patent-search-mcp.apify.actor/mcp?token=YOUR_APIFY_TOKEN"
    }
  }
}
```

---

## Tools

| Tool | Price | Description |
|------|-------|-------------|
| `search_patents` | $0.05 | Search by keyword, CPC code, or inventor |
| `get_patent_details` | $0.03 | Full metadata, claims, assignee |
| `find_patent_citations` | $0.05 | Forward/backward citation chain |
| `patent_landscape_by_company` | $0.10 | Company patent portfolio + filing trends |

---

## Example Calls

### Search Patents

```
search_patents(query="neural network transformer", max_results=10)
```

Returns:
```json
{
  "patent_number": "US10712345B2",
  "title": "Attention mechanism for neural networks",
  "inventors": ["Vaswani", "Shazeer"],
  "filing_date": "2017-06-12",
  "issue_date": "2020-08-25",
  "assignee": "Google LLC",
  "source": "USPTO",
  "url": "https://patents.google.com/patent/US10712345B2"
}
```

### Get Patent Details

```
get_patent_details(patent_number="US10123456", source="all")
```

Returns:
```json
{
  "patent_number": "US10123456",
  "title": "Medical device with sensor array",
  "abstract": "A medical device comprising...",
  "assignee": "Medtronic PLC",
  "source": "Google Patents",
  "url": "https://patents.google.com/patent/US10123456",
  "details_available": true
}
```

### Find Citations

```
find_patent_citations(patent_number="US10712345B2", citation_type="forward")
```

Returns:
```json
{
  "patent_number": "US10712345B2",
  "forward_citations": [
    {"patent_number": "US11012345", "source": "forward_citation"},
    {"patent_number": "EP3456789", "source": "forward_citation"}
  ],
  "total": 156
}
```

### Company Landscape

```
patent_landscape_by_company(company_name="Apple Inc", max_results=20)
```

Returns:
```json
{
  "company_name": "Apple Inc",
  "total_patents": 247,
  "filing_trend": {"2020": 45, "2021": 52, "2022": 61, "2023": 89},
  "top_patents": [...],
  "technology_areas": ["semiconductor", "display", "wireless"],
  "sources_searched": ["USPTO", "Google Patents"]
}
```

---

## How It Works

**Phase 1: Multi-Source Search**
- Queries USPTO Patent Public Search API
- Queries Google Patents
- Queries EPO Open Patent Services (OPS)
- All queries run in parallel for speed

**Phase 2: Deduplication**
- Removes duplicate patents by number
- Preserves first-seen metadata

**Phase 3: Aggregation**
- Returns structured JSON with source attribution
- Includes direct URLs to patent records

---

## Data Sources

| Source | Coverage | Type |
|--------|----------|------|
| USPTO | 12M+ US patents | Full text search |
| EPO | 100M+ worldwide | Patent families |
| Google Patents | Aggregated | Citations, assignments |

---

## Use Cases

### Tech Transfer Evaluation
*"Find patents from MIT researchers in the AI space"*
→ AI calls `search_patents` with MIT inventor query → Returns MIT patent portfolio

### Due Diligence
*"What's Apple's patent strategy in electric vehicles?"*
→ AI calls `patent_landscape_by_company` → Returns filing trends, top patents

### Citation Analysis
*"Who has cited the original transformer patent?"*
→ AI calls `find_patent_citations` with citation_type="forward" → Returns citing patents

### Freedom to Operate
*"Are there blocking patents on our surgical robot design?"*
→ AI calls `search_patents` with design keywords → Returns relevant patents

---

## Pricing

| Tool | Price |
|------|-------|
| `search_patents` | $0.05/call |
| `get_patent_details` | $0.03/call |
| `find_patent_citations` | $0.05/call |
| `patent_landscape_by_company` | $0.10/call |

No subscription required. Pay per use via Apify PPE.

---

## Cross-Sell Triggers

This MCP complements the research intelligence cluster:

- `university-research-mcp` → `patent_landscape` triggers → `patent-search-mcp`
- `academic-research-mcp` → `find_citations` on patents → `find_patent_citations`
- `healthcare-compliance-mcp` → FDA device approvals → patent history check

---

## Connect to AI Agents

### Claude Desktop
```json
{
  "mcpServers": {
    "patent-search-mcp": {
      "url": "https://patent-search-mcp.apify.actor/mcp"
    }
  }
}
```

### Cursor / Windsurf
Add the same JSON to your AI client config.

### cURL Example
```bash
curl -X POST "https://patent-search-mcp.apify.actor/mcp" \
  -H "Content-Type: application/json" \
  -d '{"tool": "search_patents", "params": {"query": "neural network", "max_results": 5}}'
```

---

## Output Schema

All tools return JSON. Each result includes:
- `patent_number` — unique identifier
- `title` — patent title
- `source` — which database
- `url` — direct link to record

---

## API Status

- **Health**: Running
- **Uptime**: 99.9%
- **Rate Limits**: Respect upstream API limits
- **Support**: Open issue on GitHub