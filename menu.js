'use strict';
const path = require('path');
const {app, Menu, shell} = require('electron');


const {
	is,
	appMenu,
	aboutMenuItem,
	openUrlMenuItem,
	openNewGitHubIssue,
	debugInfo
} = require('electron-util');

const config = require('./config');

let mainWindow;

exports.set_mainwindow = (obj)=>{
//	console.log("set mainWindow:",obj);
	mainWindow = obj;
}

const showPreferences = () => {
	// Show the app's preferences here
//	console.log("Preferences Obj:",pref_object);
	mainWindow.webContents.send('mapbox-dialog',"")
};


const helpSubmenu = [
	openUrlMenuItem({
		label: 'Website',
		url: 'https://synerex.net/'
	}),
	openUrlMenuItem({
		label: 'GitHub Code',
		url: 'https://github.com/synerex/HarmoVIS_client'
	}),
	{
		label: 'Input Mapbox Token',
		click() {
			// config.openInEditor()  // error in electron 9.0
//			console.log("send mapbox-dialog");
			mainWindow.webContents.send('mapbox-dialog',"");
		}
	},
	{
		label: 'Open Config.json',
		click() {
			shell.openPath(	config.path) 
			// config.openInEditor()  // error in electron 9.0
		}
	},
	{
		label: 'Show Config Dir',
		click() {
			shell.openPath(app.getPath('userData'));
		}
	},

	{
		label: 'Report an Issue…',
		click() {
			const body = `
<!-- Please succinctly describe your issue and steps to reproduce it. -->


---

${debugInfo()}`;

			openNewGitHubIssue({
				user: 'synerex',
				repo: 'HarmoVIS_client',
				body
			});
		}
	}
];


if (!is.macos) {
	helpSubmenu.push(
		{
			type: 'separator'
		},
		aboutMenuItem({
			icon: path.join(__dirname, 'static', 'icon.png'),
			text: 'Created by Nobuo Kawaguchi'
		})
	);
}

const debugSubmenu = [
	{
		label: 'Show Settings',
		click() {
			config.openInEditor();
		}
	},
	{
		label: 'Show App Data',
		click() {
			shell.openItem(app.getPath('userData'));
		}
	},
	{
		type: 'separator'
	},
	{
		label: 'Delete Settings',
		click() {
			config.clear();
			app.relaunch();
			app.quit();
		}
	},
	{
		label: 'Delete App Data',
		click() {
			shell.moveItemToTrash(app.getPath('userData'));
			app.relaunch();
			app.quit();
		}
	}
];

const macosTemplate = [
	appMenu([
		{
			label: 'Preferences…',
			accelerator: 'Command+,',
			click() {
				showPreferences();
			}
		}
	]),
	{
		role: 'fileMenu',
		submenu: [
			{
				label: 'Custom'
			},
			{
				type: 'separator'
			},
			{
				role: 'close'
			}
		]
	},
	{
		role: 'editMenu'
	},
	{
		role: 'viewMenu'
	},
	{
		role: 'windowMenu'
	},
	{
		role: 'help',
		submenu: helpSubmenu
	}
];

// Linux and Windows
const otherTemplate = [
	{
		role: 'fileMenu',
		submenu: [
			{
				label: 'Custom'
			},
//			{
//				label: 'NodeServ',
//				click(){
//					console.log("NodeServ!");//
//					runNodeServ()
//				}
//			},
			{
				type: 'separator'
			},
			{
				label: 'Settings',
				accelerator: 'Control+,',
				click() {
					showPreferences();
				}
			},
			{
				type: 'separator'
			},
			{
				role: 'quit'
			}
		]
	},
	{
		role: 'editMenu'
	},
	{
		role: 'viewMenu'
	},
	{
		role: 'help',
		submenu: helpSubmenu
	}
];

const template = process.platform === 'darwin' ? macosTemplate : otherTemplate;

if (is.development) {
	template.push({
		label: 'Debug',
		submenu: debugSubmenu
	});
}

exports.menu = Menu.buildFromTemplate(template);
