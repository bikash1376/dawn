import { tool } from 'ai';
import { z } from 'zod';

// Currency conversion via open.er-api.com — free, no API key required.
export const currencyConvert = tool({
    description: 'Convert an amount from one currency to another using live exchange rates.',
    parameters: z.object({
        amount: z.number().describe('The amount to convert.'),
        from: z.string().describe('3-letter source currency code (e.g. "USD").'),
        to: z.string().describe('3-letter target currency code (e.g. "EUR").'),
    }),
    execute: async ({ amount, from, to }) => {
        try {
            const f = from.toUpperCase();
            const t = to.toUpperCase();
            const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(f)}`);
            if (!res.ok) return { error: 'Currency service unavailable.' };
            const data = await res.json();
            if (data.result !== 'success' || !data.rates?.[t]) {
                return { error: `Could not convert ${f} to ${t}. Check the currency codes.` };
            }
            const rate = data.rates[t];
            const converted = amount * rate;
            return {
                isCurrency: true,
                amount,
                from: f,
                to: t,
                rate,
                converted: Math.round(converted * 100) / 100,
                message: `${amount} ${f} = ${(Math.round(converted * 100) / 100)} ${t}`,
            };
        } catch (error: any) {
            return { error: `Currency conversion failed: ${error.message || error}` };
        }
    },
});

// English dictionary via dictionaryapi.dev — free, no API key required.
export const dictionary = tool({
    description: 'Look up the definition, part of speech, and examples of an English word.',
    parameters: z.object({
        word: z.string().describe('The word to define.'),
    }),
    execute: async ({ word }) => {
        try {
            const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.trim())}`);
            if (!res.ok) return { error: `No definition found for "${word}".` };
            const data = await res.json();
            const entry = Array.isArray(data) ? data[0] : null;
            if (!entry) return { error: `No definition found for "${word}".` };
            const meanings = (entry.meanings || []).slice(0, 3).map((m: any) => ({
                partOfSpeech: m.partOfSpeech,
                definition: m.definitions?.[0]?.definition,
                example: m.definitions?.[0]?.example,
            }));
            return {
                isDictionary: true,
                word: entry.word,
                phonetic: entry.phonetic || '',
                meanings,
                message: `Definition of "${entry.word}"`,
            };
        } catch (error: any) {
            return { error: `Dictionary lookup failed: ${error.message || error}` };
        }
    },
});
