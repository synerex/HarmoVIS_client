'use strict';
const Store = require('electron-store');

module.exports = new Store({
	defaults: {
		MAPBOX_ACCESS_TOKEN : 'please set mapbox_access_token here'
	}
});
