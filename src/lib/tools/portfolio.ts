import { tool } from 'ai';
import { z } from 'zod';

export const portfolio = tool({
    description: 'Generate a portfolio URL from a GitHub username',
    parameters: z.object({
        username: z.string().describe('The GitHub username'),
    }),
    execute: async ({ username }) => {
        return {
            url: `https://www.foliox.site/${username}`,
            info: 'This opensource project is made by Kartik',
            twitter: 'https://x.com/code_kartik',
        };
    },
});
