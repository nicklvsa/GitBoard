const prompt = require('electron-prompt');
const {exec} = require('child_process');
const {dialog} = require('electron');

module.exports.gitPull = (path, window, args) => {
    const cmd = `cd ${path} && git pull`;
    exec(cmd, (err, stdout, stderr) => {
        dialog.showMessageBox(window, {
            message: `Info: \n${stderr}\n ${stdout}`
        });
    });
};

module.exports.gitPush = (path, window, args) => {
    const cmd = `cd ${path} && git push`;
    exec(cmd, (err, stdout, stderr) => {
        dialog.showMessageBox(window, {
            message: `Info: \n${stderr}\n ${stdout}`
        });
    });
};

module.exports.gitCheckout = (path, window, args) => {
    prompt({
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
    })
};

module.exports.gitCommit = (path, window, args) => {
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
    const cmd = `cd ${path} && git help`;
    exec(cmd, (err, stdout, stderr) => {
        dialog.showMessageBox(window, {
            message: `Help: \n${stderr}\n ${stdout}`
        });
    });
};