// options and settings for logwatch.js and logread.js
module.exports = {
    path : './../logoutput/',
    // log file names are: YYYYMMDD-HHMMSS-net.log
    nameregexp: /^\d{8}-\d{6}-net\.log/g,
    movebad : true,
    mintstamp: 1523771032000,
    delbad: true,
    // used in logread.js, readdel has 
    // priority over readmov and readren,
    // and readmov has priority over readren
    readdel: false,
    readmov: true,
    // NOTE: this is realative to "path", so things
    // like "../folder/" will work. If the path does
    // not exist it will be created. This will be
    // added to 'path'.
    movpath: 'oldlogs/',
    // rename the file(s), renchar can be a string
    // instead of a single character. 
    readren: false,
    renchar: '_',
    // only used in logread.js
    readexit: true
};
