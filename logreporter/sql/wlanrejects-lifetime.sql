SELECT count(mac) as wlanrej_qty,
       mac,macmfr,
       (cast(((max(tstamp) - min(tstamp)) / 1000) as UNSIGNED)) as epoch_dur, 
       floor(((max(tstamp) - min(tstamp)) / 1000) / 86400) as day_span,
	   SEC_TO_TIME(cast(mod(((max(tstamp) - min(tstamp)) / 1000), 86400) as UNSIGNED)) as time_span, 
       DATE_FORMAT(FROM_UNIXTIME(min(tstamp) / 1000), '%Y-%m-%d') as first_date,
       DATE_FORMAT(FROM_UNIXTIME(min(tstamp) / 1000), '%T') as first_time,
       min(entrynumb) as first_entry, 
       DATE_FORMAT(FROM_UNIXTIME(max(tstamp) / 1000), '%Y-%m-%d') as last_date,
       DATE_FORMAT(FROM_UNIXTIME(max(tstamp) / 1000), '%T') as last_time,
       max(entrynumb) as last_entry
FROM rlmonitor.wlanrejects where 
known = 0 
-- where mod
group by mac
order by count(mac) desc;
-- wlanrejects-lifetime.sql: returns all WLAN rejections, by MAC hits with calculated date spans