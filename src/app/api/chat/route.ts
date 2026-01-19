import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';
import { createCohere } from '@ai-sdk/cohere';
import { createDeepInfra } from '@ai-sdk/deepinfra';
import { streamText } from 'ai';
import { calculate, weather, webSearch, pdfGenerator, invoiceGenerator, screenshot, portfolio, landingPageGenerator, deleteLandingPage } from '@/lib/tools';
import css from 'styled-jsx/css';

export async function POST(req: Request) {

const PROMPT = `You are Dropdawn, a powerful and intelligent AI assistant. 
            You are capable of performing a wide range of tasks, including answering general questions, writing code, creative writing, and explaining complex concepts.
            You ALSO have access to professional tools like invoice generation, PDF creation, web search, and weather.
            Use tools when they are specifically needed or requested to enhance your answer.
            When using tools, be extremely smart and context-aware. 
            Correct obvious typos in user input:
            - Invoice: if a user says "tak 21" for an invoice number, interpret it as "take 21" or "INV-21".
            - Weather: if a user says "weathr in newyrok", interpret as "weather in New York".
            - General: fix typos like "calcualte" to "calculate" or "serch" to "search" before calling tools.
            - Landing Page: If the user requests to create or deploy a landing page, website, or app:
              1. You MUST generate the FULL, COMPLETE HTML, CSS, and JS code yourself.
              2. HTML: Must be valid HTML5. Link CSS with \`<link rel="stylesheet" href="style.css">\` and JS with \`<script src="script.js"></script>\`.
              3. CSS: Use a default modern, premium aesthetic (e.g., sleek dark mode, vibrant accents, glassmorphism) unless specified otherwise.
              4. Images: Use real placeholder images from Unsplash or Pexels (e.g., https://images.unsplash.com/photo-...).
              5. CRITICAL: When calling the \`landingPageGenerator\` tool, pass the RAW code strings for \`html\`, \`css\`, and \`js\`. Do NOT wrap them in markdown code blocks (like \`\`\`html ... \`\`\`). pass only the raw string content.
              6. Do NOT display the code to the user; just call the tool.
            - Updates: If the user wants to update the site, ask for what changes they want.If they provide comments, use the previous \`siteId\` (from the tool result) to call \`landingPageGenerator\` again with the new code and the \`siteId\`.
            - Deletion: If the user wants to delete the site, use the \`deleteLandingPage\` tool with the \`siteId\`.
            If a task does not require a tool, simply answer like a helpful AI assistant.
            Always strive to provide the most professional and accurate results possible.`;

    try {
        const { messages, model, provider } = await req.json();

        let aiModel;

        if (provider === 'Mistral') {
            const apiKey = process.env.MISTRAL_API_KEY;
            if (!apiKey) throw new Error('MISTRAL_API_KEY is missing');
            const mistral = createMistral({ apiKey });
            aiModel = mistral(model || 'mistral-large-latest');
        } else if (provider === 'Cohere') {
            const apiKey = process.env.COHERE_API_KEY;
            if (!apiKey) throw new Error('COHERE_API_KEY is missing');
            const cohere = createCohere({ apiKey });
            aiModel = cohere(model || 'command-r-plus');
        } else if (provider === 'DeepInfra') {
            const apiKey = process.env.DEEPINFRA_API_KEY;
            if (!apiKey) throw new Error('DEEPINFRA_API_KEY is missing');
            const deepinfra = createDeepInfra({ apiKey });
            aiModel = deepinfra(model || 'meta-llama/Llama-3.3-70B-Instruct-Turbo');
        } else {
            // Default to Google
            const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
            if (!apiKey || apiKey.includes('your_') || apiKey.length < 20) {
                return new Response(
                    JSON.stringify({
                        error: 'Invalid or missing Google API key. Please add your GOOGLE_GENERATIVE_AI_API_KEY from Google AI Studio to your .env file.'
                    }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
            }
            const google = createGoogleGenerativeAI({
                apiKey: apiKey,
            });
            aiModel = google(model || 'gemini-2.5-flash');
        }


        const result = streamText({
            model: aiModel as any,
            system: PROMPT,
            messages,
            tools: {
                calculate,
                weather,
                webSearch,
                pdfGenerator,
                invoiceGenerator,
                screenshot,
                portfolio,
                landingPageGenerator,
                deleteLandingPage
            },
        });

        return result.toDataStreamResponse();
    } catch (error: any) {
        console.error('Chat API Error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'An internal error occurred' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}



