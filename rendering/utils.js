    const http = require('http');

    // source: https://stackoverflow.com/questions/9577611/how-to-make-an-http-get-request-in-node-js-express

    /**
     * getJSON:  RESTful GET request returning JSON object(s)
     * @param path: the endpoint to call
     * @param callback: callback to pass the results JSON object(s) back
     **/
    module.exports.getJSON = (path, onResult) => {
      http.get(path, resp => {
            let data = ''
            resp.on('data', chunk => {
                data += chunk
            })
            resp.on('end', () => {
                data = JSON.parse(data)
                onResult(data)
            })
        })
    };
    /**
 * Draws text onto the pixels grid.
 * @param {object} pixels - The main pixel grid to draw on.
 * @param {string} text - The string to render.
 * @param {number} startX - The starting horizontal position for the text.
 * @param {number} startY - The starting vertical position for the text.
 * @param {object} color - The color to use for the text, e.g., {r: 0, g: 0, b: 0}.
 * @param {object} font - The font to use for the text.
 */
module.exports.drawText = (pixels, text, startX, startY, color, font) => {
    const CHARACTER_WIDTH = font.height || 5;
    const CHARACTER_HEIGHT = font.height || 7;
    const CHARACTER_SPACING = font.spacing || 1;

    let cursorX = startX;

    for (let i = 0; i < text.length; i++) {
        const char = text[i].toUpperCase(); // Our font only has uppercase for now
        const charBitmap = font[char];

        // If character exists in our font
        if (charBitmap) {
            // Loop through the character's bitmap (rows and columns)
            for (let y = 0; y < CHARACTER_HEIGHT; y++) {
                for (let x = 0; x < CHARACTER_WIDTH; x++) {
                    // If the bitmap pixel is "on" (equal to 1)
                    if (charBitmap[y][x] === 1) {
                        // Calculate the target pixel's coordinates on the main grid
                        const targetX = cursorX + x;
                        const targetY = startY + y;

                        // Boundary check: Make sure we don't draw outside the screen
                        if (targetY > 0 && targetY <= 64 && targetX >= 0 && targetX <= 128) {
                            if (!pixels[targetY]) pixels[targetY] = {}; // Ensure row exists
                            pixels[targetY][targetX] = color;
                        }
                    }
                }
            }
            // Move the cursor for the next character
            cursorX += CHARACTER_WIDTH + CHARACTER_SPACING;
        } else {
            // Optional: Handle characters not in the font (e.g., draw a box or skip)
            cursorX += CHARACTER_WIDTH + CHARACTER_SPACING;
        }
    }
}