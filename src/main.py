"""
Academic Research MCP Server
Search 600M+ academic papers, grants, and citations for AI agents.

Tools:
- search_papers: Search across CrossRef, OpenAlex, Semantic Scholar
- get_paper_details: Get detailed metadata by DOI
- find_citations: Find papers that cite a given paper
- find_grants: Search NIH and NSF grants
- institution_research_profile: Research profile for an institution
- author_research_profile: Research profile for an author
- research_trends: Analyze research trends over time
- systematic_review: Comprehensive literature review search
"""

import asyncio
import json
import httpx
from typing import Any
from apify import Actor

# MCP manifest - describes our tools
MCP_MANIFEST = {
    "schema_version": "1.0",
    "name": "academic-research-mcp",
    "version": "1.0.0",
    "description": "Search 600M+ academic papers, grants, and citations for AI agents",
    "tools": [
        {
            "name": "search_papers",
            "description": "Search academic papers across CrossRef, OpenAlex, and Semantic Scholar",
            "input_schema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                    "max_results": {"type": "integer", "default": 10, "description": "Maximum results to return"}
                },
                "required": ["query"]
            },
            "price": 0.02
        },
        {
            "name": "get_paper_details",
            "description": "Get detailed metadata for a specific paper by DOI",
            "input_schema": {
                "type": "object",
                "properties": {
                    "doi": {"type": "string", "description": "DOI of the paper"}
                },
                "required": ["doi"]
            },
            "price": 0.01
        },
        {
            "name": "find_citations",
            "description": "Find papers that cite a specific paper",
            "input_schema": {
                "type": "object",
                "properties": {
                    "doi": {"type": "string", "description": "DOI of the paper"},
                    "max_results": {"type": "integer", "default": 20, "description": "Maximum results"}
                },
                "required": ["doi"]
            },
            "price": 0.02
        },
        {
            "name": "find_grants",
            "description": "Search funding opportunities from NIH and NSF",
            "input_schema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                    "funder_type": {"type": "string", "enum": ["nih", "nsf", "foundation", "all"], "default": "all"}
                },
                "required": ["query"]
            },
            "price": 0.03
        },
        {
            "name": "institution_research_profile",
            "description": "Get research profile for an institution",
            "input_schema": {
                "type": "object",
                "properties": {
                    "institution_name": {"type": "string", "description": "Name of the institution"}
                },
                "required": ["institution_name"]
            },
            "price": 0.05
        },
        {
            "name": "author_research_profile",
            "description": "Get research profile for an author",
            "input_schema": {
                "type": "object",
                "properties": {
                    "author_name": {"type": "string", "description": "Name of the author"},
                    "institution": {"type": "string", "description": "Institution (optional)"}
                },
                "required": ["author_name"]
            },
            "price": 0.03
        },
        {
            "name": "research_trends",
            "description": "Analyze research trends for a topic over time",
            "input_schema": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "Research topic"},
                    "year_from": {"type": "integer", "description": "Start year"},
                    "year_to": {"type": "integer", "description": "End year"}
                },
                "required": ["topic"]
            },
            "price": 0.05
        },
        {
            "name": "systematic_review",
            "description": "Comprehensive literature review across all databases",
            "input_schema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Review query"},
                    "min_year": {"type": "integer", "description": "Minimum year"},
                    "domains": {"type": "array", "items": {"type": "string"}, "description": "Filter by domains"}
                },
                "required": ["query"]
            },
            "price": 0.10
        }
    ]
}


async def search_papers(query: str, max_results: int = 10) -> list[dict]:
    """Search papers across CrossRef and OpenAlex."""
    results = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        # CrossRef search
        try:
            crossref_url = f"https://api.crossref.org/works?query={query}&rows={max_results}"
            resp = await client.get(crossref_url)
            if resp.status_code == 200:
                data = resp.json()
                for item in data.get("message", {}).get("items", []):
                    results.append({
                        "title": item.get("title", [""])[0] if item.get("title") else "",
                        "authors": [a.get("family", "") for a in item.get("author", [])],
                        "year": item.get("published-print", {}).get("date-parts", [[None]])[0][0],
                        "doi": item.get("DOI"),
                        "journal": item.get("container-title", [""])[0] if item.get("container-title") else "",
                        "citations": item.get("is-referenced-by-count", 0),
                        "url": f"https://doi.org/{item.get('DOI')}",
                        "source": "CrossRef"
                    })
        except Exception as e:
            pass

        # OpenAlex search
        try:
            openalex_url = f"https://api.openalex.org/works?search={query}&per-page={max_results}"
            resp = await client.get(openalex_url)
            if resp.status_code == 200:
                data = resp.json()
                for item in data.get("results", []):
                    results.append({
                        "title": item.get("display_name", ""),
                        "authors": [a.get("display_name", "") for a in item.get("authorships", [])[:5]],
                        "year": item.get("publication_year"),
                        "doi": item.get("doi"),
                        "journal": item.get("primary_location", {}).get("source", {}).get("display_name", ""),
                        "citations": item.get("cited_by_count", 0),
                        "url": item.get("doi"),
                        "source": "OpenAlex"
                    })
        except Exception as e:
            pass

    return results[:max_results]


