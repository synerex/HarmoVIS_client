'use strict';
const path = require('path');
const { app, BrowserWindow, Menu, ipcMain } = require('electron');

/// const {autoUpdater} = require('electron-updater');
const { is } = require('electron-util');
const unhandled = require('electron-unhandled');
// electron preferences: https://github.com/tkambler/electron-preferences
//const ElectronPreferences = require('electron-preferences');
//const preferences = require('./preferences');

const debug = require('electron-debug');
const contextMenu = require('electron-context-menu');
const WindowStateKeeper = require('electron-window-state');
const FS = require("fs-extra");

const config = require('./config');
const menuConfig = require('./menu');
const packageJson  = require('./package.json');

const { spawn } = require('child_process')
const ipc = require('electron').ipcMain;

// for killing sub processes
const kill = require('tree-kill')


unhandled();
debug();
contextMenu();

/*
preferences.on('save', (preferences) => {
	console.log(`Preferences were saved.`, JSON.stringify(preferences, null, 4))
	
	preferences.value('mapbox_token');
});
*/

// Note: Must match `build.appId` in package.json
app.setAppUserModelId('net.synerex.HarmoWES_client');

// Uncomment this before publishing your first version.
// It's commented out as it throws an error if there are no published versions.
// if (!is.development) {
// 	const FOUR_HOURS = 1000 * 60 * 60 * 4;
// 	setInterval(() => {
// 		autoUpdater.checkForUpdates();
// 	}, FOUR_HOURS);
//
// 	autoUpdater.checkForUpdates();
// }

// Prevent window from being garbage collected
let mainWindow;

let harmovisWindow;

let controlVisible = true;

function sleep(time) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve();
		}, time);
	});
}

const createMainWindow = async () => {
	let configDir = path.join(app.getPath('appData'), 'HarmoWES_client');
	FS.existsSync(configDir) || FS.mkdirSync(configDir);

	let mainWindowState = WindowStateKeeper({
		defaultWidth: 800,
		defaultHeight: 900,
		path: configDir,
		file: 'window-state.json'
	});


	let options = {
		title: "Synerex+HarmoWES("+packageJson.version+")",
		x: mainWindowState.x,
		y: mainWindowState.y,
		width: mainWindowState.width,
		height: mainWindowState.height,
		minWidth: 400,
		minHeight: 300,
		//		icon: Path.join(__dirname, 'appicon.png'),
		webPreferences: {
			nodeIntegration: true
		},
		show: false
	};


	const win = new BrowserWindow(
		options
	);

	win.on('ready-to-show', () => {
		win.show();
	});

	win.on('closed', () => {
		// Dereference the window
		// For multiple windows store them in an array
		mainWindow = undefined;
	});

	await win.loadFile(path.join(__dirname, 'index.html'));

	mainWindowState.manage(win);

	return win;
};




let nodeServ = null
let sxServ = null
let harmoVIS = null
let prServ = null // for ProxyServer
let storeProc = null // channel_store
let playProc = null // channel_retrieve

let wesServ = null
let hsimServ = null
let simSpeed = 1

const setNodeCallBack = (proc) => {
	proc.stdout.on('data', (data) => {
//		console.log('stdout:' + data)
	})
	proc.stderr.on('data', (data) => {
//		console.log('stderr:' + data)
		try{
			mainWindow.webContents.send('nodelog', data)
		}catch{
			
		}
	})
	proc.on('close', (code) => {
//		console.log('nodeserv stopped:' + code)
		nodeServ = null
	})
}

const setCallBack = (proc, st, cmd) => {
	proc.stdout.on('data', (data) => {
//		console.log(st + ' stdout:' + data)
	})
	proc.stderr.on('data', (data) => {
//		console.log(st + ' stderr:' + data)
		if ( mainWindow != null) {
			mainWindow.webContents.send(cmd, data)
		}
	})
	proc.on('close', (code) => {
//		console.log(st + ' stopped:' + code)
	})
}

