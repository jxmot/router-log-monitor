select * from(
    select count(ip) as lanaccess_qty,
        ip,toport,hostname, 
        -- common report columns
        (cast(((max(tstamp) - min(tstamp)) / 1000) as UNSIGNED)) as epoch_dur, 
        floor(((max(tstamp) - min(tstamp)) / 1000) / 86400) as day_span,
        SEC_TO_TIME(cast(mod(((max(tstamp) - min(tstamp)) / 1000), 86400) as UNSIGNED)) as time_span, 
        DATE_FORMAT(FROM_UNIXTIME(min(tstamp) / 1000), '%Y/%m/%d') as first_date,
        DATE_FORMAT(FROM_UNIXTIME(min(tstamp) / 1000), '%T') as first_time,
        min(entrynumb) as first_entry, 
        DATE_FORMAT(FROM_UNIXTIME(max(tstamp) / 1000), '%Y/%m/%d') as last_date,
        DATE_FORMAT(FROM_UNIXTIME(max(tstamp) / 1000), '%T') as last_time,
        max(entrynumb) as last_entry
    from rlmonitor.lanaccess where 
    known = 0 
    and 
    toport != 59018 
-- where mod
    group by ip 
    order by count(ip) desc
) as tempdata 
where
-- adjust as needed
lanaccess_qty > 1
-- where mod
;
-- lanaccess-lifetime-qty_gt.sql: identical to 'lanaccess-lifetime.sql', except that it 
-- can be filtered by a minimum value for 'lanaccess_qty'.