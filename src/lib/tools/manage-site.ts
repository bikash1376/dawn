import { tool } from 'ai';
import { z } from 'zod';

export const updateSiteDomain = tool({
    description: 'Update the subdomain (name) of a Netlify site. Use this to change the URL prefix (e.g., from "fluffy-unicorn" to "my-brand").',
    parameters: z.object({
        siteId: z.string().describe('The Netlify Site ID to update.'),
        newDomain: z.string().describe('The new subdomain name (e.g., "my-brand" for my-brand.netlify.app).'),
    }),
    execute: async ({ siteId, newDomain }) => {
        const token = process.env.NETLIFY_ACCESS_TOKEN;
        if (!token) return { error: 'NETLIFY_ACCESS_TOKEN missing.' };

        try {
            // Only update the 'name' (subdomain)
            const body = { name: newDomain };

            const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const text = await response.text();
                // Netlify returns errors often as JSON/text
                return { error: `Netlify Error: ${response.status} - ${text}` };
            }

            const data = await response.json();
            return {
                message: 'Site domain updated successfully.',
                siteUrl: data.ssl_url || data.url,
                adminUrl: data.admin_url,
                newName: data.name
            };
        } catch (e: any) {
            return { error: `Failed to update site domain: ${e.message}` };
        }
    }
});

export const rollbackSite = tool({
    description: 'Rollback a Netlify site to the previous successful deploy.',
    parameters: z.object({
        siteId: z.string().describe('The Netlify Site ID.'),
    }),
    execute: async ({ siteId }) => {
        const token = process.env.NETLIFY_ACCESS_TOKEN;
        if (!token) return { error: 'NETLIFY_ACCESS_TOKEN missing.' };

        try {
            // 1. List deploys to find previous one
            const listResp = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys?state=ready&per_page=5`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!listResp.ok) throw new Error(await listResp.text());

            const deploys: any[] = await listResp.json();

            // We need at least 2 deploys to rollback (current + previous)
            if (deploys.length < 2) {
                return { error: 'Not enough deploy history to rollback (need at least 2 ready deploys).' };
            }

            // deploys[0] is usually the current head. deploys[1] is the previous one.
            const previousDeploy = deploys[1];

            // 2. Restore
            const restoreResp = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys/${previousDeploy.id}/restore`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!restoreResp.ok) throw new Error(await restoreResp.text());

            return {
                message: `Successfully triggered rollback to deploy from ${new Date(previousDeploy.created_at).toLocaleString()}`,
                deployId: previousDeploy.id,
                context: previousDeploy.context,
                branch: previousDeploy.branch
            };

        } catch (e: any) {
            return { error: `Rollback failed: ${e.message}` };
        }
    }
});
