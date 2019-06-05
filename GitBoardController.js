const path = require('path');
const { openStreamDeck } = require('elgato-stream-deck');

const controller = openStreamDeck();

process.stdin.resume();

controller.on('down', keyIndex => {
	controller.fillColor(keyIndex, 0, 255, 0);
	console.log('key %d down', keyIndex);
});

controller.on('up', keyIndex => {
	controller.fillColor(keyIndex, 255, 0, 0);
	console.log('key %d up', keyIndex);
});

controller.on('error', error => {
	console.error(error);
});

process.on('SIGINT', () => {
	controller.clearAllKeys();
	process.exit(1);
});