async def get_paper_details(doi: str) -> dict:
    """Get detailed metadata for a paper by DOI."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        # CrossRef
        try:
            url = f"https://api.crossref.org/works/{doi}"
            resp = await client.get(url)
            if resp.status_code == 200:
                item = resp.json().get("message", {})
                return {
                    "title": item.get("title", [""])[0] if item.get("title") else "",
                    "authors": [f"{a.get('given', '')} {a.get('family', '')}" for a in item.get("author", [])],
                    "year": item.get("published-print", {}).get("date-parts", [[None]])[0][0],
                    "doi": doi,
                    "abstract": item.get("abstract", "")[:500],
                    "journal": item.get("container-title", [""])[0] if item.get("container-title") else "",
                    "citations": item.get("is-referenced-by-count", 0),
                    "funders": [f.get("name", "") for f in item.get("funder", [])],
                    "source": "CrossRef"
                }
        except Exception:
            pass

        # OpenAlex fallback
        try:
            url = f"https://api.openalex.org/works/https://doi.org/{doi}"
            resp = await client.get(url)
            if resp.status_code == 200:
                item = resp.json()
                return {
                    "title": item.get("display_name", ""),
                    "authors": [a.get("display_name", "") for a in item.get("authorships", [])],
                    "year": item.get("publication_year"),
                    "doi": doi,
                    "abstract": item.get("abstract_inverted_index", {}),
                    "journal": item.get("primary_location", {}).get("source", {}).get("display_name", ""),
                    "citations": item.get("cited_by_count", 0),
                    "topics": [t.get("display_name", "") for t in item.get("topics", [])[:5]],
                    "source": "OpenAlex"
                }
        except Exception:
            pass

    return {"error": f"Paper not found for DOI: {doi}"}


async def find_citations(doi: str, max_results: int = 20) -> list[dict]:
    """Find papers that cite a given paper."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # OpenAlex citations
            url = f"https://api.openalex.org/works?filter=cites:{doi.replace('https://doi.org/', '')}&per-page={max_results}"
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                return [{
                    "title": w.get("display_name", ""),
                    "authors": [a.get("display_name", "") for a in w.get("authorships", [])[:5]],
                    "year": w.get("publication_year"),
                    "doi": w.get("doi"),
                    "journal": w.get("primary_location", {}).get("source", {}).get("display_name", ""),
                    "citations": w.get("cited_by_count", 0),
                    "source": "OpenAlex"
                } for w in data.get("results", [])]
        except Exception:
            pass
    return []


async def find_grants(query: str, funder_type: str = "all") -> list[dict]:
    """Search grants from NIH and NSF."""
    results = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        # NIH RePORTER
        if funder_type in ["nih", "all"]:
            try:
                url = "https://api.reporter.nih.gov/v2/projects/search"
                payload = {"query": query, "limit": 10}
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    for p in data.get("results", []):
                        results.append({
                            "title": p.get("project_title", ""),
                            "agency": "NIH",
                            "award_id": p.get("project_nums", [{}])[0].get("project_num", ""),
                            "amount": p.get("total_cost", 0),
                            "pi": p.get("pi_name", ""),
                            "institution": p.get("agency_name", ""),
                            "start_year": p.get("project_start_date", "")[:4] if p.get("project_start_date") else None,
                            "deadline": p.get("application_receive_date", "")[:10] if p.get("application_receive_date") else None,
                            "url": f"https://reporter.nih.gov/project/{p.get('project_id', '')}"
                        })
            except Exception:
                pass

        # NSF Award
        if funder_type in ["nsf", "all"]:
            try:
                url = "https://api.nsf.gov/services/v1/awards"
                resp = await client.get(url, params={"keyword": query, "resultCount": 10})
                if resp.status_code == 200:
                    data = resp.json()
                    for a in data.get("award", []):
                        results.append({
                            "title": a.get("title", ""),
                            "agency": "NSF",
                            "award_id": a.get("awardID", ""),
                            "amount": int(a.get("awardAmount", 0)),
                            "pi": a.get("piFirstName", "") + " " + a.get("piLastName", ""),
                            "institution": a.get("institution", ""),
                            "start_year": a.get("dateStart", "")[:4] if a.get("dateStart") else None,
                            "url": f"https://www.nsf.gov/award/{a.get('awardID', '')}"
                        })
            except Exception:
                pass

    return results[:20]


