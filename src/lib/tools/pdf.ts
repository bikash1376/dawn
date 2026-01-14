import { tool } from 'ai';
import { z } from 'zod';
import { jsPDF } from 'jspdf';

export const pdfGenerator = tool({
    description: 'Generate a professional PDF document from text content. Use this to create documents, reports, or simple letters.',
    parameters: z.object({
        title: z.string().describe('The main heading/title displayed at the top of the PDF.'),
        content: z.string().describe('The body text of the document. Can be multiple paragraphs.'),
        filename: z.string().optional().describe('The name of the file to save (e.g., "report.pdf").'),
    }),
    execute: async ({ title, content, filename = 'document.pdf' }) => {
        try {
            const doc = new jsPDF();
            doc.setFontSize(20);
            doc.text(title, 10, 20);
            doc.setFontSize(12);
            const splitText = doc.splitTextToSize(content, 180);
            doc.text(splitText, 10, 40);

            const pdfBase64 = doc.output('datauristring');
            return {
                message: 'PDF generated successfully',
                filename,
                dataUri: pdfBase64,
                instructions: 'The PDF has been generated as a data URI. You can provide this to the user to view or download.'
            };
        } catch (error) {
            return { error: 'Failed to generate PDF' };
        }
    },
});
