# Academic Research MCP — PRD

**Version:** 1.0
**Date:** 2026-04-15
**Status:** Draft — for review before build
**Template:** Standby Python project (Apify)
**GitHub Repo:** `wdavalos/apify-actors/academic-research-mcp`
**MCP Endpoint:** `https://academic-research-mcp.apify.actor/mcp`

---

## 1. Concept & Vision

**What it does:** Give AI agents the ability to search academic literature across 6 databases simultaneously, retrieve structured paper metadata, find grants, and synthesize research — with one tool call.

**What it feels like:** A research assistant that has access to every academic database and never gets tired. AI agents call it to find "papers on X," "who funded Y," "what grants exist for Z."

**Tagline:** *"Your AI agent's research librarian — searches 200M+ papers in one call."*

---

## 2. Differentiation from ApifyForge

ApifyForge has **Academic Commercialization Pipeline MCP** — focused on tech transfer, venture, investment decisions ( commercialization probability score 0-100).

**Our focus:** Pure research discovery — find papers, grants, citations, literature reviews.

| Feature | ApifyForge | Ours |
|---------|-----------|------|
| Focus | Commercialization scoring | Research discovery |
| Primary DBs | OpenAlex, Semantic Scholar, ArXiv | CrossRef, OpenAlex, Semantic Scholar, DBLP, CORE, PubMed |
| Patents | USPTO, EPO | None (separate concern) |
| Grants | NIH, Grants.gov | NIH, NSF, Foundations (more) |
| Clinical Trials | ClinicalTrials | PubMed (biomedical focus) |
| Output | Score + verdict | Papers + metadata + citations |
| Price | $0.045 | $0.05 |

**We cover databases ApifyForge doesn't:**
- CrossRef (150M papers, not in ApifyForge)
- DBLP (6M CS papers, not in ApifyForge)
- CORE (300M open access papers)
- PubMed (biomedical, not in their pipeline)

---

## 3. Data Sources (All Free, No Scraping)

| Source | Records | What's Available | API |
|--------|---------|-----------------|-----|
| **CrossRef** | 150M+ | DOIs, titles, authors, citations, funding | Free REST API |
| **OpenAlex** | 250M+ | Papers, citations, institutions, topics | Free REST API |
| **Semantic Scholar** | 200M+ | Papers, citations, AI summaries, influential citations | Free REST API |
| **DBLP** | 6M+ | CS papers, venues, authors | Free XML API |
| **CORE** | 300M+ | Open access papers, PDFs | Free API |
| **PubMed** | 35M+ | Biomedical abstracts, MeSH terms | Free E-utilities API |
| **NIH Reporter** | 900K+ | NIH grants, funding | Free API |
| **NSF Award** | 200K+ | NSF grants | Free API |

**Total searchable:** 600M+ academic works

---

## 4. MCP Tools

Each tool is a separate callable function. AI agents choose which they need.

### Tool 1: `search_papers`
Search academic papers across all databases.

```
Input:  query (string), max_results (int, default 10)
Output: papers array with title, authors, year, journal, citations, DOI, URL
Price: $0.02/call
```

### Tool 2: `get_paper_details`
Get detailed metadata for a specific paper by DOI.

```
Input:  doi (string)
Output: full metadata — abstract, references, cited_by count, funders, MeSH terms
Price: $0.01/call
```

### Tool 3: `find_citations`
Find papers that cite a specific paper.

```
Input:  doi (string), max_results (int, default 20)
Output: citing papers with metadata
Price: $0.02/call
```

### Tool 4: `find_grants`
Search funding opportunities relevant to a research topic.

```
Input:  query (string), funder_type (string: nih|nsf|foundation, default all)
Output: grants with title, amount, deadline, agency, award_id
Price: $0.03/call
```

### Tool 5: `institution_research_profile`
Get research profile for an institution.

```
Input:  institution_name (string)
Output: paper count, citation count, h-index, top topics, top researchers
Price: $0.05/call
```

### Tool 6: `author_research_profile`
Get research profile for an author.

```
Input:  author_name (string), institution (string, optional)
Output: paper count, citation count, h-index, top papers, co-authors
Price: $0.03/call
```

### Tool 7: `research_trends`
Analyze research trends for a topic over time.

```
Input:  topic (string), year_from (int), year_to (int)
Output: paper count per year, citation velocity, emerging sub-topics
Price: $0.05/call
```

### Tool 8: `systematic_review`
Comprehensive search across all DBs for literature review.

```
Input:  query (string), min_year (int), domains (array, optional)
Output: deduplicated papers ranked by citations + relevance score
Price: $0.10/call (orchestrates all 6 DBs)
```

---

## 5. Output Schema

### Paper Result
```json
{
  "title": "Attention Is All You Need",
  "authors": ["Vaswani et al."],
  "year": 2017,
  "journal": "NeurIPS",
  "doi": "10.48550/arXiv.1706.03762",
  "url": "https://arxiv.org/abs/1706.03762",
  "citations": 98000,
  "open_access": true,
  "abstract": "The dominant sequence transduction models...",
  "funders": ["Google"],
  "topics": ["transformers", "NLP", "deep learning"],
  "source": "CrossRef"
}
```

### Grant Result
```json
{
  "title": "Neural Network Interpretability for NLP",
  "agency": "NSF",
  "award_id": "NSF-2024-12345",
  "amount": 500000,
  "currency": "USD",
  "start_date": "2024-07-01",
  "end_date": "2027-06-30",
  "deadline": "2024-05-15",
  "pi": "Dr. Jane Smith",
  "institution": "MIT",
  "url": "https://nsf.gov/award/12345"
}
```

---

## 6. Pricing

