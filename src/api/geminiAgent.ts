import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Initialize Gemini
// NOTE: In a real app, use import.meta.env.VITE_GEMINI_API_KEY
// For now, we'll assume the user will provide it or we set it in .env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// Use the 1.5-flash model which supports structured output well
const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    // Set default generation config to force JSON
    generationConfig: {
        responseMimeType: "application/json"
    }
});

export const generateFakemonName = async (type: string, originalName: string): Promise<string> => {
    if (!API_KEY) return `Neo-${originalName}`;

    const prompt = `Rename this ${type}-type Pokémon (originally ${originalName}). Give it a cool, competitive-battler style name. The new name MUST contain at least one syllable or part of "${originalName}". One word only.`;

    // Schema for strict name generation
    const schema = {
        type: SchemaType.OBJECT,
        properties: {
            name: { type: SchemaType.STRING, description: "The single-word nickname" }
        },
        required: ["name"]
    };

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema as any
            }
        });

        const responseText = result.response.text();
        const data = JSON.parse(responseText);
        return data.name?.trim().split(' ')[0] || `Dark-${originalName}`;
    } catch (error) {
        console.error("Gemini Name Gen Error:", error);
        return `Dark-${originalName.charAt(0).toUpperCase() + originalName.slice(1)}`;
    }
};

export interface CounterPickRequest {
    userTeam: { name: string; types: string[]; stats: any }[];
}

export const generateCounterTeam = async (userTeam: any[]): Promise<any> => {
    if (!API_KEY) return null;

    const teamDescription = userTeam.map(p => `${p.name} (${p.types.join('/')})`).join(', ');

    const prompt = `
     Context: You are a Competitive Pokémon World Champion.
     Opponent Team: ${teamDescription}.
     Task: Identify 3 hard counters (Gen 1-3 Pokémon).
   `;

    // Strict schema for team generation
    const schema = {
        type: SchemaType.OBJECT,
        properties: {
            analysis: { type: SchemaType.STRING },
            counter_picks: {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        base_species_id: { type: SchemaType.NUMBER, description: "Pokedex ID (1-493)" },
                        reasoning: { type: SchemaType.STRING }
                    },
                    required: ["base_species_id", "reasoning"]
                }
            }
        },
        required: ["analysis", "counter_picks"]
    };

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema as any
            }
        });

        return JSON.parse(result.response.text());
    } catch (error) {
        console.error("Gemini Counter Gen Error:", error);
        return null;
    }
}

export const generateBattleThought = async (botName: string, opponentName: string, moveName: string): Promise<string> => {
    if (!API_KEY) {
        return `Calculating success probability for ${moveName}... 98%.`;
    }

    const prompt = `
        Roleplay as a super-intelligent AI battle system named ${botName}.
        You are fighting ${opponentName}.
        You just decided to use the move "${moveName}".
        Generate a very short "thought process" log line (max 15 words).
    `;

    const schema = {
        type: SchemaType.OBJECT,
        properties: {
            log: { type: SchemaType.STRING, description: "The sci-fi battle log line." }
        },
        required: ["log"]
    };

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema as any
            }
        });
        const data = JSON.parse(result.response.text());
        return data.log;
    } catch (error) {
        console.error("Gemini Thought Gen Error:", error);
        return `${moveName} selected.`;
    }
};
