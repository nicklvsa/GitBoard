const {app, Tray, BrowserWindow, ipcMain, Menu, dialog} = require('electron');
const {openStreamDeck, listStreamDecks} = require('elgato-stream-deck');
const path = require('path');

let mainWindow = null;
var runtimeModifiedKeys = [];
let gitboardIcon = path.join(__dirname, 'assets/general/gitboard.png');

const controller = openStreamDeck();

if(process.mas) app.setName("GitBoard");

function init() {

	console.log("init");

	makeSingleInstance();
	handleEvents();

	function createWindow() {

		var appIcon = new Tray(gitboardIcon);

		const options = {
			width: 300,
			minWidth: 300,
			maxWidth: 300,
			height: 460,
			minHeight: 460,
			maxHeight: 520,
			title: app.getName(),
			icon: gitboardIcon,
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
		mainWindow.setResizable(false);

		var trayMenu = Menu.buildFromTemplate([
			{
				label: 'Show GitBoard', click: () => {
					mainWindow.show();
				}
			},
			{
				label: 'Quit GitBoard', click: () => {
					exitApp();
				}
			},
			{
				label: 'Actions',
				submenu: [
					{
						label: 'Enable Inputs', click: () => {
							hookCurrentControllerListeners(true);
						}
					},
					{
						label: 'Disable Inputs', click: () => {
							hookCurrentControllerListeners(false);
						}
					}
				]
			}
		]);

		appIcon.setContextMenu(trayMenu);

		if(process.platform === 'win32') {
			let size = mainWindow.getSize();
			mainWindow.setSize(size[0], parseInt(size[0] * 9 / 16));
		}

		mainWindow.on('closed', () => {
			mainWindow = null;
		});

		mainWindow.on('minimize', (evt) => {
			evt.preventDefault();
			mainWindow.hide();
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

function setupController(evt) {
	if(listStreamDecks() !== null && listStreamDecks() !== undefined) {
		const streamDecks = listStreamDecks();
		streamDecks.forEach((device) => {
			console.log("Connected Stream Decks: " + JSON.stringify(device));
		});
		evt.reply('switch-to-loader', 'show');
	}

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
		exitApp();
	});
}

function handleEvents() {
	ipcMain.on('quit-button', (evt, arg) => {
		exitApp();
	});

	ipcMain.on('start-button', (evt, arg) => {
		setupController(evt);
	});

	ipcMain.on('window-h', (evt, arg) => {
		if(arg !== undefined && arg !== '') {
			mainWindow.setSize(300, parseInt(arg)); 
		}
	});
}

function hookCurrentControllerListeners(toggle) {
	/*if(toggle) {
		//run enable code
	} else {
		//run disable code
	}*/
	const options = {
		type: 'info',
		buttons: ['Ok'],
		title: 'Info!',
		message: 'This feature is coming soon!'
	};
	const response = dialog.showMessageBox(null, options, (resp) => {
		console.log(resp);
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