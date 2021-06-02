select count(ip) as invasion_qty,
       toport, 
       (cast(((max(tstamp) - min(tstamp)) / 1000) as UNSIGNED)) as epoch_dur, 
       floor(((max(tstamp) - min(tstamp)) / 1000) / 86400) as day_span,
	   SEC_TO_TIME(cast(mod(((max(tstamp) - min(tstamp)) / 1000), 86400) as UNSIGNED)) as time_span, 
       DATE_FORMAT(FROM_UNIXTIME(min(tstamp) / 1000), '%Y-%m-%d @ %T') as first_invade,
       min(entrynumb) as first_entry, 
       DATE_FORMAT(FROM_UNIXTIME(max(tstamp) / 1000), '%Y-%m-%d @ %T') as last_invade,
       max(entrynumb) as last_entry
FROM rlmonitor.invasions where 
known = 0 
group by toport 
order by count(ip) desc;
-- invasions-lifetime-by_port.sql : returns all invasions, by toport with calculated date spans