const setStdOutCallBack = (proc, st) => {
	proc.stdout.on('data', (data) => {
		console.log(st + ' stdout:' + data)
	})
	proc.stderr.on('data', (data) => {
		console.log(st + ' stderr:' + data)
	})
	proc.on('close', (code) => {
		console.log(st + ' stopped:' + code)
	})
}


const runNodeServ = () => {
	//	const args = []
//	const sxdir = config.get('SynerexDir');

//	let nodeName = sxdir+'\\nodeserv\\nodeserv.exe';
//	mainWindow.webContents.send('nodelog', 'exe is '+app.getPath('exe')+'\n')
//	mainWindow.webContents.send('nodelog', 'appData is '+app.getPath('appData'))
//	mainWindow.webContents.send('nodelog', 'module is '+app.getPath('module'))
	let exePath = path.dirname(app.getPath('exe'))
	let nodeName = path.join(exePath, '/synerex/nodeserv.exe')

	if (process.platform === 'darwin') {
		nodeName = path.join(exePath,'/../synerex/nodeserv');
	}

	if (nodeServ === null) {
		try {
			FS.statSync(nodeName);
			nodeServ = spawn(nodeName);
			mainWindow.webContents.send('nodeserv', '')
			setNodeCallBack(nodeServ)

		} catch (err) {
			mainWindow.webContents.send('nodeserv', '')
			mainWindow.webContents.send('nodelog', 'Cant open ' + nodeName)
		}

	} else { // already running.
		var r = kill(nodeServ.pid, 'SIGKILL', function (err) {
			console.log("Kill err", err)
		})
		//		const r = nodeServ.kill('SIGHUP'); // may killed!
		console.log("Kill Result", r)
		sleep(2000).then(() => {
			nodeServ = spawn(nodeName)
			mainWindow.webContents.send('nodeserv', '')
			setNodeCallBack(nodeServ)
		})
	}
}

const runSynerexServ = () => {
//	const sxdir = config.get('SynerexDir');
//	let sxName = sxdir+'\\server\\synerex-server.exe';
	let exePath = path.dirname(app.getPath('exe'))
	let sxName = path.join(exePath, '/synerex/synerex-server.exe')
	if (process.platform === 'darwin') {
		sxName = path.join(exePath, '/../synerex/synerex-server')
//		sxName = path.join(sxdir,'/server/synerex-server');
	}

	if (sxServ === null) {
		try {
			FS.statSync(sxName);
			sxServ = spawn(sxName)
			mainWindow.webContents.send('sxserv', '')
			setCallBack(sxServ, 'sx', 'sxlog')
		} catch (err) {
			mainWindow.webContents.send('sxserv', '')
			mainWindow.webContents.send('sxlog', 'Cant open ' + sxName)
		}
	} else {
		var r = kill(sxServ.pid, 'SIGKILL', function (err) {
			console.log("Kill err", err)
		})
		console.log("Kill Result", r)
		sleep(2000).then(() => {
			sxServ = spawn(sxName)
			mainWindow.webContents.send('sxserv', '')
			setCallBack(sxServ, 'sx', 'sxlog')
		})
	}
}


