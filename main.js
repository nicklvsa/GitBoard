const {app, BrowserWindow, ipcMain} = require('electron');
const {openStreamDeck} = require('elgato-stream-deck');
const path = require('path');

let mainWindow = null;
var runtimeModifiedKeys = [];

const controller = openStreamDeck();

if(process.mas) app.setName("GitBoard");

function init() {

	console.log("init");

	makeSingleInstance();
	handleEvents();

	function createWindow() {

		const options = {
			width: 300,
			minWidth: 300,
			maxWidth: 300,
			height: 460,
			minHeight: 460,
			maxHeight: 460,
			title: app.getName(),
			webPreferences: {
				nodeIntegration: true
			}
		};

		switch(process.platform) {
			case 'linux':
			break;
			case 'windows':
			break;
			case 'darwin':
			break;
			default:
			break;
		}

		mainWindow = new BrowserWindow(options);
		mainWindow.loadURL(path.join('file://', __dirname, 'index.html'));
		mainWindow.setMenu(null);

		if(process.platform === 'win32') {
			let size = mainWindow.getSize();
			mainWindow.setSize(size[0], parseInt(size[0] * 9 / 16));
		}

		mainWindow.on('closed', () => {
			mainWindow = null;
		});
	}

	app.on('ready', () => {
		createWindow();
	});

	app.on('activate', () => {
		if(mainWindow === null) createWindow();
	});

	app.on('window-all-closed', () => {
		if(process.platform !== 'darwin') exitApp();
	});
}

function setupController() {
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
}

function handleEvents() {
	ipcMain.on('quit-button', (evt, arg) => {
		exitApp();
	});

	ipcMain.on('start-button', (evt, arg) => {
		setupController();
	});
}

function makeSingleInstance() {
	if(process.mas) return;
	app.requestSingleInstanceLock();
	app.on('second-instance', () => {
		if(mainWindow) {
			if(mainWindow.isMinimized()) mainWindow.restore();
			mainWindow.focus();
		}
	});
}

function exitApp() {
	if(runtimeModifiedKeys !== undefined && runtimeModifiedKeys.length !== 0) {
		for(var i = 0; i < runtimeModifiedKeys.length; i++) {
			controller.clearKey(runtimeModifiedKeys[i]);
		}
	}
	app.quit();
}

init();