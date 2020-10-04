const prompt = require('electron-prompt');
const {exec} = require('child_process');
const path = require('path');
const {dialog, BrowserWindow, ipcMain} = require('electron');

const gitWindowOptions = {
    width: 300,
	minWidth: 300,
	maxWidth: 800,
	height: 250,
	minHeight: 460,
	maxHeight: 800,
	title: 'GitBoard Selector',
	alwaysOnTop: true,
	webPreferences: {
		nodeIntegration: true,
		backgroundThrottling: false,
	}
};

let pubCheckoutWindow = null;
let pubPath = '';

const createCheckoutWindow = () => {
    const checkoutWindow = new BrowserWindow(gitWindowOptions);
    checkoutWindow.loadURL(path.join('file://', __dirname, 'git_checkout.html'));
    checkoutWindow.setMenu(null);
    checkoutWindow.setResizable(false);

    if(process.platform === 'win32') {
        let size = checkoutWindow.getSize();
        checkoutWindow.setSize(size[0], parseInt(size[0] * 9 / 16));
    }

    return checkoutWindow;
};

ipcMain.on('use-branch', (evt, arg) => {
    if (arg !== '' && arg !== null) {
        const cmd = `cd ${pubPath} && git checkout ${arg}`;
        exec(cmd, (err, stdout, stderr) => {
            dialog.showMessageBox(pubCheckoutWindow, {
                message: `Info: ${stderr}\n ${stdout}`
            });
        });
        pubCheckoutWindow.hide();
    }
});

ipcMain.on('get-branches', (evt, arg) => {
    const cmd = `cd ${pubPath} && git branch`;
    exec(cmd, (err, stdout, stderr) => {
        if (!err && !stderr) {
            evt.reply('branches-list', stdout);
        }
    });
});

module.exports.gitPull = (path, window, args) => {
    pubPath = path;
    const cmd = `cd ${path} && git pull`;
    exec(cmd, (err, stdout, stderr) => {
        dialog.showMessageBox(window, {
            message: `Info: \n${stderr}\n ${stdout}`
        });
    });
};

module.exports.gitPush = (path, window, args) => {
    pubPath = path;
    const cmd = `cd ${path} && git push`;
    exec(cmd, (err, stdout, stderr) => {
        dialog.showMessageBox(window, {
            message: `Info: \n${stderr}\n ${stdout}`
        });
    });
};

module.exports.gitCheckout = (path, window, args) => {
    pubPath = path;
    pubCheckoutWindow = createCheckoutWindow();
    
    /*prompt({
        title: 'Branch name',
        label: 'Enter branch to switch to: ',
        type: 'input',
        alwaysOnTop: true,
    }).then((resp) => {
        if (resp !==  null) {
            const cmd = `cd ${path} && git checkout ${resp}`;
            exec(cmd, (err, stdout, stderr) => {
                dialog.showMessageBox(window, {
                    message: `Info: ${stderr}\n ${stdout}`
                });
            });
        }
    }).catch((err) => {
        dialog.showErrorBox('An error occurred!', err);
    });*/
};

module.exports.gitCommit = (path, window, args) => {
    pubPath = path;
    prompt({
        title: 'Commit message',
        label: 'Enter commit message: ',
        type: 'input',
        alwaysOnTop: true,
    }).then((resp) => {
        if (resp !==  null) {
            const cmd = `cd ${path} && git add . && git commit -m "${resp}"`;
            exec(cmd, (err, stdout, stderr) => {
                dialog.showMessageBox(window, {
                    type: 'question',
                    message: 'Would you like to push these changes?',
                    buttons: [
                        'Push changes!', 'No, just commit.' //0, 1
                    ]
                }, (clicked) => {
                    switch (clicked) {
                        case 0:
                            exports.gitPush(path, window, null);
                            break;
                        case 1:
                            dialog.showMessageBox(window, {
                                message: `Info: ${stderr}\n ${stdout}`
                            });
                            break;
                        default:
                            dialog.showMessageBox(window, {
                                message: `Info: ${stderr}\n ${stdout}`
                            });
                            break;
                    }
                });
            });
        }
    });
};

module.exports.gitHelp = (path, window, args) => {
    pubPath = path;
    const cmd = `cd ${path} && git help`;
    exec(cmd, (err, stdout, stderr) => {
        dialog.showMessageBox(window, {
            message: `Help: \n${stderr}\n ${stdout}`
        });
    });
};