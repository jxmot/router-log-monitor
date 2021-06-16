#!/bin/sh
rm nohup.out
# "watch" mode
nohup node rlmonitor.js&
echo "$(ps -ef | grep "[0-9] node rlmonitor.js")"
exit 0
