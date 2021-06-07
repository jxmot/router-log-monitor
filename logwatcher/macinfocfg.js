// macinfocfg.js - configuration for MAC manufacturer 
// look ups.
// 
// NOTE: You will need to get your own API key, place 
// in a file - ./keys/_maclookupapp.key
// 
module.exports = {
    // https://maclookup.app/
    hostname: 'api.maclookup.app',
    // for developer refernce, as named on maclookup.app
    apikeyName: 'rlmonitor',
    // API key
    apikey: `${require('fs').readFileSync('./keys/_maclookupapp.key')}`,
    // part of the URL
    urlparts : [
        '/v2/macs/',
        '?apiKey='
    ],
    // Let's be "nice"...
    useragent: 'rlmonitor application https://github.com/jxmot/router-log-monitor',
    headeraccept: 'application/json',
    // save when the API returns?
    savemac: true
};