const runHarmoVIS = () => {
//	const sxdir = config.get('SynerexDir');
	let exePath = path.dirname(app.getPath('exe'))
	let hvName = path.join(exePath, '/synerex/harmovis-layers.exe')
	if (process.platform === 'darwin') {
		hvName = path.join(exePath, '/../synerex/harmovis-layers')
	}

	const mapbox_token = config.get('MAPBOX_ACCESS_TOKEN');
	if (harmoVIS === null) {
		try {
			FS.statSync(hvName);
			if (process.platform === 'darwin') {
				console.log("Yes darwin!")
				harmoVIS = spawn(hvName,["-assetdir", path.join(exePath, '../'),"-mapbox",mapbox_token])
			}else{
				console.log("no... "+process.platform)
				harmoVIS = spawn(hvName,["-mapbox",mapbox_token])
			}
			mainWindow.webContents.send('harmovis', '')
			setCallBack(harmoVIS, 'hv', 'hvlog')
		} catch (err) {
			mainWindow.webContents.send('harmovis', '')
			mainWindow.webContents.send('hvlog', 'Cant open ' + hvName)
		}
	} else {
		var r = kill(harmoVIS.pid, 'SIGKILL', function (err) {
			console.log("Kill err", err)
		})
		console.log("Kill Result", r)
		sleep(2000).then(() => {
			if (process.platform === 'darwin') {
				console.log("Yes darwin!")
				harmoVIS = spawn(hvName,["-assetdir", path.join(exePath, '../'),"-mapbox",mapbox_token])
			}else{
				console.log("no... "+process.platform)
				harmoVIS = spawn(hvName,["-mapbox",mapbox_token])
			}
			mainWindow.webContents.send('harmovis', '')
			setCallBack(harmoVIS, 'hv', 'hvlog')
		})
	}
}




const runProxy = () => {
	let exePath = path.dirname(app.getPath('exe'))
	let prName = path.join(exePath, '/synerex/proxy.exe')
	if (process.platform === 'darwin') {
		prName = path.join(exePath, '/../synerex/proxy')
	}
	
	if (prServ === null) {
		try {
			FS.statSync(prName);
			prServ = spawn(prName)
			mainWindow.webContents.send('prserv', '')
//				setCallBack(prServ, 'pr', 'sxlog')
			setCallBack(prServ, 'px', 'misclog')
//			setStdOutCallBack(prServ,'pr')
		} catch (err) {
//				mainWindow.webContents.send('sxserv', '')
//				mainWindow.webContents.send('sxlog', 'Cant open ' + sxName)
		}
	} else {
		var r = kill(prServ.pid, 'SIGKILL', function (err) {
			console.log("Kill err", err)
		})
		console.log("Kill Result", r)
		sleep(2000).then(() => {
			prServ = spawn(prName)
			setCallBack(prServ, 'px', 'misclog')
//			mainWindow.webContents.send('sxserv', '')
//			setStdOutCallBack(prServ,'pr')
//setCallBack(sxServ, 'sx', 'sxlog')
		})
	}
}


const runStoreMessage = () => {
	let exePath = path.dirname(app.getPath('exe'))
	let stName = path.join(exePath, '/synerex/channel_store.exe')
	if (process.platform === 'darwin') {
		stName = path.join(exePath, '/../synerex/channel_store')
	}
	
	if (storeProc === null) {
		try {
			FS.statSync(stName);
			storeProc = spawn(stName, ['-channel', '14', '-saveFile','saveMessage.csv'],{cwd:dirPath})	

			mainWindow.webContents.send('save', '')
			setCallBack(storeProc, 'sm', 'misclog')
		} catch (err) {
		}
	} else {
		var r = kill(storeProc.pid, 'SIGKILL', function (err) {
			console.log("Kill err", err)
		})
		console.log("Kill Result", r)
		sleep(2000).then(() => {
			storeProc = spawn(stName, ['-channel', '14', '-saveFile','saveMessage.csv'],{cwd:dirPath})	
			setCallBack(storeProc, 'sm', 'misclog')
		})
	}
}



ipc.on('start-nodeserv', () => {
	console.log("Start nodeserv from Browser");
	runNodeServ()
});

ipc.on('stop-nodeserv', () => {
	if (nodeServ === null) return;
	console.log("Stop nodeserv from Browser");
	try{
		mainWindow.webContents.send('nodelog', "Stopping nodeserv")
	}catch{
		
	}
	var r = kill(nodeServ.pid, 'SIGKILL', function (err) {
		console.log("Kill err", err)
	})
	try{
		mainWindow.webContents.send('nodelog', '..Stopped')
	}catch{
		
	}

});

