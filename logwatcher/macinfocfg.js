// _macinfocfg.js
module.exports = {
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

