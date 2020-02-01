const builder = require('electron-builder');

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