ipc.on('stop-harmovis', () => {
	if (harmoVIS === null) return;
	try{
		mainWindow.webContents.send('hvlog', "Stopping HarmoVIS")
	}catch{}
	var r = kill(harmoVIS.pid, 'SIGKILL', function (err) {
		console.log("Kill err", err)
	})
	try{
		mainWindow.webContents.send('hvlog', "..Stopped")
	}catch{}
});
ipc.on('stop-sxserv', () => {
	if (sxServ === null) return;
	try{
		mainWindow.webContents.send('sxlog', "Stopping SxServer")
	}catch{}
	var r = kill(sxServ.pid, 'SIGKILL', function (err) {
		console.log("Kill err", err)
	})
	try{
		mainWindow.webContents.send('sxlog', "..Stopped")
	}catch{}
});
ipc.on('stop-prserv', () => {
	if (prServ === null) return;

	var r = kill(prServ.pid, 'SIGKILL', function (err) {
		console.log("Kill err", err)
	})
	prServ = null
});

ipc.on('start-sxserv', () => {
	console.log("Start Synerex Server from Browser");
	runSynerexServ()
});
ipc.on('start-harmovis', () => {
	console.log("Start Harmovis from Browser");
	runHarmoVIS()
});

ipc.on('start-prserv', () => {
	console.log("Start ProxyServer");
	runProxy()
});

ipc.on('start-browser', () => {
	console.log("Start Win from Browser");
	let options = {
		title: "Harmoware-VIS",
		x: 10,
		y: 10,
		width: 1024,
		height: 600,
		minWidth: 480,
		minHeight: 300,
		show: true
	};

	harmovisWindow = new BrowserWindow(
		options
	);
// リモートURLをロード
	harmovisWindow.loadURL('http://127.0.0.1:10080/')

});


ipc.on('start-save', () => {
	console.log("Start GeoChannelSave");
	runStoreMessage()
});

ipc.on('stop-save', () => {
	var r = kill(storeProc.pid, 'SIGKILL', function (err) {
		console.log("StoreProc ill err", err)
	})
	storeProc = null
});



ipc.on('do-higashiyama', () => {
	console.log("Start Hiigashiyama");
	let exePath = path.dirname(app.getPath('exe'))
	let dirPath = path.join(exePath, '/synerex/')
	let geoName = path.join(exePath, '/synerex/geo-provider.exe')
	if (process.platform === 'darwin') {
//		console.log("darwin;dir",dirPath)
//		mainWindow.webContents.send("misclog", "DirPath:"+dirPath)
//		mainWindow.webContents.send("misclog", "exePath:"+exePath)
		geoName = path.join(exePath, '/../synerex/geo-provider')
		dirPath = path.join(exePath, '/../synerex/')
//		FS.readdir(dirPath,(err,files)=>{
//			mainWindow.webContents.send("misclog", "FILES;"+files)
//			files.forEach(file =>{
//				mainWindow.webContents.send("misclog", "Fname:"+file)
//			})
//		})

	}
	
		const c1 = spawn(geoName, ['-geojson', 'higashiyama_facility.geojson', '-webmercator'],{cwd:dirPath})	
		setCallBack(c1, 'geoh1', 'misclog')
		sleep(1000).then(() => {
			const c2 = spawn(geoName, ['-lines', 'higashiyama_line.geojson', '-webmercator'],{cwd:dirPath})
			setCallBack(c2, 'geoh2', 'misclog')
			sleep(500).then(()=>{
				const c3 = spawn(geoName, ['-viewState', '35.15596582695651,136.9783370942177,16'],{cwd:dirPath})
				setCallBack(c3, 'geoh3', 'misclog')
			})
		})
	

});