| Tier | Price | Notes |
|------|-------|-------|
| Per tool call | $0.01-0.10 | Based on complexity |
| Monthly cap | $49/mo | Unlimited calls within cap |
| Enterprise | $199/mo | Higher limits, priority |

**PPE (Pay-Per-Event):** Primary model. No subscription required.

---

## 7. Marketing / SEO — How AI Agents Find Us

### Distribution Model (ApifyForge Playbook)

ApifyForge has NO registries. Their model:
1. **Own SaaS website** (apifyforge.com) — storefront, tool listings, pricing
2. **Public GitHub** (github.com/apifyforge) — discoverable by AI agents via semantic search
3. **Apify Store** — human discoverability

**We follow the same model.**

#### P0: Own SaaS Website
```
[brand].com / apify/[brand]
- Landing page with all MCP tools listed
- Pricing page
- Quick start guide
- llms.txt at root — AI agents discover via semantic crawl
```

#### P0: GitHub (Public, No Approval)
```
github.com/wdavalos/academic-research-mcp
- README with full tool descriptions
- GitHub topics: mcp-server, model-context-protocol, academic-research, literature-review
- MCP spec manifest in repo
```

#### P0: llms.txt
AI agents crawl llms.txt. We need:
```
/llms.txt → lists all tools with descriptions
/llms-full.txt → detailed schema for each tool
```
This is NOT a registry — it's a file on our website that AI agents discover.

#### P1: Apify Store
```
apify.com/wdavalos/academic-research-mcp
- Human discoverability
- PPE pricing configured
- README with SEO keywords
```

#### P2: Comparison Pages (SEO)
```
/compare/academic-research-mcp-vs-apifyforge
/research-paper-search-apis
/best-mcp-servers-research

### README SEO Keywords

Place naturally in README:
- "academic paper search"
- "research literature discovery"
- "find citations for AI papers"
- "grant discovery for researchers"
- "PubMed CrossRef OpenAlex search"
- "systematic literature review"
- "h-index calculation"
- "research trend analysis"

---

## 8. AI Agent Use Cases

### Use Case 1: Literature Review
```
Human: "Find me papers on transformer models for time series forecasting"
AI Agent → calls search_papers(query="transformer time series forecasting", max_results=20)
→ Returns: ranked papers with citations, abstracts, DOIs
```

### Use Case 2: Grant Discovery
```
Human: "What grants exist for NLP research under $1M?"
AI Agent → calls find_grants(query="natural language processing", max_amount=1000000)
→ Returns: matching grants with deadlines and amounts
```

### Use Case 3: Due Diligence
```
Human: "What's the research profile of Stanford's AI Lab?"
AI Agent → calls institution_research_profile(institution_name="Stanford")
→ Returns: h-index, top researchers, publication count, funding
```

### Use Case 4: Citation Analysis
```
Human: "Who has cited Bengio's 2018 Turing Award paper?"
AI Agent → calls find_citations(doi="10.1145/3442188.3445922")
→ Returns: all citing papers with metadata
```

### Use Case 5: Systematic Review
```
Human: "Do a systematic review of mRNA vaccine research 2020-2024"
AI Agent → calls systematic_review(query="mRNA vaccine", min_year=2020)
→ Returns: deduplicated, ranked papers across all 6 DBs
```

---

## 9. Frictionless Design Principles

**For AI agents:**
- Max 3 parameters per tool
- All parameters have defaults (AI can call with just query)
- Output is always valid JSON (parseable)
- Errors return clear messages, not HTTP codes
- Price always visible in tool description

**For developers:**
- One JSON config to connect
- README with working examples
- TypeScript/Python code samples
- No authentication steps beyond Apify token

**For humans:**
- llms.txt for AI agent discovery
- Comparison pages for human SEO
- Clear pricing page

---

## 10. Build Checklist

### Infrastructure
- [ ] Create GitHub repo: `wdavalos/academic-research-mcp`
- [ ] Clone Standby Python template
- [ ] Set up Apify actor: `academic-research-mcp`
- [ ] Implement MCP manifest (spec compliant)
- [ ] Deploy to Apify: `apify push`

### Tools Implementation
- [ ] search_papers (CrossRef + OpenAlex)
- [ ] get_paper_details
- [ ] find_citations
- [ ] find_grants (NIH + NSF)
- [ ] institution_research_profile
- [ ] author_research_profile
- [ ] research_trends
- [ ] systematic_review

### SEO / Distribution
- [ ] llms.txt with all tools
- [ ] llms-full.txt with detailed schemas
- [ ] GitHub topics: mcp-server, model-context-protocol, academic-research, literature-review
- [ ] GitHub repo public with full README
- [ ] Own SaaS website / landing page
- [ ] Comparison page vs ApifyForge
- [ ] Apify Store listing

### Testing
- [ ] Test each tool with real queries
- [ ] Verify JSON schema matches spec
- [ ] Test with Claude Desktop
- [ ] Test with Cursor

---

## 11. Success Metrics

| Metric | 30-Day | 90-Day |
|--------|--------|--------|
| MCP registry listings | 1 | 3 |
| Tool calls (test) | 50 | 500 |
| GitHub stars | 5 | 25 |
| SEO keywords ranked (top 5) | 1 | 5 |
| Paid calls | 0 | 50 |

---

## 12. What Could Go Wrong

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| API rate limits (NIH, NSF) | Medium | Add delays, batch requests |
| CrossRef deprecated endpoint | Low | OpenAlex fallback primary |
| Zero initial discovery | Medium | SEO + comparison pages + GitHub topics |
| API cost > revenue | Low | Monitor usage, adjust pricing |
| llms.txt not indexed | Medium | Submit to AI agent crawlers |
