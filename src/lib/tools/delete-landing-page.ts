import { tool } from 'ai';
import { z } from 'zod';

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

            const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
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
                siteId: siteId
            };

        } catch (error: any) {
            console.error("Error deleting landing page:", error);
            return { error: `Failed to delete landing page: ${error.message || error}` };
        }
    },
});
