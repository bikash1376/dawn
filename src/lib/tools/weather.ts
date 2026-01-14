import { tool } from 'ai';
import { z } from 'zod';

export const weather = tool({
    description: 'Get the current weather for a specific location.',
    parameters: z.object({
        location: z.string().describe('The name of the city and country (e.g., "London, UK")'),
    }),
    execute: async ({ location }) => {
        try {
            const response = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
            if (!response.ok) throw new Error('Weather service unavailable');
            const data = await response.json();
            const current = data.current_condition[0];
            return {
                location,
                temperature: `${current.temp_C}°C / ${current.temp_F}°F`,
                condition: current.weatherDesc[0].value,
                humidity: `${current.humidity}%`,
                wind: `${current.windspeedKmph} km/h`,
            };
        } catch (error) {
            return { error: 'Failed to fetch weather data' };
        }
    },
});
