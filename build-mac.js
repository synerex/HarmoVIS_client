const builder = require('electron-builder');

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
        }
    }
});
