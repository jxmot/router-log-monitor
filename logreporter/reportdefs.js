'use strict';

module.exports = {
    rdefs: {
        'invasions-lifetime' : {
            getpage: true,
            title: ['LAN Access History','h3'],
            th: {
                'invasion_qty':'Total',
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
        'invasions-lifetime-qty_gt' : {
            getpage: true,
            title: ['LAN Access History<br>(more than 1 event per IP)','h3'],
            th: {
                'invasion_qty':'Total',
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
        'invasions-lifetime-by_port' : {
            getpage: true,
            title: ['LAN Access History<br>(ranked by port number)','h3'],
            th: {
                'invasion_qty':'Total',
                'toport':'Port #',
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
        'wlanrejects-lifetime': {
            getpage: true,
            title: ['WLAN Access Rejection History','h3'],
            th: {
                'wlanrej_qty':'Total',
                'mac':'MAC Addr',
                'macmfr':'Made By',
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
        }
    }
};
