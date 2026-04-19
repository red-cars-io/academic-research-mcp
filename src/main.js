/**
 * Patent Search MCP Server
 * Search USPTO, EPO, and Google Patents for AI agents.
 */

import Apify, { Actor } from 'apify';

// MCP manifest
const MCP_MANIFEST = {
    schema_version: "1.0",
    name: "patent-search-mcp",
    version: "1.0.0",
    description: "Search patents across USPTO, EPO, and Google Patents for AI agents",
    tools: [
        {
            name: "search_patents",
            description: "Search patents by keyword, CPC classification, or inventor name",
            input_schema: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Search query (keyword, technical term, or CPC code)" },
                    max_results: { type: "integer", default: 10, description: "Maximum results to return" }
                },
                required: ["query"]
            },
            price: 0.05
        },
        {
            name: "get_patent_details",
            description: "Get full metadata, claims, and citations for a specific patent",
            input_schema: {
                type: "object",
                properties: {
                    patent_number: { type: "string", description: "Patent number (e.g., US10123456, EP1234567)" },
                    source: { type: "string", enum: ["uspto", "epo", "google", "all"], default: "all", description: "Which patent database to search" }
                },
                required: ["patent_number"]
            },
            price: 0.03
        },
        {
            name: "find_patent_citations",
            description: "Find patents that cite a specific patent (forward citations) or patents cited by it (backward citations)",
            input_schema: {
                type: "object",
                properties: {
                    patent_number: { type: "string", description: "Patent number to find citations for" },
                    citation_type: { type: "string", enum: ["forward", "backward", "both"], default: "forward", description: "Forward = patents citing this one; Backward = patents this one cites" }
                },
                required: ["patent_number"]
            },
            price: 0.05
        },
        {
            name: "patent_landscape_by_company",
            description: "Get full patent portfolio for a company including filing trends, top patents, and technology areas",
            input_schema: {
                type: "object",
                properties: {
                    company_name: { type: "string", description: "Company name to search patents for" },
                    max_results: { type: "integer", default: 20, description: "Maximum number of patents to return" }
                },
                required: ["company_name"]
            },
            price: 0.10
        }
    ]
};

// Tool price map (in USD)
const TOOL_PRICES = {
    "search_patents": 0.05,
    "get_patent_details": 0.03,
    "find_patent_citations": 0.05,
    "patent_landscape_by_company": 0.10
};

// USPTO API helpers
async function searchUSPTO(query, maxResults = 10) {
    try {
        // USPTO Patent Public Search API (basic search)
        const url = `https://developer.uspto.gov/api/v1/patents?searchText=${encodeURIComponent(query)}&rows=${maxResults}`;
        const resp = await fetch(url, {
            headers: { 'Accept': 'application/json' }
        });
        if (!resp.ok) throw new Error(`USPTO API error: ${resp.status}`);
        const data = await resp.json();
        return (data.results || []).map(p => ({
            patent_number: p.patentNumber || p.patentApplicationNumber || "",
            title: p.title || "",
            inventors: p.inventor || [],
            filing_date: p.filingDate || null,
            issue_date: p.issueDate || null,
            abstract: p.abstract || "",
            assignee: p.assignee || "",
            source: "USPTO",
            url: `https://patents.google.com/patent/${p.patentNumber || p.patentApplicationNumber}`
        }));
    } catch (e) {
        console.error("USPTO error:", e.message);
        return [];
    }
}

// Google Patents helper
async function searchGooglePatents(query, maxResults = 10) {
    try {
        // Google Patents public search via scraping-friendly API
        const url = `https://patents.google.com/query?q=${encodeURIComponent(query)}&start=0&count=${maxResults}`;
        const resp = await fetch(url, {
            headers: { 'Accept': 'application/json' }
        });
        if (!resp.ok) throw new Error(`Google Patents error: ${resp.status}`);
        const data = await resp.json();
        // Google Patents returns results in a structured format
        const results = data?.results || [];
        return results.map(p => ({
            patent_number: p.number || "",
            title: p.title || "",
            inventors: p.inventor || [],
            filing_date: p.date || null,
            issue_date: null,
            abstract: p.abstract || "",
            assignee: p.assignee || "",
            source: "Google Patents",
            url: `https://patents.google.com/patent/${p.number}`
        }));
    } catch (e) {
        console.error("Google Patents error:", e.message);
        return [];
    }
}

