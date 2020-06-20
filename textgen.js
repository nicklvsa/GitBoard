const sharp = require('sharp');
const path = require('path');
const PImage = require('pureimage');
const streamBuffers = require('stream-buffers');
const font = PImage.registerFont(path.resolve(__dirname, 'assets/SourceSansPro-Regular.ttf'), 'Source Sans Pro');

module.exports.genText = (text, keyIndex, streamDeck) => {
    font.load(async () => {
            const img = PImage.make(streamDeck.ICON_SIZE, streamDeck.ICON_SIZE);
            const ctx = img.getContext('2d');
            const txtSize = (text.length + 5) / 2;

            ctx.clearRect(0, 0, streamDeck.ICON_SIZE, streamDeck.ICON_SIZE);
            ctx.font = '16pt "Source Sans Pro"';
            ctx.USE_FONT_GLYPH_CACHING = false;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 5;
            ctx.strokeText(text, txtSize, 60);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(text, txtSize, 60);
    
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