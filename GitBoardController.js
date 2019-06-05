/*
	https://github.com/Lange/node-elgato-stream-deck
	using this library to interact with stream deck
*/

var runtimeModifiedKeys = [];

//const path = require('path');
const { openStreamDeck } = require('elgato-stream-deck');
const controller = openStreamDeck();

//process.stdin.resume();

controller.on('down', keyIndex => {
	if(!(keyIndex in runtimeModifiedKeys)) {
		runtimeModifiedKeys.push(keyIndex);
	}
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

/*process.on('SIGINT', () => {
	if(runtimeModifiedKeys !== undefined && runtimeModifiedKeys.length !== 0) {
		for(var i = 0; i < runtimeModifiedKeys.length; i++) {
			controller.clearKey(runtimeModifiedKeys[i]);
		}
	}
	process.exit(1);
});*/