import { GoogleGenerativeAI } from "@google/generative-ai";
import { removeWhiteBackground } from "../utils/imageUtils";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// Initialize the SDK for text-based tasks (prompt enhancement)
const genAI = new GoogleGenerativeAI(API_KEY);
const textModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// MODEL CONFIGURATION
const IMAGE_MODEL = "gemini-3-pro-image-preview";

const generateWithGeminiImages = async (prompt: string): Promise<string | null> => {
    if (!API_KEY) return null;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    responseModalities: ["IMAGE"], // This forces the model to output an image
                    imageConfig: {
                        aspectRatio: "1:1",
                        imageSize: "1K" // Options: "1K" or "2K"
                    }
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini Image API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // Parse the Unified API response format
        // Python equivalent: chunk.parts[0].inline_data
        const part = data.candidates?.[0]?.content?.parts?.[0];

        if (part?.inlineData && part.inlineData.mimeType.startsWith('image')) {
            // Construct the Data URL directly
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }

        return null;
    } catch (error) {
        console.warn(`Gemini (${IMAGE_MODEL}) generation failed:`, error);
        return null;
    }
};

export const generateSpriteUrl = async (prompt: string, originalId: number): Promise<string> => {
    try {
        let finalPrompt = prompt;

        // 1. Enhance prompt using Gemini Text model (Optional but recommended for better sprites)
        if (API_KEY) {
            try {
                const enhancementPrompt = `Describe a visual spread for a single Pokemon based on this name/concept: "${prompt}". 
                Keep it under 15 words. Focus on visual description only (colors, body type, element). 
                Example: "Red fire dragon with burning wings and sharp claws, pixel art style."`;

                const result = await textModel.generateContent(enhancementPrompt);
                const enhancedText = result.response.text().trim();

                // Enforce pixel art style in the final prompt
                // "sprite sheet style" often generates multiple images, so we remove it.
                // We add "single isolated character" and "white background" to ensure clean extraction.
                finalPrompt = `${enhancedText}, pixel art pokemon sprite, white background, single isolated character, no background, high quality`;
            } catch (e) {
                console.warn("Gemini prompt enhancement failed, using raw prompt.", e);
                finalPrompt = `${prompt} pokemon, pixel art style, white background, single isolated character`;
            }
        } else {
            finalPrompt = `${prompt} pokemon, pixel art style, white background, single isolated character`;
        }        // ... existing code ...

        // 2. Attempt Gemini Image Generation
        if (API_KEY) {
            const geminiImageUrl = await generateWithGeminiImages(finalPrompt);
            if (geminiImageUrl) {
                // Process to remove background
                return await removeWhiteBackground(geminiImageUrl);
            }
            console.log("Gemini generation failed or returned no image. Falling back to Pollinations...");
        }

        // 3. Fallback: Generate Pollinations.ai URL 
        const encodedPrompt = encodeURIComponent(finalPrompt);
        const seed = Math.floor(Math.random() * 100000);
        const pollUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=256&height=256&seed=${seed}&nologo=true&model=flux`;

        // Also remove background for Pollinations result
        // Note: This might cause a slight delay as we fetch the image client-side to process it.
        return await removeWhiteBackground(pollUrl);

    } catch (error) {
        console.error("Sprite Generation Fatal Error:", error);
        // Ultimate Fallback: Official Pokemon Artwork
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${originalId}.png`;
    }
};