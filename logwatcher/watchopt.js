// options and settings for logwatch.js
module.exports = {
    path : './../logoutput/',
    movebad : true,
    mintstamp: 1523771032000,
    delbad: true,
    // used in logread.js, readdel has 
    // priority over readren
    readdel: false,
    readren: true,
    readexit: true
};