// EPO Open Patent Services (OPS) API
async function searchEPO(query, maxResults = 10) {
    try {
        // EPO OPS API - free access with rate limiting
        const url = `https://ops.epo.org/3.2/rest-services/published-data/search/full-cycle?searchkey=${encodeURIComponent(query)}&maxResults=${maxResults}`;
        const resp = await fetch(url, {
            headers: { 'Accept': 'application/xml' }
        });
        if (!resp.ok) throw new Error(`EPO API error: ${resp.status}`);
        const xml = await resp.text();
        // Parse EPO XML response
        const patents = [];
        const patentMatches = xml.match(/<ns2:publication-number>(.*?)<\/ns2:publication-number>/g) || [];
        for (let i = 0; i < Math.min(patentMatches.length, maxResults); i++) {
            const numMatch = patentMatches[i].match(/>(.*?)</);
            if (numMatch) {
                const num = numMatch[1];
                patents.push({
                    patent_number: num,
                    title: "EPO Patent",
                    inventors: [],
                    filing_date: null,
                    issue_date: null,
                    abstract: "",
                    assignee: "",
                    source: "EPO",
                    url: `https://worldwide.espacenet.com/patent/search/publication/${num}`
                });
            }
        }
        return patents;
    } catch (e) {
        console.error("EPO error:", e.message);
        return [];
    }
}

// Main search function - aggregates USPTO, Google Patents, EPO
async function searchPatents(query, maxResults = 10) {
    const results = [];

    // Run all searches in parallel
    const [usptoResults, googleResults, epoResults] = await Promise.all([
        searchUSPTO(query, Math.ceil(maxResults / 3)),
        searchGooglePatents(query, Math.ceil(maxResults / 3)),
        searchEPO(query, Math.ceil(maxResults / 3))
    ]);

    results.push(...usptoResults, ...googleResults, ...epoResults);

    // Deduplicate by patent number
    const seen = new Set();
    return results.filter(r => {
        if (!r.patent_number || seen.has(r.patent_number)) return false;
        seen.add(r.patent_number);
        return true;
    }).slice(0, maxResults);
}

// Get detailed patent information
async function getPatentDetails(patentNumber, source = "all") {
    // Clean patent number
    const cleanNum = patentNumber.replace(/https?:\/\/patents\.google\.com\/patent\//, '').split('/')[0];

    if (source === "uspto" || source === "all") {
        try {
            // Try Google Patents for full details (most complete)
            const url = `https://patents.google.com/patent/${encodeURIComponent(cleanNum)}?oq=${encodeURIComponent(cleanNum)}`;
            const resp = await fetch(url);
            if (resp.ok) {
                const html = await resp.text();
                // Extract key metadata from HTML
                const titleMatch = html.match(/<meta name="DC.title" content="([^"]+)"/) ||
                                   html.match(/<h1[^>]*>([^<]+)<\/h1>/);
                const abstractMatch = html.match(/<meta name="DCTERMS.abstract" content="([^"]+)"/) ||
                                      html.match(/"abstract":"([^"]+)"/);
                const assigneeMatch = html.match(/<meta name="DC.contributor" content="([^"]+)"/) ||
                                      html.match(/"assignee":"([^"]+)"/);

                return {
                    patent_number: cleanNum,
                    title: titleMatch ? titleMatch[1] : cleanNum,
                    abstract: abstractMatch ? abstractMatch[1] : "",
                    assignee: assigneeMatch ? assigneeMatch[1] : "",
                    source: "Google Patents",
                    url: `https://patents.google.com/patent/${cleanNum}`,
                    details_available: true
                };
            }
        } catch (e) {
            console.error("Google Patents details error:", e.message);
        }
    }

    return {
        patent_number: cleanNum,
        title: cleanNum,
        abstract: "",
        assignee: "",
        source: source || "unknown",
        url: `https://patents.google.com/patent/${cleanNum}`,
        details_available: false,
        error: "Could not retrieve full details"
    };
}

