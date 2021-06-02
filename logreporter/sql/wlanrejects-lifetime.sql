SELECT count(mac) as mac_qty,
       mac,macmfr,
       floor(((max(tstamp) - min(tstamp)) / 1000) / 86400) as day_span,
	   SEC_TO_TIME(cast(mod(((max(tstamp) - min(tstamp)) / 1000), 86400) as UNSIGNED)) as time_span, 
       DATE_FORMAT(FROM_UNIXTIME(min(tstamp) / 1000), '%Y-%m-%d @ %T') as first_wlanreject,
       min(entrynumb) as first_entry, 
       DATE_FORMAT(FROM_UNIXTIME(max(tstamp) / 1000), '%Y-%m-%d @ %T') as last_wlanreject,
       max(entrynumb) as last_entry
FROM rlmonitor.wlanrejects where 
known = 0 
group by mac
order by count(mac) desc;
-- wlanrejects-lifetime.sql: returns all WLAN rejections, by MAC hits with calculated date spans