ipc.on('do-centrair', () => {
	console.log("Start Hiigashiyama");
	let exePath = path.dirname(app.getPath('exe'))
	let dirPath = path.join(exePath, '/synerex/')
	let geoName = path.join(exePath, '/synerex/geo-provider.exe')
	if (process.platform === 'darwin') {
		dirPath = path.join(exePath, '/../synerex/')
		geoName = path.join(exePath, '/../synerex/geo-provider')
	}
	const c2 = spawn(geoName, ['-lines', 'accessPlaza.geojson', '-webmercator'],{cwd:dirPath})
	setCallBack(c2, 'geoc2', 'misclog')
	sleep(500).then(() => {
		const c1 = spawn(geoName, ['-geojson', '2-wall.geojson', '-webmercator'],{cwd:dirPath})	
		setCallBack(c1, 'geoc1', 'misclog')
		sleep(1000).then(()=>{
			const c3 = spawn(geoName, ['-viewState', '34.8592285,136.8163486,17'],{cwd:dirPath})
			setCallBack(c3, 'geoc3', 'misclog')
		})
	})

});


ipc.on('do-simulation', () => {
	console.log("Start Higashiyama Simulation");
	if (playProc != null) {
		var r = kill(playProc.pid, 'SIGKILL', function (err) {
			console.log("PlayProc kill err", err)
		})
		playProc = null
	}
	let exePath = path.dirname(app.getPath('exe'))
	let dirPath = path.join(exePath, '/synerex/')
	let rtName = path.join(exePath, '/synerex/channel_retrieve.exe')
	if (process.platform === 'darwin') {
		rtName = path.join(exePath, '/../synerex/channel_retrieve')
		dirPath = path.join(exePath, '/../synerex/')

	}
	playProc = spawn(rtName, ['-sendfile', 'higashi-sim.csv', '-channel','13','-speed','1.2'],{cwd:dirPath})
	setCallBack(playProc, 'pm', 'misclog')
	
});

ipc.on('do-covid19', () => {
	console.log("Start Aichi-Covid19 visualization");
	if (playProc != null) {
		var r = kill(playProc.pid, 'SIGKILL', function (err) {
			console.log("PlayProc kill err", err)
		})
		playProc = null
	}
	let exePath = path.dirname(app.getPath('exe'))
	let dirPath = path.join(exePath, '/synerex/')
	let rtName = path.join(exePath, '/synerex/channel_retrieve.exe')
	if (process.platform === 'darwin') {
		rtName = path.join(exePath, '/../synerex/channel_retrieve')
		dirPath = path.join(exePath, '/../synerex/')

	}
	playProc = spawn(rtName, ['-sendfile', 'aichi-covid-19.csv', '-channel','14','-speed','1.2'],{cwd:dirPath})
	setCallBack(playProc, 'pm', 'misclog')
	
});


ipc.on('do-meshdemo', () => {
	console.log("Start Mesh-Demo visualization");
	if (playProc != null) {
		var r = kill(playProc.pid, 'SIGKILL', function (err) {
			console.log("PlayProc kill err", err)
		})
		playProc = null
	}
	let exePath = path.dirname(app.getPath('exe'))
	let dirPath = path.join(exePath, '/synerex/')
	let rtName = path.join(exePath, '/synerex/channel_retrieve.exe')
	if (process.platform === 'darwin') {
		rtName = path.join(exePath, '/../synerex/channel_retrieve')
		dirPath = path.join(exePath, '/../synerex/')

	}
	playProc = spawn(rtName, ['-sendfile', 'meshDemo.csv', '-channel','14','-speed','-450'],{cwd:dirPath})
	setCallBack(playProc, 'pm', 'misclog')
	
});



ipc.on('do-tgcontrol', () => {
	console.log("Toggle control visibile");
	let exePath = path.dirname(app.getPath('exe'))
	let dirPath = path.join(exePath, '/synerex/')
	let geoName = path.join(exePath, '/synerex/geo-provider.exe')
	if (process.platform === 'darwin') {
		dirPath = path.join(exePath, '/../synerex/')
		geoName = path.join(exePath, '/../synerex/geo-provider')
	}
	if (controlVisible){
		playProc = spawn(geoName, ['-harmovis', '{\"controlVisible\":false}'],{cwd:dirPath})
		controlVisible = false;
	}else{
		playProc = spawn(geoName, ['-harmovis', '{\"controlVisible\":true}'],{cwd:dirPath})
		controlVisible = true;
	}
	setCallBack(playProc, 'pm', 'misclog')	
});



