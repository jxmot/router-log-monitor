'use strict';
/*
*/
module.exports = (function(_tname, _rdata, _pevts, _log)  {

    const tablename = _tname;
    const reportdefs = require('./reportdefs.js');

    const rdata = JSON.parse(JSON.stringify(_rdata));
    const pevts = _pevts;

    // disable(mute) some log() calls
    const logmute = false;
    // enable/disable all logging in this module
    const logenable = true;
    // set up run-time logging
    const scriptName = require('path').basename(__filename);
    function log(payload) {
        if(logenable) _log(`${scriptName} - ${payload}`);
    };

    let reptablegen = {
    };

    const createTable = (head, body) => `
<div id="${tablename}" class="table-responsive">
 <table class="table table-striped table-sm table-borderless">
${head}${body}
 </table>
</div>
`;

    function createHead() {

        const thcols = reportdefs.rdefs[tablename].th;
        let th = '  <thead>\n    <tr>\n';

        Object.keys(thcols).forEach(function (colh) {
            if(thcols[colh] !== '') {
                th = th + `      <th>${thcols[colh]}</th>\n`;
            }
        });
        th = th + '    </tr>\n  </thead>\n';

        return th;
    };

    function createBody(data) {
        const thcols = reportdefs.rdefs[tablename].th;
        let tb = '  <tbody>\n';
        let tr = '';

        data.forEach((row, idx) => {
            tr = tr + '    <tr>\n';
            Object.keys(thcols).forEach(function (colh) {
                if(thcols[colh] !== '') {
                    tr = tr + `      <td>${row[colh]}</td>\n`;
                }
            });
            tr = tr + '    </tr>\n';
        });
        tb = tb + tr + '  </tbody>\n';
        return tb;
    };

    const tableHead = createHead();

    reptablegen.getReportTable = function () {
        let table = createTable(tableHead, createBody(rdata));
        return table;
    };

    return reptablegen;
});
