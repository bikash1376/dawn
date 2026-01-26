import { tool } from 'ai';
import { z } from 'zod';
import JSZip from 'jszip';

// Reusing helper from landing-page.ts (or duplicating it to avoid circular deps if I don't extract it)
// For simplicity, I'll duplicate the resolution logic or import it if I refactored. 
// I'll duplicate it for now to keep files self-contained, or I can trust siteId is correct.
// Let's copy it for robustness.
async function resolveSiteId(token: string, identifier: string): Promise<string | null> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(identifier)) return identifier;
    try {
        const response = await fetch("https://api.netlify.com/api/v1/sites?filter=all", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) return null;
        const sites: any[] = await response.json();
        const cleanId = identifier.replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/\.netlify\.app$/, '');
        const match = sites.find(site =>
            site.id === identifier || site.name === identifier || site.name === cleanId ||
            site.url === identifier || site.ssl_url === identifier ||
            (site.ssl_url && identifier.includes(site.ssl_url))
        );
        return match ? match.id : null;
    } catch { return null; }
}

export const fullStackAppGenerator = tool({
    description: 'Generate and deploy a Full Stack App (Frontend HTML/JS + Backend Serverless Functions) to Netlify. Use this for apps requiring server-side logic (APIs, secrets, databases).',
    parameters: z.object({
        html: z.string().describe('Frontend HTML content.'),
        css: z.string().optional().describe('Frontend CSS styles.'),
        js: z.string().optional().describe('Frontend JavaScript logic.'),
        functions: z.record(z.string()).optional().describe('Backend Netlify Functions. Key = function name (e.g. "api"), Value = JS code (exports.handler = ...).'),
        projectName: z.string().optional().describe('Suggested project name.'),
        siteId: z.string().optional().describe('Netlify Site ID to update existing site.'),
    }),
    execute: async ({ html, css, js, functions, projectName, siteId }) => {
        try {
            const token = process.env.NETLIFY_ACCESS_TOKEN;
            if (!token) return { error: 'NETLIFY_ACCESS_TOKEN missing.' };

            let targetSiteId = siteId;
            if (targetSiteId) {
                const resolved = await resolveSiteId(token, targetSiteId);
                if (resolved) targetSiteId = resolved;
            }

            const zip = new JSZip();

            // 1. Frontend
            let finalHtml = html;
            if (css) {
                zip.file("style.css", css);
                if (!finalHtml.includes('style.css')) {
                    finalHtml = finalHtml.includes('</head>')
                        ? finalHtml.replace('</head>', '    <link rel="stylesheet" href="/style.css">\n</head>')
                        : `<link rel="stylesheet" href="/style.css">\n` + finalHtml;
                }
            }
            if (js) {
                zip.file("script.js", js);
                if (!finalHtml.includes('script.js')) {
                    finalHtml = finalHtml.includes('</body>')
                        ? finalHtml.replace('</body>', '    <script src="/script.js"></script>\n</body>')
                        : finalHtml + `\n<script src="/script.js"></script>`;
                }
            }
            zip.file("index.html", finalHtml);

            // 2. Netlify Configuration & Functions
            // Standardize on netlify/functions which is the most robust default
            zip.file("netlify.toml", `[build]\n  functions = "netlify/functions"\n`);

            if (functions && Object.keys(functions).length > 0) {
                const functionsFolder = zip.folder("netlify")?.folder("functions");
                if (functionsFolder) {
                    for (const [name, code] of Object.entries(functions)) {
                        // Ensure it has .js extension
                        const fileName = name.endsWith('.js') ? name : `${name}.js`;
                        functionsFolder.file(fileName, code);
                    }
                }
            }

            const zipContent = await zip.generateAsync({ type: "nodebuffer" });

            // 3. Deploy
            let endpoint = "https://api.netlify.com/api/v1/sites";
            if (targetSiteId) endpoint = `https://api.netlify.com/api/v1/sites/${targetSiteId}/deploys`;

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/zip",
                },
                body: zipContent as any,
            });

            if (!response.ok) {
                const text = await response.text();
                return { error: `Deploy failed: ${response.status} - ${text}` };
            }

            const data: any = await response.json();
            const finalSiteId = targetSiteId || data.site_id || data.id;
            const sslUrl = data.ssl_url || data.url;

            // Extract Deploy ID to poll for status
            // If updating: data is Deploy object -> data.id
            // If creating: data is Site object -> data.deploy_id represents the initial deploy
            const deployId = targetSiteId ? data.id : data.deploy_id;

            if (deployId) {
                await waitForDeploy(token, deployId);
            }

            return {
                message: 'Full Stack App deployed successfully!',
                siteUrl: sslUrl,
                siteId: finalSiteId,
                functionUrls: functions ? Object.keys(functions).map(k => `${sslUrl}/.netlify/functions/${k.replace('.js', '')}`) : []
            };

        } catch (error: any) {
            return { error: `Full Stack Generator Error: ${error.message}` };
        }
    }
});

async function waitForDeploy(token: string, deployId: string): Promise<void> {
    const maxRetries = 30; // 60 seconds max
    const interval = 2000;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const res = await fetch(`https://api.netlify.com/api/v1/deploys/${deployId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) break;

            const deploy = await res.json();
            if (deploy.state === 'ready') return;
            if (deploy.state === 'error') throw new Error(`Deploy failed likely due to build error: ${deploy.error_message || 'Unknown error'}`);

            // If 'uploading', 'processing', 'enqueued' -> wait
            await new Promise(r => setTimeout(r, interval));
        } catch (e) {
            // Ignore fetch errors and retry
            console.error("Polling deploy status failed", e);
            await new Promise(r => setTimeout(r, interval));
        }
    }
    // If we timeout, we just return. The site might still go live eventually.
    console.warn("Deploy polling timed out, but continuing.");
}
