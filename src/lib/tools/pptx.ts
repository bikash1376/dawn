import { tool } from 'ai';
import { z } from 'zod';
import pptxgen from 'pptxgenjs';

// Pre-built color/design templates. Hex values are stored WITHOUT the leading '#'
// for pptxgenjs; the frontend preview adds it back.
export const PPTX_THEMES: Record<string, {
    name: string;
    bg: string;        // slide background
    title: string;     // title text color
    body: string;      // body text color
    accent: string;    // accent bar / bullets
    titleFont: string;
    bodyFont: string;
}> = {
    minimal: { name: 'Minimal', bg: 'FFFFFF', title: '111827', body: '374151', accent: '2563EB', titleFont: 'Georgia', bodyFont: 'Arial' },
    dark: { name: 'Dark', bg: '0F172A', title: 'F8FAFC', body: 'CBD5E1', accent: '38BDF8', titleFont: 'Verdana', bodyFont: 'Arial' },
    corporate: { name: 'Corporate', bg: 'F8FAFC', title: '0F172A', body: '334155', accent: '0EA5E9', titleFont: 'Georgia', bodyFont: 'Calibri' },
    vibrant: { name: 'Vibrant', bg: '1E1B4B', title: 'FDE68A', body: 'E9D5FF', accent: 'F472B6', titleFont: 'Trebuchet MS', bodyFont: 'Trebuchet MS' },
    earth: { name: 'Earth', bg: 'F4F1EA', title: '3F3A2F', body: '57534E', accent: 'B45309', titleFont: 'Georgia', bodyFont: 'Georgia' },
};

export const pptxGenerator = tool({
    description: 'Generate a downloadable, text-based PowerPoint (.pptx) presentation with a chosen design template. Use this when the user wants slides or a deck. Text only — no images.',
    parameters: z.object({
        title: z.string().describe('The presentation title (shown on the title slide).'),
        subtitle: z.string().optional().describe('Optional subtitle / author for the title slide.'),
        slides: z.array(z.object({
            title: z.string().describe('Slide heading.'),
            bullets: z.array(z.string()).describe('Bullet points for the slide body. Keep each concise.'),
        })).describe('The content slides (after the title slide).'),
        theme: z.enum(['minimal', 'dark', 'corporate', 'vibrant', 'earth']).optional().describe('Design template. Defaults to "minimal".'),
        filename: z.string().optional().describe('Download filename, e.g. "deck.pptx".'),
    }),
    execute: async ({ title, subtitle, slides, theme = 'minimal', filename = 'presentation.pptx' }) => {
        try {
            const t = PPTX_THEMES[theme] || PPTX_THEMES.minimal;
            const pptx = new pptxgen();
            pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 in

            // Title slide
            const title0 = pptx.addSlide();
            title0.background = { color: t.bg };
            title0.addShape(pptx.ShapeType.rect, { x: 0, y: 3.05, w: 1.6, h: 0.08, fill: { color: t.accent } });
            title0.addText(title, { x: 0.7, y: 2.0, w: 12, h: 1.0, fontSize: 40, bold: true, color: t.title, fontFace: t.titleFont });
            if (subtitle) {
                title0.addText(subtitle, { x: 0.7, y: 3.3, w: 12, h: 0.6, fontSize: 18, color: t.body, fontFace: t.bodyFont });
            }

            // Content slides
            for (const s of slides) {
                const slide = pptx.addSlide();
                slide.background = { color: t.bg };
                slide.addShape(pptx.ShapeType.rect, { x: 0.7, y: 1.15, w: 0.9, h: 0.06, fill: { color: t.accent } });
                slide.addText(s.title, { x: 0.7, y: 0.5, w: 12, h: 0.8, fontSize: 28, bold: true, color: t.title, fontFace: t.titleFont });
                if (s.bullets?.length) {
                    slide.addText(
                        s.bullets.map(b => ({ text: b, options: { bullet: { code: '2022' }, color: t.body, fontSize: 18, fontFace: t.bodyFont, paraSpaceAfter: 10 } })),
                        { x: 0.9, y: 1.5, w: 11.5, h: 5.3, valign: 'top' }
                    );
                }
            }

            const base64 = await pptx.write({ outputType: 'base64' }) as string;
            const dataUri = `data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,${base64}`;

            return {
                message: `Generated a ${slides.length + 1}-slide "${t.name}" presentation.`,
                filename: filename.endsWith('.pptx') ? filename : `${filename}.pptx`,
                dataUri,
                theme: { ...t, key: theme },
                // The frontend renders a live slide preview from `slides` and a download
                // button from `dataUri`. Do NOT print the data URI or base64 in your reply.
                slides: [{ title, bullets: subtitle ? [subtitle] : [], isTitle: true }, ...slides.map(s => ({ title: s.title, bullets: s.bullets }))],
                instructions: 'The presentation is ready: a slide preview and a download button are already shown to the user. Reply with one short confirmation sentence. Do NOT output the data URI or base64.',
            };
        } catch (error: any) {
            return { error: `Failed to generate presentation: ${error.message || error}` };
        }
    },
});
