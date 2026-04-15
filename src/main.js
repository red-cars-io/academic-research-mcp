/**
 * Academic Research MCP Server
 * Search 600M+ academic papers, grants, and citations for AI agents.
 */

import Apify from 'apify';

// MCP manifest
const MCP_MANIFEST = {
    schema_version: "1.0",
    name: "academic-research-mcp",
    version: "1.0.0",
    description: "Search 600M+ academic papers, grants, and citations for AI agents",
    tools: [
        {
            name: "search_papers",
            description: "Search academic papers across CrossRef, OpenAlex, and Semantic Scholar",
            input_schema: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Search query" },
                    max_results: { type: "integer", default: 10, description: "Maximum results" }
                },
                required: ["query"]
            },
            price: 0.02
        },
        {
            name: "get_paper_details",
            description: "Get detailed metadata for a paper by DOI",
            input_schema: {
                type: "object",
                properties: {
                    doi: { type: "string", description: "DOI of the paper" }
                },
                required: ["doi"]
            },
            price: 0.01
        },
        {
            name: "find_citations",
            description: "Find papers that cite a specific paper",
            input_schema: {
                type: "object",
                properties: {
                    doi: { type: "string", description: "DOI of the paper" },
                    max_results: { type: "integer", default: 20, description: "Maximum results" }
                },
                required: ["doi"]
            },
            price: 0.02
        },
        {
            name: "find_grants",
            description: "Search funding opportunities from NIH and NSF",
            input_schema: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Search query" },
                    funder_type: { type: "string", enum: ["nih", "nsf", "foundation", "all"], default: "all" }
                },
                required: ["query"]
            },
            price: 0.03
        },
        {
            name: "institution_research_profile",
            description: "Get research profile for an institution",
            input_schema: {
                type: "object",
                properties: {
                    institution_name: { type: "string", description: "Name of institution" }
                },
                required: ["institution_name"]
            },
            price: 0.05
        },
        {
            name: "author_research_profile",
            description: "Get research profile for an author",
            input_schema: {
                type: "object",
                properties: {
                    author_name: { type: "string", description: "Name of author" },
                    institution: { type: "string", description: "Institution (optional)" }
                },
                required: ["author_name"]
            },
            price: 0.03
        },
        {
            name: "research_trends",
            description: "Analyze research trends for a topic over time",
            input_schema: {
                type: "object",
                properties: {
                    topic: { type: "string", description: "Research topic" },
                    year_from: { type: "integer", description: "Start year" },
                    year_to: { type: "integer", description: "End year" }
                },
                required: ["topic"]
            },
            price: 0.05
        },
        {
            name: "systematic_review",
            description: "Comprehensive literature review across all databases",
            input_schema: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Review query" },
                    min_year: { type: "integer", description: "Minimum year" },
                    domains: { type: "array", items: { type: "string" }, description: "Filter by domains" }
                },
                required: ["query"]
            },
            price: 0.10
        }
    ]
};

