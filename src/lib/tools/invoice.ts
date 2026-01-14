import { tool } from 'ai';
import { z } from 'zod';
import { jsPDF } from 'jspdf';

export const invoiceGenerator = tool({
    description: 'Generate a professional invoice PDF. Use this tool when the user wants to create an invoice. Be smart about extracting parameters even if the user provides vague or misspelled information (e.g., "tak 21" should be interpreted as "take 21" or "INV-021" if appropriate).',
    parameters: z.object({
        invoiceNumber: z.string().describe('The unique identifier for the invoice (e.g., INV-001, 2024-001). Extract this carefully from user input, correcting obvious typos.'),
        clientName: z.string().describe('The full name of the client being billed.'),
        clientEmail: z.string().email().describe('The valid email address of the client.'),
        items: z.array(z.object({
            description: z.string().describe('Clear description of the service or product.'),
            quantity: z.number().describe('Number of units.'),
            price: z.number().describe('Unit price (numerical value only).'),
        })).describe('Detailed list of line items.'),
        currency: z.string().default('USD').describe('The 3-letter currency code (e.g., USD, EUR, GBP).'),
    }),
    execute: async ({ invoiceNumber, clientName, clientEmail, items, currency }) => {
        try {
            const doc = new jsPDF();

            // Header
            doc.setFontSize(22);
            doc.text('INVOICE', 105, 20, { align: 'center' });

            // Info
            doc.setFontSize(12);
            doc.text(`Invoice #: ${invoiceNumber}`, 20, 40);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);

            doc.text('Bill To:', 20, 70);
            doc.setFont('helvetica', 'bold');
            doc.text(clientName, 20, 80);
            doc.setFont('helvetica', 'normal');
            doc.text(clientEmail, 20, 90);

            // Table Header
            let y = 110;
            doc.setFillColor(240, 240, 240);
            doc.rect(20, y - 5, 170, 10, 'F');
            doc.setFont('helvetica', 'bold');
            doc.text('Description', 25, y);
            doc.text('Qty', 120, y);
            doc.text('Price', 140, y);
            doc.text('Total', 170, y);

            // Items
            doc.setFont('helvetica', 'normal');
            let grandTotal = 0;
            y += 10;
            items.forEach(item => {
                const itemTotal = item.quantity * item.price;
                grandTotal += itemTotal;
                doc.text(item.description, 25, y);
                doc.text(item.quantity.toString(), 120, y);
                doc.text(`${currency} ${item.price.toFixed(2)}`, 140, y);
                doc.text(`${currency} ${itemTotal.toFixed(2)}`, 170, y);
                y += 10;
            });

            // Total
            y += 10;
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`Grand Total: ${currency} ${grandTotal.toFixed(2)}`, 170, y, { align: 'right' });

            const pdfBase64 = doc.output('datauristring');
            return {
                message: 'Invoice generated successfully',
                invoiceNumber,
                grandTotal: `${currency} ${grandTotal.toFixed(2)}`,
                dataUri: pdfBase64
            };
        } catch (error) {
            return { error: 'Failed to generate invoice' };
        }
    },
});