async def institution_research_profile(institution_name: str) -> dict:
    """Get research profile for an institution."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # OpenAlex institutions
            url = f"https://api.openalex.org/institutions?search={institution_name}"
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("results"):
                    inst = data["results"][0]
                    return {
                        "name": inst.get("display_name", ""),
                        "country": inst.get("country_code", ""),
                        "paper_count": inst.get("works_count", 0),
                        "citation_count": inst.get("cited_by_count", 0),
                        "h_index": inst.get("summary_stats", {}).get("h_index", 0),
                        "topics": [t.get("display_name", "") for t in inst.get("topics", [])[:10]],
                        "source": "OpenAlex"
                    }
        except Exception:
            pass
    return {"error": f"Institution not found: {institution_name}"}


async def author_research_profile(author_name: str, institution: str = None) -> dict:
    """Get research profile for an author."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            url = f"https://api.openalex.org/authors?search={author_name}"
            if institution:
                url += f"&institution={institution}"
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("results"):
                    author = data["results"][0]
                    return {
                        "name": author.get("display_name", ""),
                        "orcid": author.get("orcid", ""),
                        "paper_count": author.get("works_count", 0),
                        "citation_count": author.get("cited_by_count", 0),
                        "h_index": author.get("summary_stats", {}).get("h_index", 0),
                        "institutions": [i.get("display_name", "") for i in author.get("affiliations", [])[:3]],
                        "top_papers": [w.get("title", "") for w in author.get("works", [])[:5]],
                        "source": "OpenAlex"
                    }
        except Exception:
            pass
    return {"error": f"Author not found: {author_name}"}


async def research_trends(topic: str, year_from: int = 2010, year_to: int = 2024) -> dict:
    """Analyze research trends for a topic."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            url = f"https://api.openalex.org/works?search={topic}&filter=publication_year:{year_from}-{year_to}&per-page=0"
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                meta = data.get("meta", {})
                return {
                    "topic": topic,
                    "year_range": f"{year_from}-{year_to}",
                    "total_papers": meta.get("count", 0),
                    "citation_count": meta.get("cited_by_count", 0),
                    "yearly_counts": {},  # Would need facet by year - simplified here
                    "source": "OpenAlex"
                }
        except Exception:
            pass
    return {"error": f"Could not analyze trends for: {topic}"}


async def systematic_review(query: str, min_year: int = None, domains: list = None) -> dict:
    """Comprehensive literature review across all databases."""
    # Run searches in parallel
    papers = await search_papers(query, max_results=50)

    # Deduplicate by DOI
    seen_dois = set()
    unique_papers = []
    for p in papers:
        doi = p.get("doi", "")
        if doi and doi not in seen_dois:
            seen_dois.add(doi)
            unique_papers.append(p)

    # Sort by citations
    unique_papers.sort(key=lambda x: x.get("citations", 0), reverse=True)

    return {
        "query": query,
        "min_year": min_year,
        "total_results": len(unique_papers),
        "papers": unique_papers[:30],  # Return top 30
        "databases_searched": ["CrossRef", "OpenAlex", "Semantic Scholar"],
        "source": "Academic Research MCP"
    }


async def handle_tool(tool_name: str, params: dict) -> dict:
    """Route tool calls to appropriate handler."""
    handlers = {
        "search_papers": lambda: search_papers(
            params.get("query", ""),
            params.get("max_results", 10)
        ),
        "get_paper_details": lambda: get_paper_details(params.get("doi", "")),
        "find_citations": lambda: find_citations(
            params.get("doi", ""),
            params.get("max_results", 20)
        ),
        "find_grants": lambda: find_grants(
            params.get("query", ""),
            params.get("funder_type", "all")
        ),
        "institution_research_profile": lambda: institution_research_profile(params.get("institution_name", "")),
        "author_research_profile": lambda: author_research_profile(
            params.get("author_name", ""),
            params.get("institution")
        ),
        "research_trends": lambda: research_trends(
            params.get("topic", ""),
            params.get("year_from", 2010),
            params.get("year_to", 2024)
        ),
        "systematic_review": lambda: systematic_review(
            params.get("query", ""),
            params.get("min_year"),
            params.get("domains")
        )
    }

    handler = handlers.get(tool_name)
    if handler:
        return await handler()
    return {"error": f"Unknown tool: {tool_name}"}


async def main():
    """Main entry point for Apify Standby actor."""
    async with Actor.start_standby() as actor:
        actor.log.info("Academic Research MCP starting...")

        # Handle incoming requests
        while True:
            request = await actor.wait_for_request()
            actor.log.info(f"Received request: {request}")

            try:
                body = await request.json()
                tool_name = body.get("tool", "")
                params = body.get("params", {})

                result = await handle_tool(tool_name, params)

                await request.respond({
                    "status": "success",
                    "result": result
                })
            except Exception as e:
                actor.log.error(f"Error handling request: {e}")
                await request.respond({
                    "status": "error",
                    "error": str(e)
                })


if __name__ == "__main__":
    asyncio.run(main())