// Tool implementations
async function searchPapers(query, maxResults = 10) {
    const results = [];

    // CrossRef search
    try {
        const crossrefUrl = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${maxResults}`;
        const crossrefResp = await fetch(crossrefUrl);
        const crossrefData = await crossrefResp.json();
        for (const item of crossrefData.message?.items || []) {
            results.push({
                title: item.title?.[0] || "",
                authors: item.author?.map(a => `${a.given || ''} ${a.family || ''}`).join(", ") || "",
                year: item.published?.["date-parts"]?.[0]?.[0] || null,
                doi: item.DOI,
                journal: item["container-title"]?.[0] || "",
                citations: item["is-referenced-by-count"] || 0,
                url: `https://doi.org/${item.DOI}`,
                source: "CrossRef"
            });
        }
    } catch (e) {
        console.error("CrossRef error:", e.message);
    }

    // OpenAlex search
    try {
        const openalexUrl = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=${maxResults}`;
        const resp = await fetch(openalexUrl);
        const data = await resp.json();
        for (const item of data.results || []) {
            results.push({
                title: item.display_name || "",
                authors: item.authorships?.map(a => a.author?.display_name || "").join(", ") || "",
                year: item.publication_year,
                doi: item.doi,
                journal: item.primary_location?.source?.display_name || "",
                citations: item.cited_by_count || 0,
                url: item.doi,
                source: "OpenAlex"
            });
        }
    } catch (e) {
        console.error("OpenAlex error:", e.message);
    }

    // Deduplicate by DOI
    const seen = new Set();
    return results.filter(r => {
        if (!r.doi || seen.has(r.doi)) return false;
        seen.add(r.doi);
        return true;
    }).slice(0, maxResults);
}

async function getPaperDetails(doi) {
    // CrossRef
    try {
        const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
        const resp = await fetch(url);
        const item = (await resp.json()).message;
        return {
            title: item.title?.[0] || "",
            authors: item.author?.map(a => `${a.given || ''} ${a.family || ''}`).join(", ") || "",
            year: item.published?.["date-parts"]?.[0]?.[0] || null,
            doi: doi,
            abstract: item.abstract || "",
            journal: item["container-title"]?.[0] || "",
            citations: item["is-referenced-by-count"] || 0,
            funders: item.funder?.map(f => f.name || "") || [],
            source: "CrossRef"
        };
    } catch (e) {
        console.error("CrossRef error:", e.message);
    }

    // OpenAlex fallback
    try {
        const url = `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(doi)}`;
        const resp = await fetch(url);
        const item = await resp.json();
        return {
            title: item.display_name || "",
            authors: item.authorships?.map(a => a.author?.display_name || "").join(", ") || "",
            year: item.publication_year,
            doi: doi,
            abstract: item.abstract_inverted_index ? JSON.stringify(item.abstract_inverted_index) : "",
            journal: item.primary_location?.source?.display_name || "",
            citations: item.cited_by_count || 0,
            topics: item.topics?.map(t => t.display_name || "").slice(0, 5) || [],
            source: "OpenAlex"
        };
    } catch (e) {
        console.error("OpenAlex error:", e.message);
    }

    return { error: `Paper not found for DOI: ${doi}` };
}

async function findCitations(doi, maxResults = 20) {
    const doiId = doi.replace('https://doi.org/', '');
    try {
        const url = `https://api.openalex.org/works?filter=cites:${doiId}&per-page=${maxResults}`;
        const resp = await fetch(url);
        const data = await resp.json();
        return (data.results || []).map(w => ({
            title: w.display_name || "",
            authors: w.authorships?.map(a => a.author?.display_name || "").join(", ") || "",
            year: w.publication_year,
            doi: w.doi,
            journal: w.primary_location?.source?.display_name || "",
            citations: w.cited_by_count || 0,
            source: "OpenAlex"
        }));
    } catch (e) {
        console.error("Citations error:", e.message);
        return [];
    }
}

async function findGrants(query, funderType = "all") {
    const results = [];

    // NIH RePORTER
    if (funderType === "all" || funderType === "nih") {
        try {
            const url = "https://api.reporter.nih.gov/v2/projects/search";
            const resp = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query, limit: 10 })
            });
            const data = await resp.json();
            for (const p of data.results || []) {
                results.push({
                    title: p.project_title || "",
                    agency: "NIH",
                    award_id: p.project_nums?.[0]?.project_num || "",
                    amount: p.total_cost || 0,
                    pi: p.pi_name || "",
                    institution: p.agency_name || "",
                    start_year: p.project_start_date?.slice(0, 4) || null,
                    deadline: p.application_receive_date?.slice(0, 10) || null,
                    url: `https://reporter.nih.gov/project/${p.project_id}`
                });
            }
        } catch (e) {
            console.error("NIH error:", e.message);
        }
    }

    // NSF Award API
    if (funderType === "all" || funderType === "nsf") {
        try {
            const url = `https://api.nsf.gov/services/v1/awards?q=${encodeURIComponent(query)}&rows=10`;
            const resp = await fetch(url);
            const xml = await resp.text();
            // NSF returns XML, simplified parsing
            const awardMatches = xml.match(/<award>(.*?)<\/award>/gs) || [];
            for (const match of awardMatches.slice(0, 10)) {
                const idMatch = match.match(/<awardID>(.*?)<\/awardID>/);
                const titleMatch = match.match(/<title>(.*?)<\/title>/);
                const amountMatch = match.match(/<awardAmount>(.*?)<\/awardAmount>/);
                const piMatch = match.match(/<piFirstName>(.*?)<\/piFirstName>.*?<piLastName>(.*?)<\/piLastName>/s);
                if (idMatch && titleMatch) {
                    results.push({
                        title: titleMatch[1],
                        agency: "NSF",
                        award_id: idMatch[1],
                        amount: parseInt(amountMatch?.[1] || 0),
                        pi: piMatch ? `${piMatch[1]} ${piMatch[2]}` : "",
                        url: `https://www.nsf.gov/award/${idMatch[1]}`
                    });
                }
            }
        } catch (e) {
            console.error("NSF error:", e.message);
        }
    }

    return results.slice(0, 20);
}

