import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';
import { createCohere } from '@ai-sdk/cohere';
import { createDeepInfra } from '@ai-sdk/deepinfra';
import { streamText } from 'ai';
import { calculate, weather, webSearch, pdfGenerator, invoiceGenerator } from '@/lib/tools';

export async function POST(req: Request) {
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
            system: `You are Dropdawn, a powerful and intelligent AI assistant. 
            You have access to professional tools like invoice generation, PDF creation, web search, and weather.
            When using tools, be extremely smart and context-aware. 
            Correct obvious typos in user input (e.g., if a user says "tak 21" for an invoice number, interpret it as "take 21" or "INV-21").
            Always strive to provide the most professional and accurate results possible.`,
            messages,
            tools: {
                calculate,
                weather,
                webSearch,
                pdfGenerator,
                invoiceGenerator
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



