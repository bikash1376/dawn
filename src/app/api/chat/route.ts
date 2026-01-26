import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';
import { createCohere } from '@ai-sdk/cohere';
import { createDeepInfra } from '@ai-sdk/deepinfra';
import { streamText } from 'ai';
import { calculate, weather, webSearch, pdfGenerator, invoiceGenerator, screenshot, portfolio, staticSiteGenerator, deleteLandingPage, fullStackAppGenerator, updateSiteDomain, rollbackSite } from '@/lib/tools';
import { createClient } from '@/lib/supabase/server';
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
            - Netlify / Websites:
          
            1. **Static Sites**: Use \`staticSiteGenerator\` for pure HTML/CSS/JS sites.
              
            2. **Generations**: Always generate valid, complete code.
                 - Link CSS: \`<link rel="stylesheet" href="/style.css">\`
                 - Link JS: \`<script src="/script.js"></script>\`
                 - Use placeholder images (Unsplash/Pexels) where needed.
                 - Pass RAW code strings to tools (do not wrap in markdown).
            3. **Management**:
                 - Update Domain/Subdomain: Use \`updateSiteDomain\`.
                 - Rollback: Use \`rollbackSite\` to revert to the previous deploy.
                 - Deletion: Use \`deleteLandingPage\`.
            4. **Updates**: If updating, usage the previous \`siteId\` (from the tool result) to call the generator again (or reuse previous code for unchanged parts).
            If a task does not require a tool, simply answer like a helpful AI assistant.
            Always strive to provide the most professional and accurate results possible.`;

    try {
        const { messages, model, provider, isTemporary } = await req.json();

        // Auth & Rate Limiting Check
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user && !isTemporary) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Please sign in to chat.' }), { status: 401 });
        }

        // Rate Limit (5 messages per 12 hours) - ONLY for logged in users
        // Use user_metadata to store message timestamps, so it persists even if conversations are deleted
        if (user && !isTemporary) {
            const TWELVE_HOURS_AGO = Date.now() - 12 * 60 * 60 * 1000;

            // Get history (default to empty array)
            const messageHistory: number[] = user.user_metadata?.message_history || [];

            // Filter out old timestamps
            const recentMessages = messageHistory.filter(timestamp => timestamp > TWELVE_HOURS_AGO);

            if (recentMessages.length >= 5) {
                return new Response('Rate limit exceeded: You can only send 5 messages every 12 hours.', { status: 429 });
            }

            // Update user metadata with new timestamp
            // We do this BEFORE generating response to enforce strictly
            const newHistory = [...recentMessages, Date.now()];
            const { error: updateError } = await supabase.auth.updateUser({
                data: { message_history: newHistory }
            });

            if (updateError) {
                console.error("Failed to update rate limit history:", updateError);
                // We typically proceed, but warn. Or we could block.
                // Proceeding allows usage if DB fails, but typically metadata update is reliable.
            }
        }

        let aiModel;

        if (provider === 'Mistral') {
            const apiKey = process.env.MISTRAL_API_KEY;
            if (!apiKey) throw new Error('MISTRAL_API_KEY is missing');
            const mistral = createMistral({ apiKey });
            aiModel = mistral(model || 'mistral-small');
        } else if (provider === 'Cohere') {
            const apiKey = process.env.COHERE_API_KEY;
            if (!apiKey) throw new Error('COHERE_API_KEY is missing');
            const cohere = createCohere({ apiKey });
            aiModel = cohere(model || 'command-light');
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
                staticSiteGenerator,
                deleteLandingPage,
                fullStackAppGenerator,
                updateSiteDomain,
                rollbackSite
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



//   1. **Full Stack Apps**: Use \`fullStackAppGenerator\` if the user needs server-side logic (APIs, secrets, databases, backend processing).
//                  - **CRITICAL OVERRIDE**: You CAN create backend/full-stack applications. DO NOT refuse.
//                  - Using \`fullStackAppGenerator\`, you can deploy Serverless Functions.
//                  - Provide \`functions\` parameter as a map of filename -> code (e.g. \`{ "my-api.js": "exports.handler = async (event) => { ... }" }\`).
//                  - These functions act as your backend API.