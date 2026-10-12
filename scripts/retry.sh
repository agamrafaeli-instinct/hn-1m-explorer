#!/usr/bin/env bash
# Run a command up to N times with a growing pause, so a transient network or service failure heals itself (#253).
#   scripts/retry.sh 3 python scripts/update_daily.py
# Prints each failed attempt. Exits with the last attempt's status.
n=$1; shift; i=1
while true; do
  "$@" && exit 0
  rc=$?
  if [ "$i" -ge "$n" ]; then echo "retry: gave up after $i attempts: $*" >&2; exit "$rc"; fi
  echo "retry: attempt $i failed (status $rc), trying again in $((i*${RETRY_PAUSE:-20}))s: $*" >&2
  sleep $((i*${RETRY_PAUSE:-20})); i=$((i+1))
done