const runWES = () => {
		let exePath = path.dirname(app.getPath('exe'))
		let dirPath = path.join(exePath, '/synerex/')
		let sxName = path.join(exePath, '/synerex/wes.exe')
		if (process.platform === 'darwin') {
			dirPath = path.join(exePath, '/../synerex/')
			sxName = path.join(exePath, '/../synerex/wes')
		}
	
		if (wesServ === null) {
			try {
				FS.statSync(sxName);
				wesServ = spawn(sxName,['-locmap','location_list.csv'],{cwd:dirPath})
				setCallBack(wesServ, 'pm', 'misclog')
			} catch (err) {
				mainWindow.webContents.send('misclog', '')
				mainWindow.webContents.send('misclog', 'Cant open ' + sxName)
			}
		} else {
			var r = kill(wesServ.pid, 'SIGKILL', function (err) {
				console.log("Kill err", err)
			})
			console.log("Kill Result", r)
			sleep(2000).then(() => {
				wesServ = spawn(sxName,['-locmap','location_list.csv'],{cwd:dirPath})
				setCallBack(wesServ, 'pm', 'misclog')
			})
		}
}

const runHSIM = () => {
		let exePath = path.dirname(app.getPath('exe'))
		let dirPath = path.join(exePath, '/synerex/')
		let sxName = path.join(exePath, '/synerex/hsim.exe')
		if (process.platform === 'darwin') {
			dirPath = path.join(exePath, '/../synerex/')
			sxName = path.join(exePath, '/../synerex/hsim')
		}
	
		if (hsimServ === null) {
			try {
				FS.statSync(sxName);
				hsimServ = spawn(sxName,['-locmap','location_list.csv'],{cwd:dirPath})
				setCallBack(hsimServ, 'pm', 'misclog')
			} catch (err) {
				mainWindow.webContents.send('misclog', '')
				mainWindow.webContents.send('misclog', 'Cant open ' + sxName)
			}
		} else {
			var r = kill(hsimServ.pid, 'SIGKILL', function (err) {
				console.log("Kill err", err)
			})
			console.log("Kill Result", r)
			sleep(2000).then(() => {
				hsimServ = spawn(sxName,['-locmap','location_list.csv'],{cwd:dirPath})
				setCallBack(hsimServ, 'pm', 'misclog')
			})
		}
}
	

ipc.on('do-set_state', () => {
	console.log("Set CLI set_state");
	let exePath = path.dirname(app.getPath('exe'))
	let dirPath = path.join(exePath, '/synerex/')
	let geoName = path.join(exePath, '/synerex/cli.exe')
	if (process.platform === 'darwin') {
		dirPath = path.join(exePath, '/../synerex/')
		geoName = path.join(exePath, '/../synerex/cli')
	}
	runHSIM()
	runWES()

	sleep(1000).then(() => {
		playProc = spawn(geoName, ['-setState', 'setState_wms.txt'],{cwd:dirPath})
		setCallBack(playProc, 'pm', 'misclog')	
	})


	
});

ipc.on('do-run_sim', () => {
	console.log("Set CLI run_sim");
	let exePath = path.dirname(app.getPath('exe'))
	let dirPath = path.join(exePath, '/synerex/')
	let geoName = path.join(exePath, '/synerex/cli.exe')
	if (process.platform === 'darwin') {
		dirPath = path.join(exePath, '/../synerex/')
		geoName = path.join(exePath, '/../synerex/cli')
	}

	playProc = spawn(geoName, ['-wmsCsv', 'wms_order.csv'],{cwd:dirPath})
	setCallBack(playProc, 'pm', 'misclog')		
});

