const {app, Tray, BrowserWindow, ipcMain, Menu, dialog} = require('electron');
const {openStreamDeck, listStreamDecks} = require('elgato-stream-deck');
const {genText} = require('./textgen');
const {v1: uuid} = require('uuid');
const path = require('path');
const os = require('os');
const fs = require('fs');

let appIcon = null;
let mainWindow = null;
let runtimeModifiedKeys = [];
let gitboardIcon = path.join(__dirname, 'assets/general/gitboard.png');

const controller = openStreamDeck();
const loadedProjects = [];

const errOpts = {
	type: 'error',
	buttons: ['Ok'],
	title: '!',
	message: ''
};
const defaultConfigOpts = {
	name: '',
	id: '',
	selected: false
};

if(process.mas) app.setName("GitBoard");

function init() {

	makeSingleInstance();
	handleEvents();

	function createWindow() {

		appIcon = new Tray(gitboardIcon);

		const options = {
			width: 300,
			minWidth: 300,
			maxWidth: 800,
			height: 460,
			minHeight: 460,
			maxHeight: 800,
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
						label: 'Control Another Project', click: () => {
							beginProjectSelection(null);
						}
					}
				]
			}
		]);

		appIcon.setToolTip('GitBoard Area');
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
			/*
				- GitBoard will only support one Stream Deck -
				TODO: use Stream Deck serial identificaiton to check click
				events from each individual stream deck
			*/
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

function destroyController() {
	clearKeys();
	app.relaunch();
	app.exit();
}

function handleEvents() {
	ipcMain.on('quit-button', (evt, arg) => {
		exitApp();
	});

	ipcMain.on('start-button', (evt, arg) => {
		beginProjectSelection(evt);
	});

	ipcMain.on('cancel-button', (evt, arg) => {
		destroyController();
	});

	ipcMain.on('window-h', (evt, arg) => {
		if(arg !== undefined && arg !== '') {
			mainWindow.setSize(300, parseInt(arg)); 
		}
	});
}

function beginProjectSelection(evt) {
	const selectedFolders = dialog.showOpenDialog(mainWindow, {
		title: 'Select a project using GIT!',
		properties: ['openDirectory']
	});
	if(selectedFolders !== null && selectedFolders !== '' && selectedFolders !== undefined) {
		const gitFolder = selectedFolders[0];
		fs.exists(gitFolder + path.sep + '.git', (gitExists) => {
			if (gitExists) {
				gitBoardCfgPath = gitFolder + path.sep + 'gitboard.json';
				defaultConfigOpts.name = gitFolder.substring(gitFolder.lastIndexOf(path.sep) + 1);
				defaultConfigOpts.id = genProjectIdentifier();
				defaultConfigOpts.selected = false;
				const content = JSON.stringify(defaultConfigOpts);
				fs.exists(gitBoardCfgPath, (cfgExists) => {
					if(!cfgExists) {
						fs.writeFile(gitBoardCfgPath, content, (err) => {
							if(err) {
								errOpts.message = 'Could not write the GitBoard config file to your project!';
								dialog.showMessageBox(mainWindow, errOpts);
							} else {
								const parsed = JSON.parse(content);
								loadedProjects.push(parsed)
								if(evt !== null) setupController(evt);
								setupProjects();
							}
						});
					} else {
						fs.readFile(gitBoardCfgPath, (err, data) => {
							if(err) {
								errOpts.message = 'Could not load the GitBoard config file from your project!';
								dialog.showMessageBox(mainWindow, errOpts);
							} else {
								const parsed = JSON.parse(data);
								loadedProjects.push(parsed)
								if(evt !== null) setupController(evt);
								setupProjects();
							}
						});
					}
				});
			} else {
				errOpts.message = 'The folder you selected is not a valid GIT project!';
				dialog.showMessageBox(mainWindow, errOpts, (resp) => {
					console.log(resp);
				});
			}
		});
	} else {
		errOpts.message = 'Please select a git project to continue!';
		dialog.showMessageBox(mainWindow, errOpts, (resp) => {
			console.log(resp);
		});
	}
}

function genProjectIdentifier() {
	return '$' + uuid();
}

function setupProjects() {
	/*for(let project of loadedProjects) {
		const chunkLine = project.name.match(/.{1,8}/g);
		genText(chunkLine.join('\n'), 8, controller);
	}*/
	if (loadedProjects.length > 0) {
		const current = loadedProjects[0];
		genText(`Push`, 5, controller);
		genText(`Pull`, 6, controller);
		genText(`Commit`, 7, controller);
		genText(`Checkout`, 8, controller);
		genText(`Help`, 9, controller);
	}
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

function clearKeys() {
	if(runtimeModifiedKeys !== undefined && runtimeModifiedKeys.length !== 0) {
		for(var i = 0; i < runtimeModifiedKeys.length; i++) {
			controller.clearKey(runtimeModifiedKeys[i]);
		}
	}
}

function exitApp() {
	clearKeys();
	app.quit();
}

init();