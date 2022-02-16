'use strict';
/*
    Report Definitions - defines the HTML tables' column 
    headings and source data columns

    The report entry key matches the name of SQL files 
    that are used for generating the report.

    Each report can be optionally generated as an HTML 
    table, or as a table within a full HTML page.

    The setting in the table (`getpage`) can be over 
    ridden when calling reptablegen.js:getReportTable()
*/
module.exports = {
    rdefs: {
        'dhcpip-lifetime' : {
            getpage: false,
            title: ['DHCP/IP History','h3'],
            thtop: {
                'null':['null',5],
                'timespan':['Time Span',2],
                'firstevt':['First Event',2],
                'lastevt':['Last Event',2]
            },
            th: {
                'dhcp_qty':'Total',
                'device':'Device',
                'knownip':'Known IP',
                'givenip':'Given IP',
                'errip':'IP Error',
                // empty column heading, do not display
                'epoch_dur':'',
                'day_span':'Days',
                'time_span':'HH:MM:SS',
                'first_date':'Date',
                'first_time':'Time',
                'first_entry':'',
                'last_date':'Date',
                'last_time':'Time',
                'last_entry':''
            }
        },
        'dhcpip-lifetime-qty_gt-rank' : {
            getpage: false,
            title: ['DHCP/IP History<br>(ranked by hits over time)','h3'],
            th: {
                'dhcp_qty':'Total',
                'device':'Device',
                'knownip':'Known IP',
                'givenip':'Given IP',
                'errip':'IP Error',
                'rank':'Rank',
                // empty column heading, do not display
                'epoch_dur':'',
                'day_span':'Days',
                'time_span':'HH:MM:SS',
                'first_date':'Date',
                'first_time':'Time',
                'first_entry':'',
                'last_date':'Date',
                'last_time':'Time',
                'last_entry':''
            }
        },
        'lanaccess-lifetime' : {
            getpage: false,
            title: ['LAN Access History','h3'],
            thtop: {
                'null':['null',4],
                'timespan':['Time Span',2],
                'firstevt':['First Event',2],
                'lastevt':['Last Event',2]
            },
            th: {
                'lanaccess_qty':'Total',
                'ip':'IP Addr',
                'toport':'Port #',
                'hostname':'Host Name',
                // empty column heading, do not display
                'epoch_dur':'',
                'day_span':'Days',
                'time_span':'HH:MM:SS',
                'first_date':'Date',
                'first_time':'Time',
                'first_entry':'',
                'last_date':'Date',
                'last_time':'Time',
                'last_entry':''
            }
        },
        'lanaccess-lifetime-qty_gt' : {
            getpage: false,
            title: ['LAN Access History<br>(more than 1 event per IP)','h3'],
            thtop: {
                'null':['null',4],
                'timespan':['Time Span',2],
                'firstevt':['First Event',2],
                'lastevt':['Last Event',2]
            },
            th: {
                'lanaccess_qty':'Total',
                'ip':'IP Addr',
                'toport':'Port #',
                'hostname':'Host Name',
                // empty column heading, do not display
                'epoch_dur':'',
                'day_span':['Days','timespan'],
                'time_span':['HH:MM:SS','timespan'],
                'first_date':['Date','firstevt'],
                'first_time':['Time','firstevt'],
                'first_entry':'',
                'last_date':['Date','lastevt'],
                'last_time':['Time','lastevt'],
                'last_entry':''
            }
        },
        'lanaccess-lifetime-by_port' : {
            getpage: false,
            title: ['LAN Access History<br>(ranked by port number)','h3'],
            thtop: {
                'null':['null',2],
                'timespan':['Time Span',2],
                'firstevt':['First Event',2],
                'lastevt':['Last Event',2]
            },
            th: {
                'lanaccess_qty':'Total',
                'toport':'Port #',
                // empty column heading, do not display
                'epoch_dur':'',
                'day_span':['Days','timespan'],
                'time_span':['HH:MM:SS','timespan'],
                'first_date':['Date','firstevt'],
                'first_time':['Time','firstevt'],
                'first_entry':'',
                'last_date':['Date','lastevt'],
                'last_time':['Time','lastevt'],
                'last_entry':''
            }
        },
        'wlanrejects-lifetime-qty_gt': {
            getpage: false,
            title: ['WLAN Access Rejection History<br>(more than 1 event per MAC)','h3'],
            thtop: {
                'null':['null',3],
                'timespan':['Time Span',2],
                'firstevt':['First Event',2],
                'lastevt':['Last Event',2]
            },
            th: {
                'wlanrej_qty':'Total',
                'mac':'MAC Addr',
                'macmfr':'Made By',
                // empty column heading, do not display
                'epoch_dur':'',
                'day_span':['Days','timespan'],
                'time_span':['HH:MM:SS','timespan'],
                'first_date':['Date','firstevt'],
                'first_time':['Time','firstevt'],
                'first_entry':'',
                'last_date':['Date','lastevt'],
                'last_time':['Time','lastevt'],
                'last_entry':''
            }
        },
        'wlanrejects-lifetime-qty_gt-rank': {
            getpage: false,
            title: ['WLAN Access Rejection History','h3'],
            thtop: {
                'null':['null',3],
                'timespan':['Time Span',2],
                'firstevt':['First Event',2],
                'lastevt':['Last Event',2]
            },
            th: {
                'wlanrej_qty':'Total',
                'mac':'MAC Addr',
                'macmfr':'Made By',
                // empty column heading, do not display
                'epoch_dur':'',
                'day_span':['Days','timespan'],
                'time_span':['HH:MM:SS','timespan'],
                'first_date':['Date','firstevt'],
                'first_time':['Time','firstevt'],
                'first_entry':'',
                'last_date':['Date','lastevt'],
                'last_time':['Time','lastevt'],
                'last_entry':''
            }
        }
    }
};
