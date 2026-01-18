import { tool } from 'ai';
import { z } from 'zod';
import JSZip from 'jszip';

export const landingPageGenerator = tool({
    description: 'Generate and deploy a landing page to Netlify based on HTML, CSS, and JS. Use siteId to update an existing site.',
    parameters: z.object({
        html: z.string().describe('The full HTML content of the landing page, including <head> and <body>.'),
        css: z.string().optional().describe('The CSS styles for the landing page.'),
        js: z.string().optional().describe('The JavaScript logic for the landing page.'),
        projectName: z.string().optional().describe('A suggested name for the project (optional).'),
        siteId: z.string().optional().describe('The Netlify Site ID. Required if updating an existing site.'),
    }),
    execute: async ({ html, css, js, projectName, siteId }) => {
        try {
            const token = process.env.NETLIFY_ACCESS_TOKEN;
            if (!token) {
                return {
                    error: 'Deploy failed: NETLIFY_ACCESS_TOKEN is missing from environment variables.',
                };
            }

            const zip = new JSZip();

            // Add HTML. Ensure it links to style.css and script.js if they are provided but not linked.
            zip.file("index.html", html);

            if (css) {
                zip.file("style.css", css);
            }

            if (js) {
                zip.file("script.js", js);
            }

            const zipContent = await zip.generateAsync({ type: "nodebuffer" });

            let endpoint = "https://api.netlify.com/api/v1/sites";
            let method = "POST";

            if (siteId) {
                // Update existing site
                endpoint = `https://api.netlify.com/api/v1/sites/${siteId}/deploys`;
            }

            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/zip",
                },
                body: zipContent as any,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Netlify API request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data: any = await response.json();

            let finalSiteId = siteId || data.site_id || data.id; // data.id is for site creation, data.site_id is often in deploy response
            let siteUrl = data.ssl_url || data.url;
            let adminUrl = data.admin_url;
            let siteName = data.name;

            // If it was an update, 'data' is the deploy object.
            if (siteId) {
                siteUrl = data.ssl_url || data.url;
            }

            return {
                message: siteId ? 'Landing page updated successfully!' : 'Landing page deployed successfully!',
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
