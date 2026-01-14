import { tool } from 'ai';
import { z } from 'zod';
import { tavily } from '@tavily/core';

export const webSearch = tool({
    description: 'Search the web for information using Tavily API.',
    parameters: z.object({
        query: z.string().describe('The search query'),
    }),
    execute: async ({ query }) => {
        const apiKey = process.env.TAVILY_API_KEY;
        if (!apiKey) {
            return { error: 'TAVILY_API_KEY is not configured' };
        }
        const tvly = tavily({ apiKey });
        try {
            const results = await tvly.search(query, {
                searchDepth: "basic",
                maxResults: 5
            });
            return { results };
        } catch (error) {
            return { error: 'Search failed' };
        }
    },
});
