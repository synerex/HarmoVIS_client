const builder = require('electron-builder');

// we need to put synerex binaries (harmovis-layers, nodeserv, synerexserv into synerex dir)

builder.build({
    config: {
        'appId': 'net.synerex.HarmoVIS_client',
        'win':{
            'target': {
                'target': 'nsis',
                'arch': [
                    'x64',
                    'ia32',
                ]
            }
        },
        "extraFiles":[
            "synerex/",
            "mclient/build"
		]
    }
});
