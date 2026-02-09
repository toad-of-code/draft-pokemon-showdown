/**
 * Takes an image source (URL or Base64) and returns a new Data URL
 * with the white background converted to transparent.
 */
export const removeWhiteBackground = (imageSource: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Allow CORS for external images like Pollinations
        img.src = imageSource;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(imageSource); // Fallback if no context
                return;
            }

            canvas.width = img.width;
            canvas.height = img.height;

            // Draw image to canvas
            ctx.drawImage(img, 0, 0);

            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Loop through pixels
            // Assumption: Background is white-ish.
            // We'll treat anything very close to white as transparent.
            const threshold = 240; // 0-255, higher means strictly white

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Check if pixel is white-ish
                if (r > threshold && g > threshold && b > threshold) {
                    // Make transparent
                    data[i + 3] = 0;
                }
            }

            // Put modified data back
            ctx.putImageData(imageData, 0, 0);

            // Return new Data URL
            resolve(canvas.toDataURL('image/png'));
        };

        img.onerror = (err) => {
            console.warn("Failed to process image for background removal", err);
            resolve(imageSource); // Return original on error
        };
    });
};
