import { tool } from 'ai';
import { z } from 'zod';

export const calculate = tool({
    description: 'A calculator tool that can perform basic arithmetic operations (add, subtract, multiply, divide).',
    parameters: z.object({
        expression: z.string().describe('The mathematical expression to evaluate (e.g., "2 + 2")'),
    }),
    execute: async ({ expression }) => {
        try {
            // Basic sanitization and evaluation
            const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
            // eslint-disable-next-line no-eval
            const result = eval(sanitized);
            return { result, expression };
        } catch (err) {
            return { error: 'Invalid expression' };
        }
    },
});
