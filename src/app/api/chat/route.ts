import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';
import { createCohere } from '@ai-sdk/cohere';
import { createDeepInfra } from '@ai-sdk/deepinfra';
import { streamText } from 'ai';
import { calculate, weather, webSearch, pdfGenerator, invoiceGenerator, screenshot, portfolio, landingPageGenerator, deleteLandingPage } from '@/lib/tools';
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

        // Auth & Rate Limiting Check
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Please sign in to chat.' }), { status: 401 });
        }

        // Rate Limit (5 messages per 12 hours)
        const TWELVE_HOURS_AGO = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

        // Complex query: Get this user's messages created > 12h ago
        // Since we can't easily join in one simple API call without being an admin or having specific views,
        // we'll do a slightly heavier but functional 2-step check or a filtered select on the 'messages' table 
        // IF we have RLS that allows reading *own* messages. (We do).
        // BUT 'messages' table doesn't have 'user_id' directly, it has 'conversation_id'. 
        // We first find active conversations or just trust the RLS policies.

        // Step 1: Get user's conversation IDs used in last 12h (optimization)
        const { data: recentConversations } = await supabase
            .from('conversations')
            .select('id')
            .eq('user_id', user.id);

        if (recentConversations && recentConversations.length > 0) {
            const conversationIds = recentConversations.map(c => c.id);
            const { count, error: countError } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .in('conversation_id', conversationIds)
                .eq('role', 'user') // Count only user messages
                .gt('created_at', TWELVE_HOURS_AGO);

            if (count !== null && count >= 5) {
                return new Response(JSON.stringify({ error: 'Rate limit exceeded: You can only send 5 messages every 12 hours.' }), { status: 429 });
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



