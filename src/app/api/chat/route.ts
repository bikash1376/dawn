import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';
import { createCohere } from '@ai-sdk/cohere';
import { createDeepInfra } from '@ai-sdk/deepinfra';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { calculate, weather, webSearch, pdfGenerator, invoiceGenerator, screenshot, portfolio, staticSiteGenerator, deleteLandingPage, updateSiteDomain, rollbackSite, pptxGenerator, statsChart, currencyConvert, dictionary } from '@/lib/tools';
import { createClient } from '@/lib/supabase/server';
import { FRONTEND_SKILL } from '@/lib/skills/frontend';

export async function POST(req: Request) {

    const PROMPT = `You are Dropdawn, a powerful and intelligent AI assistant.
            You are capable of answering general questions, writing code, creative writing, and explaining complex concepts.
            Use tools when they are specifically needed or requested to enhance your answer.

            AVAILABLE TOOLS (these are the only capabilities you have):
            - calculate — math/arithmetic
            - weather — current weather for a location
            - webSearch — search the web for current info
            - pdfGenerator — create a downloadable PDF document
            - invoiceGenerator — create a downloadable invoice PDF
            - pptxGenerator — create a downloadable, text-based PowerPoint (.pptx) with a design template
            - statsChart — interactive data charts (bar/line/area/pie) the user can hover and export
            - currencyConvert — convert between currencies at live rates
            - dictionary — define English words
            - screenshot — capture a screenshot of a URL
            - portfolio — generate a portfolio URL from a GitHub username
            - staticSiteGenerator — generate & deploy a STATIC landing page (HTML/CSS/JS) to Netlify
            - updateSiteDomain / rollbackSite / deleteLandingPage — manage deployed sites

            IMAGE GENERATION IS NOT AVAILABLE. You cannot create, draw, or generate images/art/logos/photos.
            If the user asks you to generate an image, briefly say image generation isn't available, then
            list the tools above that you CAN use so they know their options. (You may still take a screenshot
            of a URL or use placeholder stock photos inside a generated website.)

            When using tools, be smart and context-aware. Correct obvious typos in user input
            (e.g. "tak 21" -> invoice "INV-21"; "weathr in newyrok" -> weather "New York"; "calcualte" -> calculate).

            WEBSITES (static only — there is NO backend, server code, or database):
            1. Use \`staticSiteGenerator\` for landing pages / sites. Pure HTML/CSS/JS only.
            2. Generate valid, complete code. Pass RAW code strings to the tool (do not wrap in markdown).
            3. Follow the frontend skill below for design quality.
            4. Management: \`updateSiteDomain\` (subdomain), \`rollbackSite\` (revert), \`deleteLandingPage\` (delete).
            5. Updating: reuse the previous \`siteId\` from the tool result.
            If anything requires a backend (auth storage, payments, server APIs), explain it can't be done on a
            static site and offer a client-side or third-party-link alternative.

            ${FRONTEND_SKILL}

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

        if (provider === 'Anthropic') {
            const apiKey = process.env.ANTHROPIC_API_KEY;
            if (!apiKey) throw new Error('ANTHROPIC_API_KEY is missing');
            const anthropic = createAnthropic({ apiKey });
            aiModel = anthropic(model || 'claude-haiku-4-5-20251001');
        } else if (provider === 'Mistral') {
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
                pptxGenerator,
                statsChart,
                currencyConvert,
                dictionary,
                screenshot,
                portfolio,
                staticSiteGenerator,
                deleteLandingPage,
                updateSiteDomain,
                rollbackSite
            },
        });

        return result.toDataStreamResponse({
            getErrorMessage: (error: any) => {
                console.error('Stream error:', error);
                const msg = typeof error === 'string' ? error : error?.message;
                // Surface a useful, non-sensitive message to the client.
                if (msg?.match(/api key|unauthorized|permission|quota|429|rate/i)) {
                    return 'The model provider rejected the request (key, quota, or rate limit). Try another model.';
                }
                return msg || 'The model failed while generating a response. Please try again.';
            },
        });
    } catch (error: any) {
        console.error('Chat API Error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'An internal error occurred' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}