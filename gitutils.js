const prompt = require('electron-prompt');
const {exec} = require('child_process');
const path = require('path');
const {dialog, BrowserWindow, ipcMain} = require('electron');

// global children window options
const gitWindowOptions = {
    width: 300,
	minWidth: 300,
	maxWidth: 800,
	height: 325,
	minHeight: 460,
	maxHeight: 800,
	title: 'GitBoard Selector',
	alwaysOnTop: true,
	webPreferences: {
		nodeIntegration: true,
		backgroundThrottling: false,
	}
};

let pubMergeWindow = null;
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

const createMergeWindow = () => {
    const mergeWindow = new BrowserWindow(gitWindowOptions);
    mergeWindow.loadURL(path.join('file://', __dirname, 'git_merge.html'));
    mergeWindow.setMenu(null);
    mergeWindow.setResizable(false);

    if(process.platform === 'win32') {
        let size = mergeWindow.getSize();
        mergeWindow.setSize(size[0], parseInt(size[0] * 9 / 16));
    }

    return mergeWindow;
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

ipcMain.on('merge-branch', (evt, arg) => {
    if (arg !== '' && arg !== null) {
        const cmd = `cd ${pubPath} && git merge ${arg}`;
        exec(cmd, (err, stdout, stderr) => {
            dialog.showMessageBox(pubMergeWindow, {
                message: `Info: ${stderr}\n ${stdout}`
            });
        });
        pubMergeWindow.hide();
    }
});

ipcMain.on('delete-branch', (evt, arg) => {
    if (arg !== '' && arg !== null) {
        dialog.showMessageBox(pubCheckoutWindow, {
            title: "Delete Branch",
            message: `Are you sure you want to delete branch "${arg}"?`,
            buttons: ["Yes", "No"],
        }, (response) => {
            if (response === 0) {
                const cmd = `cd ${pubPath} && git branch -d ${arg}`;
                exec(cmd, (err, stdout, stderr) => {
                    dialog.showMessageBox(pubCheckoutWindow, {
                        message: `Info: \n${stderr}\n ${stdout}`
                    });
                });
                pubCheckoutWindow.hide();
            }
        });
    }
});

ipcMain.on('new-branch', (evt, arg) => {
    if (arg !== '' && arg !== null) {
        prompt({
            title: 'Branch name',
            label: 'Enter new branch name: ',
            type: 'input',
            alwaysOnTop: true,
        }).then((resp) => {
            if (resp !== '' && resp !== null) {
                resp = resp.replace(/ /g, '_');
                const cmd = `cd ${pubPath} && git checkout -b ${resp}`;
                exec(cmd, (err, stdout, stderr) => {
                    dialog.showMessageBox(pubCheckoutWindow, {
                        message: `Info: ${stderr}\n ${stdout}`,
                    });
                });
                pubCheckoutWindow.hide();
            } else {
                dialog.showMessageBox(pubCheckoutWindow, {
                    message: `Please enter a branch name first!`,
                    buttons: ['Ok'],
                });
            }
        }).catch((err) => {
            console.error(err);
        });
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
    dialog.showMessageBox(window, {
        title: "Push Changes",
        message: "Before pushing, ensure you have committed your changes!\nWould you like to continue?",
        buttons: ["Yes", "No"],
    }, (response) => {
        if (response === 0) {
            const cmd = `cd ${path} && git push`;
            exec(cmd, (err, stdout, stderr) => {
                dialog.showMessageBox(window, {
                    message: `Info: \n${stderr}\n ${stdout}`
                });
            });
        }
    });
};

module.exports.gitCheckout = (path, window, args) => {
    pubPath = path;
    pubCheckoutWindow = createCheckoutWindow();
};

module.exports.gitStatus = (path, window, args) => {
    pubPath = path; 
    const cmd = `cd ${path} && git status`;
    exec(cmd, (err, stdout, stderr) => {
        dialog.showMessageBox(window, {
            message: `Info: ${stderr}\n ${stdout}`
        });
    });
};

module.exports.gitLog = (path, window, args) => {
    pubPath = path; 
    const cmd = `cd ${path} && git log`;
    exec(cmd, (err, stdout, stderr) => {
        dialog.showMessageBox(window, {
            message: `Info: ${stderr}\n ${stdout}`
        });
    });
};

module.exports.gitDiff = (path, window, args) => {
    pubPath = path;
    const cmd = `cd ${path} && git diff`;
    exec(cmd, (err, stdout, stderr) => {
        dialog.showMessageBox(window, {
            message: `Info: ${(stderr !== null && stderr !== '') ? stderr : 'No diff'}\n ${stdout}`
        });
    });
};

module.exports.gitMerge = (path, window, args) => {
    pubPath = path;
    pubMergeWindow = createMergeWindow();
};

module.exports.gitCommit = (path, window, args) => {
    pubPath = path;
    prompt({
        title: 'Commit message',
        label: 'Enter commit message: ',
        type: 'input',
        alwaysOnTop: true,
    }).then((resp) => {
        if (resp !== '' && resp !== null) {
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
                                message: `Info: ${stderr}\n ${stdout}`,
                            });
                            break;
                        default:
                            dialog.showMessageBox(window, {
                                message: `Info: ${stderr}\n ${stdout}`,
                            });
                            break;
                    }
                });
            });
        } else {
            dialog.showMessageBox(window, {
                message: `Please enter a commit message first!`,
                buttons: ['Ok'],
            });
        }
    }).catch((err) => {
        console.error(err);
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