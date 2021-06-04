'use strict';
/*
    Report Table Generator 

    Creates an HTML table using the database table data 
    to fill in the table. The data columns used, and the
    HTML table column headings are defined in reportdefs.js
*/
module.exports = (function(_tname, _rdata) {

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

    // get the report definitions
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

    const createPage = (table) => `
<!DOCTYPE html>
<html lang="en-US">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta name="description" content="Log Report - ${reportdefs.rdefs[tablename].title[0]}"/>
    <meta name="author" content="https://github.com/jxmot"/>
    <title>${reportdefs.rdefs[tablename].title[0]}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css" integrity="sha384-B0vP5xmATw1+K9KRQjQERJvTumQW0nPEzvF6L/Z6nronJ3oUOFUFpCjEUQouq2+l" crossorigin="anonymous">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/js/bootstrap.bundle.min.js" integrity="sha384-Piv4xVNRyMGpqkS2by6br4gNJ7DXjqk09RmUpJ8jgGtD7zP9yug3goQfGII0yAns" crossorigin="anonymous"></script>
</head>
<body id="pagebody" class="nocopy">
  <br>
${table}
</body>
</html>
`;

    // get a complete report table...
    reptablegen.getReportTable = function (getpage = false) {
        let table = createCSS() + createTitle() + createTable(tableHead, createBody(rdata));

        if(getpage === true || reportdefs.rdefs[tablename].getpage === true) {
            let page = createPage(table);
            return page;
        } else return table;
    };

    return reptablegen;
});
