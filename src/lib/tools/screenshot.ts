import { tool } from 'ai';
import { z } from 'zod';

export const screenshot = tool({
    description: 'Take a screenshot of a given URL',
    parameters: z.object({
        url: z.string().describe('The URL to take a screenshot of'),
    }),
    execute: async ({ url }) => {
        try {
            const response = await fetch("https://www.stagee.art/api/screenshot", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    url: url,
                    deviceType: "desktop",
                }),
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            const data = await response.json();

            // The API returns a base64 string without the data URI prefix. 
            // We assume it's a JPEG based on typical API behavior (or the prefix /9j/).
            const base64Image = data.screenshot;
            const dataUrl = `data:image/jpeg;base64,${base64Image}`;

            return {
                image: dataUrl,
            };
        } catch (error: any) {
            return { error: `Failed to take screenshot: ${error.message || error}` };
        }
    },
});
