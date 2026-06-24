import { tool } from 'ai';
import { z } from 'zod';

// Resolve a messy identifier (URL or site name) to a real Netlify site UUID.
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

export const deleteLandingPage = tool({
    description: 'Delete a deployed landing page from Netlify using its Site ID.',
    parameters: z.object({
        siteId: z.string().describe('The Netlify Site ID to delete.'),
    }),
    execute: async ({ siteId }) => {
        try {
            const token = process.env.NETLIFY_ACCESS_TOKEN;
            if (!token) {
                return {
                    error: 'Deletion failed: NETLIFY_ACCESS_TOKEN is missing from environment variables.',
                };
            }

            const resolvedId = await resolveSiteId(token, siteId);
            if (!resolvedId) {
                return { error: `Could not find a Netlify site matching "${siteId}".` };
            }

            const response = await fetch(`https://api.netlify.com/api/v1/sites/${resolvedId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Netlify API request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            return {
                message: 'Landing page deleted successfully!',
                siteId: resolvedId
            };

        } catch (error: any) {
            console.error("Error deleting landing page:", error);
            return { error: `Failed to delete landing page: ${error.message || error}` };
        }
    },
});
