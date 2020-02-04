const builder = require('electron-builder');
// check there is synerex dir and
//   there is binary file
//     nodeserv
//     synerex-server
//     harmovis-layers

const fs = require('fs')

if (!(fs.existsSync('synerex/nodeserv') && 
     fs.existsSync('synerex/synerex-server') &&
     fs.existsSync('synerex/harmovis-layers'))) {
	console.log("You should put binaries into synerex dir")
	process.exit(-1)
}


builder.build({
    config: {
        'appId': 'net.synerex.client',
        'mac':{
            'target': {
                'target': 'dmg',
                'arch': [
                    'x64',
                ]
            }
        },
        "extraFiles":[
            "synerex/",
            "mclient/build"
		]
    }
});
