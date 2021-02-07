#!/bin/sh
# sand.sh - Search And Destroy
#
# NOTE: On the AS1002T NAS Busybox is used, so things
# are a little diffenent from regular bash.
# https://www.busybox.net/
#
# We will grep the output of the ps command and look
# for strings that match the node instance we want.
# In this case it is the one running rlmonitor.js. And
# the output from the command will be placed into
# separate variables ($1,$2, etc..). The one we want
# is $1. It contains the PID.
# 
# The positional parameters are set to the arguments,
# which means that the output - 
#       26213 admin      0:04 node rlmonitor.js
# is delimited by spaces and each part is loaded into
# an argument.
set -- $(ps -ef | grep "[0-9] node rlmonitor.js")
kill -9 "$1"
exit 0