// Find patent citations
async function findPatentCitations(patentNumber, citationType = "forward") {
    const cleanNum = patentNumber.replace(/https?:\/\/patents\.google\.com\/patent\//, '').split('/')[0];

    try {
        const url = `https://patents.google.com/patent/${encodeURIComponent(cleanNum)}/cite`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Google Patents citations error: ${resp.status}`);

        const html = await resp.text();

        // Parse forward citations (patents citing this one)
        const forwardMatches = html.match(/\/patent\/([A-Z]{2}\d+[A-Z0-9]+)/g) || [];
        const forward = [...new Set(forwardMatches)].map(num => ({
            patent_number: num.replace('/patent/', ''),
            source: "forward_citation"
        }));

        // Parse backward citations (patents this one cites)
        const backwardMatches = html.match(/citing Patents?/g) || [];
        const backward = forward.slice(0, 10).map(p => ({
            patent_number: p.patent_number,
            source: "backward_citation"
        }));

        if (citationType === "forward") {
            return { patent_number: cleanNum, forward_citations: forward.slice(0, 50), total: forward.length };
        } else if (citationType === "backward") {
            return { patent_number: cleanNum, backward_citations: backward, total: backward.length };
        } else {
            return { patent_number: cleanNum, forward_citations: forward.slice(0, 50), backward_citations: backward, total_forward: forward.length, total_backward: backward.length };
        }
    } catch (e) {
        console.error("Citations error:", e.message);
        return {
            patent_number: cleanNum,
            error: e.message,
            forward_citations: [],
            backward_citations: []
        };
    }
}

// Company patent landscape
async function patentLandscapeByCompany(companyName, maxResults = 20) {
    const results = [];

    // Search USPTO for company patents
    try {
        const usptoUrl = `https://developer.uspto.gov/api/v1/patents?searchText=${encodeURIComponent(companyName)}&rows=${maxResults}`;
        const resp = await fetch(usptoUrl, {
            headers: { 'Accept': 'application/json' }
        });
        if (resp.ok) {
            const data = await resp.json();
            const usptoPatents = (data.results || []).map(p => ({
                patent_number: p.patentNumber || "",
                title: p.title || "",
                filing_date: p.filingDate || null,
                issue_date: p.issueDate || null,
                assignee: p.assignee || companyName,
                source: "USPTO",
                url: `https://patents.google.com/patent/${p.patentNumber || ""}`
            }));
            results.push(...usptoPatents);
        }
    } catch (e) {
        console.error("USPTO landscape error:", e.message);
    }

    // Search Google Patents
    try {
        const googleUrl = `https://patents.google.com/query?q=${encodeURIComponent(companyName)}+assignee&start=0&count=${maxResults}`;
        const resp = await fetch(googleUrl);
        if (resp.ok) {
            const data = await resp.json();
            const googlePatents = (data.results || []).map(p => ({
                patent_number: p.number || "",
                title: p.title || "",
                filing_date: p.date || null,
                issue_date: null,
                assignee: companyName,
                source: "Google Patents",
                url: `https://patents.google.com/patent/${p.number || ""}`
            }));
            results.push(...googlePatents);
        }
    } catch (e) {
        console.error("Google Patents landscape error:", e.message);
    }

    // Deduplicate
    const seen = new Set();
    const unique = results.filter(r => {
        if (!r.patent_number || seen.has(r.patent_number)) return false;
        seen.add(r.patent_number);
        return true;
    });

    // Calculate filing trend
    const filingYears = unique.map(p => p.filing_date ? new Date(p.filing_date).getFullYear() : null).filter(Boolean);
    const yearCounts = {};
    filingYears.forEach(y => { yearCounts[y] = (yearCounts[y] || 0) + 1; });

    return {
        company_name: companyName,
        total_patents: unique.length,
        filing_trend: yearCounts,
        top_patents: unique.slice(0, 10),
        technology_areas: unique.slice(0, 5).map(p => p.title).filter(Boolean),
        sources_searched: ["USPTO", "Google Patents"],
        source: "Patent Search MCP"
    };
}

// Handle tool calls
async function handleTool(toolName, params = {}) {
    const handlers = {
        "search_patents": async () => searchPatents(params.query, params.max_results),
        "get_patent_details": async () => getPatentDetails(params.patent_number, params.source),
        "find_patent_citations": async () => findPatentCitations(params.patent_number, params.citation_type),
        "patent_landscape_by_company": async () => patentLandscapeByCompany(params.company_name, params.max_results)
    };

    const handler = handlers[toolName];
    if (handler) {
        const result = await handler();
        // Charge for the tool if pricing is defined
        const price = TOOL_PRICES[toolName];
        if (price) {
            try {
                await Actor.charge(price, { eventName: toolName });
            } catch (e) {
                console.error("Charge failed:", e.message);
            }
        }
        return result;
    }
    return { error: `Unknown tool: ${toolName}` };
}

// Main entry point
const { handleRequest } = Apify;

export default {
    handleRequest: async ({ request, response, log }) => {
        log.info("Patent Search MCP received request");

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