async function institutionResearchProfile(institutionName) {
    try {
        const url = `https://api.openalex.org/institutions?search=${encodeURIComponent(institutionName)}`;
        const resp = await fetch(url);
        const data = await resp.json();
        if (data.results?.length > 0) {
            const inst = data.results[0];
            return {
                name: inst.display_name || "",
                country: inst.country_code || "",
                paper_count: inst.works_count || 0,
                citation_count: inst.cited_by_count || 0,
                h_index: inst.summary_stats?.h_index || 0,
                topics: inst.topics?.map(t => t.display_name || "").slice(0, 10) || [],
                source: "OpenAlex"
            };
        }
    } catch (e) {
        console.error("Institution error:", e.message);
    }
    return { error: `Institution not found: ${institutionName}` };
}

async function authorResearchProfile(authorName, institution = null) {
    try {
        let url = `https://api.openalex.org/authors?search=${encodeURIComponent(authorName)}`;
        if (institution) url += `&institution=${encodeURIComponent(institution)}`;
        const resp = await fetch(url);
        const data = await resp.json();
        if (data.results?.length > 0) {
            const author = data.results[0];
            return {
                name: author.display_name || "",
                orcid: author.orcid || "",
                paper_count: author.works_count || 0,
                citation_count: author.cited_by_count || 0,
                h_index: author.summary_stats?.h_index || 0,
                institutions: author.affiliations?.map(a => a.institution?.display_name || "").filter(Boolean).slice(0, 3) || [],
                top_papers: author.works?.map(w => w.display_name || "").slice(0, 5) || [],
                source: "OpenAlex"
            };
        }
    } catch (e) {
        console.error("Author error:", e.message);
    }
    return { error: `Author not found: ${authorName}` };
}

async function researchTrends(topic, yearFrom = 2010, yearTo = 2024) {
    try {
        const url = `https://api.openalex.org/works?search=${encodeURIComponent(topic)}&filter=publication_year:${yearFrom}-${yearTo}&per-page=0`;
        const resp = await fetch(url);
        const data = await resp.json();
        return {
            topic,
            year_range: `${yearFrom}-${yearTo}`,
            total_papers: data.meta?.count || 0,
            citation_count: data.meta?.cited_by_count || 0,
            source: "OpenAlex"
        };
    } catch (e) {
        console.error("Trends error:", e.message);
        return { error: `Could not analyze trends for: ${topic}` };
    }
}

async function systematicReview(query, minYear = null, domains = null) {
    const papers = await searchPapers(query, 50);

    // Filter by year if specified
    let filtered = papers;
    if (minYear) {
        filtered = filtered.filter(p => p.year >= minYear);
    }

    // Sort by citations
    filtered.sort((a, b) => (b.citations || 0) - (a.citations || 0));

    return {
        query,
        min_year: minYear,
        total_results: filtered.length,
        papers: filtered.slice(0, 30),
        databases_searched: ["CrossRef", "OpenAlex"],
        source: "Academic Research MCP"
    };
}

async function handleTool(toolName, params = {}) {
    const handlers = {
        "search_papers": async () => searchPapers(params.query, params.max_results),
        "get_paper_details": async () => getPaperDetails(params.doi),
        "find_citations": async () => findCitations(params.doi, params.max_results),
        "find_grants": async () => findGrants(params.query, params.funder_type),
        "institution_research_profile": async () => institutionResearchProfile(params.institution_name),
        "author_research_profile": async () => authorResearchProfile(params.author_name, params.institution),
        "research_trends": async () => researchTrends(params.topic, params.year_from, params.year_to),
        "systematic_review": async () => systematicReview(params.query, params.min_year, params.domains)
    };

    const handler = handlers[toolName];
    if (handler) {
        return await handler();
    }
    return { error: `Unknown tool: ${toolName}` };
}

// Main entry point
const { handleRequest } = Apify;

export default {
    handleRequest: async ({ request, response, log }) => {
        log.info("Academic Research MCP received request");

        try {
            const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
            const { tool, params = {} } = body;

            log.info(`Calling tool: ${tool}`);

            const result = await handleTool(tool, params);

            await response.send({
                status: "success",
                result
            });
        } catch (error) {
            log.error(`Error: ${error.message}`);
            await response.send({
                status: "error",
                error: error.message
            });
        }
    }
};