ipc.on('do-speed_up', () => {
	console.log("Set CLI speed_up");
	let exePath = path.dirname(app.getPath('exe'))
	let dirPath = path.join(exePath, '/synerex/')
	let geoName = path.join(exePath, '/synerex/cli.exe')
	if (process.platform === 'darwin') {
		dirPath = path.join(exePath, '/../synerex/')
		geoName = path.join(exePath, '/../synerex/cli')
	}
	simSpeed = simSpeed + 2
	playProc = spawn(geoName, ['-speed', String(simSpeed)])
	setCallBack(playProc, 'pm', 'misclog')		
});

ipc.on('do-speed_down', () => {
	console.log("Set CLI ssliw");
	let exePath = path.dirname(app.getPath('exe'))
	let dirPath = path.join(exePath, '/synerex/')
	let cliName = path.join(exePath, '/synerex/cli.exe')
	if (process.platform === 'darwin') {
		dirPath = path.join(exePath, '/../synerex/')
		cliName = path.join(exePath, '/../synerex/cli')
	}
	simSpeed = simSpeed - 2
	if (simSpeed == 0) simSpeed = 1;
	playProc = spawn(cliName, ['-speed', String(simSpeed)])
	setCallBack(playProc, 'pm', 'misclog')		
});




ipc.on('do-playMessage', () => {
	console.log("Start Play Messages");
	if (playProc != null) {
		var r = kill(playProc.pid, 'SIGKILL', function (err) {
			console.log("PlayProc kill err", err)
		})
		playProc = null
	}
	let exePath = path.dirname(app.getPath('exe'))
	let dirPath = path.join(exePath, '/synerex/')
	let rtName = path.join(exePath, '/synerex/channel_retrieve.exe')
	if (process.platform === 'darwin') {
		rtName = path.join(exePath, '/../synerex/channel_retrieve')
	}
	playProc = spawn(rtName, ['-sendfile', 'saveMessage.csv', '-channel','14','-speed','1.2'],{cwd:dirPath})
	setCallBack(playProc, 'pm', 'misclog')
	
});


ipc.on("mapbox-token", (event, d) => {
	console.log("Now Get mapbox:",d)
	config.set('MAPBOX_ACCESS_TOKEN',d);
	// if first assign, start servers
	if (d.length > 80 && nodeServ === null){
		doServers()
	}
});




// Prevent multiple instances of the app
if (!app.requestSingleInstanceLock()) {
	app.quit();
}

app.on('second-instance', () => {
	if (mainWindow) {
		if (mainWindow.isMinimized()) {
			mainWindow.restore();
		}

		mainWindow.show();
	}
});

app.on('window-all-closed', () => {
	if (!is.macos) {
		app.quit();
	}
});

app.on('activate', async () => {
	if (!mainWindow) {
		mainWindow = await createMainWindow();
	}
});

const doServers = () => {
	runNodeServ()
	// we need small wait for running up NodeServ
	sleep(1000).then(() => {
			runSynerexServ()
			sleep(1000).then(() => {
//				runHarmoVIS()
				sleep(500).then(() => {
					runProxy()
				})
		})
	})
};



(async () => {
	await app.whenReady();
	Menu.setApplicationMenu(menuConfig.menu);
//	menuConfig.set_pref_object(
//		preferences
//	)
	mainWindow = await createMainWindow();
	menuConfig.set_mainwindow(mainWindow);
	if (!config.has("MAPBOX_ACCESS_TOKEN")){
		config.set("MAPBOX_ACCESS_TOKEN", 'please set mapbox_access_token here')
	}
	mainWindow.webContents.send('started', '')

	const token = config.get("MAPBOX_ACCESS_TOKEN")
	mainWindow.webContents.send("set-mapbox-token", token)
//	if (token.length < 80 ){ // token is not set!
//		mainWindow.webContents.send("mapbox-dialog","")
//	}else{//
		doServers();
//	}

})();
