const sharp = require('sharp');
const path = require('path');
const PImage = require('pureimage');
const streamBuffers = require('stream-buffers');
const font = PImage.registerFont(path.resolve(__dirname, 'assets/SourceSansPro-Regular.ttf'), 'Source Sans Pro');

const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {

    const lines = text.split("\n");

    for (var i = 0; i < lines.length; i++) {

        const words = lines[i].split(' ');
        let line = '';

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }

        ctx.lineWidth = 3;
        ctx.strokeText(text, x, y);
        ctx.fillText(line, x, y);
        y += lineHeight;
    }
};

module.exports.genText = (text, keyIndex, streamDeck) => {
    font.load(async () => {
            const img = PImage.make(streamDeck.ICON_SIZE, streamDeck.ICON_SIZE);
            const ctx = img.getContext('2d');

            ctx.clearRect(0, 0, streamDeck.ICON_SIZE, streamDeck.ICON_SIZE);
            ctx.font = '16pt "Source Sans Pro"';
            ctx.USE_FONT_GLYPH_CACHING = false;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 5;
            ctx.strokeText(text, 8, 60);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(text, 8, 60);
    
            const writableStreamBuffer = new streamBuffers.WritableStreamBuffer({
                initialSize: 20736, // Start at what should be the exact size we need
                incrementAmount: 1024 // Grow by 1 kilobyte each time buffer overflows.
            });
    
            try {
                await PImage.encodePNGToStream(img, writableStreamBuffer);
                const pngBuffer = await sharp(path.resolve(__dirname, 'assets/general/gitboard.png'))
                    .resize(streamDeck.ICON_SIZE, streamDeck.ICON_SIZE)
                    .composite([{input: writableStreamBuffer.getContents()}]).png().toBuffer();
                const finalBuffer = await sharp(pngBuffer).flatten().raw().toBuffer();
                streamDeck.fillImage(keyIndex, finalBuffer);
            } catch (error) {
                console.error(error);
            }
        });
}