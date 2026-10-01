#!/bin/zsh
# Full local check of the Supabase migrations and their security policies.
#
# Starts a throwaway Postgres cluster on port 55432, replays every migration in
# supabase/migrations in order against stand-in Supabase schemas, then runs the
# RLS and storage policy assertions. Everything is torn down on exit.
#
# Usage: zsh scripts/verify-db.sh

set -e
ROOT="/Users/jyotishkumar/Desktop/Hostel & Mess Service Management Platform"
cd "$ROOT"

PGBIN=/opt/homebrew/opt/postgresql@16/bin
PGDATA=/tmp/kilo/campus-resolve-verify
PORT=55432

cleanup() {
  "$PGBIN/pg_ctl" -D "$PGDATA" stop -m immediate >/dev/null 2>&1 || true
}
trap cleanup EXIT

print "==> Starting a throwaway Postgres cluster on port $PORT"
rm -rf "$PGDATA"
mkdir -p "$PGDATA"
"$PGBIN/initdb" -D "$PGDATA" -U postgres --auth=trust >/dev/null
"$PGBIN/pg_ctl" -D "$PGDATA" -o "-p $PORT -k /tmp/kilo" -l /tmp/kilo/verify-db.log start >/dev/null
sleep 2

print "==> Replaying migrations"
zsh scripts/verify-migrations.sh

print ""
print "==> Running security assertions"
zsh scripts/verify-rls.sh
