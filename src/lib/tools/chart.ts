import { tool } from 'ai';
import { z } from 'zod';

// Shared palettes used by the frontend chart renderer (recharts).
export const CHART_THEMES: Record<string, string[]> = {
    default: ['#2563EB', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    sunset: ['#F472B6', '#FB923C', '#FBBF24', '#F87171', '#C084FC', '#FB7185'],
    forest: ['#16A34A', '#65A30D', '#0D9488', '#15803D', '#4D7C0F', '#047857'],
    mono: ['#0F172A', '#334155', '#64748B', '#94A3B8', '#CBD5E1', '#475569'],
};

export const statsChart = tool({
    description: 'Generate an interactive data visualization / statistics chart (bar, line, area, or pie) that the user can hover for values and export as an image. Use this when the user wants to visualize numbers, stats, comparisons, or trends.',
    parameters: z.object({
        title: z.string().describe('Chart title.'),
        chartType: z.enum(['bar', 'line', 'area', 'pie']).describe('The kind of chart that best fits the data.'),
        xKey: z.string().default('name').describe('The field name in each data row used as the category/x-axis label (e.g. "month", "name").'),
        keys: z.array(z.string()).describe('The numeric field name(s) in each row to plot as series (e.g. ["sales"] or ["2023","2024"]). For pie charts, use exactly one key.'),
        data: z.array(z.record(z.union([z.string(), z.number()]))).describe('The rows of data. Each row is an object with the xKey label plus the numeric keys, e.g. {"month":"Jan","sales":120}.'),
        theme: z.enum(['default', 'sunset', 'forest', 'mono']).optional().describe('Color palette. Defaults to "default".'),
    }),
    execute: async ({ title, chartType, xKey, keys, data, theme = 'default' }) => {
        try {
            if (!data?.length || !keys?.length) {
                return { error: 'Chart needs at least one data row and one numeric key.' };
            }
            // Pure data passthrough — the frontend renders it interactively. No file/base64.
            return {
                isChart: true,
                title,
                chartType,
                xKey,
                keys,
                data,
                colors: CHART_THEMES[theme] || CHART_THEMES.default,
                message: `${chartType} chart: ${title}`,
            };
        } catch (error: any) {
            return { error: `Failed to build chart: ${error.message || error}` };
        }
    },
});
