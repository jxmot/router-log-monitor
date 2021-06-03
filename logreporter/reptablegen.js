'use strict';
/*
    Report Table Generator 

    Creates an HTML table using the database table data 
    to fill in the table. The data columns used, and the
    HTML table column headings are defined in reportdefs.js
*/
module.exports = (function(_tname, _rdata) { //, _pevts, _log)  {

    const tablename = _tname;
    const rdata = JSON.parse(JSON.stringify(_rdata));

    // NOTE: require() does caching of modules, info:
    //      https://bambielli.com/til/2017-04-30-node-require-cache/
    //
    // Also using every() instead of forEach() to allow the ability
    // to break the loop:
    //      https://masteringjs.io/tutorials/fundamentals/foreach-break
    Object.keys(require.cache).every( (key) => {
        if(key.includes('reportdefs.js')) {
            delete require.cache[key];
            return false;
        }
        return true;
    });

    const reportdefs = require('./reportdefs.js');

    let reptablegen = {
    };

    const createCSS = () => `
<style>
  #${tablename}-title {
    text-align:center;
  }

  #${tablename} {
    width: 80%;
    margin: 0 auto;
  }

  #${tablename}-table {
    width: 100%;
    margin: 0 auto;
  }

  #${tablename}-table td {
    text-align:center;
  }

  #${tablename}-table th {
    text-align:center;
  }
</style>
`;

    const createTitle = () => `
<${reportdefs.rdefs[tablename].title[1]} id="${tablename}-title">
  ${reportdefs.rdefs[tablename].title[0]}
</${reportdefs.rdefs[tablename].title[1]}>
<br>
`;

    const createTable = (head, body) => `
<div id="${tablename}" class="table-responsive">
 <table id="${tablename}-table" class="table table-striped table-sm table-borderless">
${head}${body} </table>
</div>
`;

// https://www.w3.org/WAI/tutorials/tables/irregular/#table-with-two-tier-headers
// need upper tier over 
//  "Days" "HH:MM:SS" < "Time Span"
//  "Date" "Time" < "First Event" & "Last Event"


    // create the table header
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

    // create the table body, use the table 
    // name (report ID) to access its definition
    // of columns. 
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

    // the table heading is static, and does not need 
    // to be rendered each time.
    const tableHead = createHead();

    // get a complete report table...
    reptablegen.getReportTable = function () {
        let table = createCSS() + createTitle() + createTable(tableHead, createBody(rdata));
        return table;
    };

    return reptablegen;
});
