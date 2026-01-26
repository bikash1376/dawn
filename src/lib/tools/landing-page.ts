import { tool } from 'ai';
import { z } from 'zod';
import JSZip from 'jszip';

// Helper function to try and resolve a messy siteId (like a URL or name) to a real UUID
async function resolveSiteId(token: string, identifier: string): Promise<string | null> {
    // If it looks like a version 4 UUID, return it as is
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(identifier)) {
        return identifier;
    }

    console.log(`Attempting to resolve site ID from identifier: ${identifier}`);

    try {
        const response = await fetch("https://api.netlify.com/api/v1/sites?filter=all", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) return null;

        const sites: any[] = await response.json();

        // Clean identifier (remove https://, .netlify.app, trailing slashes)
        // e.g. "https://my-site.netlify.app/" -> "my-site"
        const cleanId = identifier
            .replace(/^https?:\/\//, '')
            .replace(/\/$/, '')
            .replace(/\.netlify\.app$/, '');

        // Find match
        const match = sites.find(site =>
            site.id === identifier ||
            site.name === identifier ||
            site.name === cleanId ||
            site.url === identifier ||
            site.ssl_url === identifier ||
            site.custom_domain === identifier ||
            // Partial match for URL if user pasted "https://foo..."
            (site.ssl_url && identifier.includes(site.ssl_url))
        );

        if (match) {
            console.log(`Resolved identifier "${identifier}" to Site ID: ${match.id}`);
            return match.id;
        }
    } catch (e) {
        console.error("Error resolving site ID:", e);
    }

    return null;
}

export const staticSiteGenerator = tool({
    description: 'Generate and deploy a STATIC landing page or site to Netlify (HTML/CSS/JS). Use "fullStackAppGenerator" for apps with backend logic.',
    parameters: z.object({
        html: z.string().describe('The full HTML content of the landing page, including <head> and <body>.'),
        css: z.string().optional().describe('The CSS styles for the landing page.'),
        js: z.string().optional().describe('The JavaScript logic for the landing page.'),
        projectName: z.string().optional().describe('A suggested name for the project (optional).'),
        siteId: z.string().optional().describe('The Netlify Site ID (UUID) OR the site name/URL. Required if updating an existing site.'),
    }),
    execute: async ({ html, css, js, projectName, siteId }) => {
        try {
            const token = process.env.NETLIFY_ACCESS_TOKEN;
            if (!token) {
                return {
                    error: 'Deploy failed: NETLIFY_ACCESS_TOKEN is missing from environment variables.',
                };
            }

            // Attempt to resolve siteId if provided
            let targetSiteId = siteId;
            if (targetSiteId) {
                const resolved = await resolveSiteId(token, targetSiteId);
                // If we resolved it to something different (or it was already valid), usage that.
                // If resolved is null, we stick with the original and let Netlify return 404 (or handle it below).
                if (resolved) {
                    targetSiteId = resolved;
                }
            }

            const zip = new JSZip();

            // Add HTML. Ensure it links to style.css and script.js if they are provided but not linked.
            // Add HTML. Ensure it links to style.css and script.js if they are provided but not linked.
            let finalHtml = html;

            if (css) {
                zip.file("style.css", css);
                if (!finalHtml.includes('style.css')) {
                    if (finalHtml.includes('</head>')) {
                        finalHtml = finalHtml.replace('</head>', '    <link rel="stylesheet" href="style.css">\n</head>');
                    } else {
                        // Fallback: prepend
                        finalHtml = `<link rel="stylesheet" href="style.css">\n` + finalHtml;
                    }
                }
            }

            if (js) {
                zip.file("script.js", js);
                if (!finalHtml.includes('script.js')) {
                    if (finalHtml.includes('</body>')) {
                        finalHtml = finalHtml.replace('</body>', '    <script src="script.js"></script>\n</body>');
                    } else {
                        // Fallback: append
                        finalHtml = finalHtml + `\n<script src="script.js"></script>`;
                    }
                }
            }

            zip.file("index.html", finalHtml);

            const zipContent = await zip.generateAsync({ type: "nodebuffer" });

            let endpoint = "https://api.netlify.com/api/v1/sites";
            let method = "POST";

            if (targetSiteId) {
                // Update existing site
                endpoint = `https://api.netlify.com/api/v1/sites/${targetSiteId}/deploys`;
            }

            let response = await fetch(endpoint, {
                method: method,
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/zip",
                },
                body: zipContent as any,
            });

            // Handle 404 specifically for updates - likely bad ID
            if (!response.ok && response.status === 404 && targetSiteId) {
                console.log("404 on update. Retrying as new site or reporting error.");
                // Option: Fallback to creating a new site?
                // For now, let's return a detailed error suggesting the ID was wrong.
                // Or: If specifically asked to update, maybe we SHOULD fail.
                // But let's clarify the error.
                return {
                    error: `Could not find a Netlify site with the ID or URL provided ("${siteId}"). Please verify the site ID or create a new site.`
                };
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Netlify API request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data: any = await response.json();

            let finalSiteId = targetSiteId || data.site_id || data.id;
            let siteUrl = data.ssl_url || data.url;
            let adminUrl = data.admin_url;
            let siteName = data.name;

            if (targetSiteId) {
                // For updates, we might need to fetch the main site object to get the primary URL
                // because the deploy object returns the deploy preview URL.
                // Let's try to get the persistent URL.
                try {
                    const siteResp = await fetch(`https://api.netlify.com/api/v1/sites/${finalSiteId}`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    if (siteResp.ok) {
                        const siteData = await siteResp.json();
                        siteUrl = siteData.ssl_url || siteData.url;
                        siteName = siteData.name;
                        adminUrl = siteData.admin_url;
                    }
                } catch (e) {
                    // Ignore, stick with deploy URL
                }
            }

            return {
                message: targetSiteId ? 'Static site updated successfully!' : 'Static site deployed successfully!',
                siteUrl: siteUrl,
                siteName: siteName,
                adminUrl: adminUrl,
                siteId: finalSiteId
            };

        } catch (error: any) {
            console.error("Error deploying landing page:", error);
            return { error: `Failed to deploy landing page: ${error.message || error}` };
        }
    },
});
