#!/bin/zsh
# Security assertions for the Phase 3 complaint RLS and storage policies.
#
# Runs against the throwaway Postgres cluster started by verify-migrations.sh.
# Checks assert on resulting *state* rather than command tags, so a denial is
# verified by confirming nothing changed.

PGBIN=/opt/homebrew/opt/postgresql@16/bin
ROOT="/Users/jyotishkumar/Desktop/Hostel & Mess Service Management Platform"
cd "$ROOT"

pass=0
fail=0

A=11111111-1111-1111-1111-111111111111
B=22222222-2222-2222-2222-222222222222
ADMIN=33333333-3333-3333-3333-333333333333

# Runs SQL as `authenticated` with the given user id in the JWT claim.
# `set role` echoes SET, so only the final line is returned.
as() {
  local uid=$1
  shift
  $PGBIN/psql -h /tmp/kilo -p 55432 -U postgres -At \
    -c "set role authenticated; set request.jwt.claim.sub = '$uid'; $*" 2>&1 | tail -1
}

# Runs SQL as the superuser (schema owner), bypassing RLS.
# Single scalar value (last line).
own() { $PGBIN/psql -h /tmp/kilo -p 55432 -U postgres -At -c "$1" 2>&1 | tail -1; }

# Every row, for multi-row assertions.
ownrows() { $PGBIN/psql -h /tmp/kilo -p 55432 -U postgres -At -c "$1" 2>&1; }

# Full output including errors. The last line of a failed statement is the source
# pointer, not the ERROR line, so error assertions need the whole thing.
ownall() { $PGBIN/psql -h /tmp/kilo -p 55432 -U postgres -At -c "$1" 2>&1; }

check() {
  if [[ "$2" == "$3" ]]; then
    print -r -- "  PASS  $1"
    pass=$((pass + 1))
  else
    print -r -- "  FAIL  $1"
    print -r -- "        expected: $2"
    print -r -- "        actual:   $3"
    fail=$((fail + 1))
  fi
}

print "### Fixtures"
# Inserting into auth.users fires the Phase 2 signup trigger, which creates the
# profile with role 'student'. Only the admin is promoted afterwards, which is
# exactly how a real promotion would happen (never through signup).
own "
  insert into auth.users (id, email) values
    ('$A', 'a@uni.test'),
    ('$B', 'b@uni.test'),
    ('$ADMIN', 'admin@uni.test');
  update public.profiles set role = 'admin', full_name = 'Campus Admin'
    where id = '$ADMIN';
"

check "signup trigger creates a student profile, admin promoted manually" \
  "a@uni.test|student,admin@uni.test|admin,b@uni.test|student" \
  "$(ownrows "select email || '|' || role from public.profiles order by email;" | tr '\n' ',' | sed 's/,$//')"

print ""
print "### A. Insert guard forces owner, status and priority"

# Student A tries to file AS student B, pre-set to resolved + critical.
as "$A" "insert into public.complaints (user_id, service_type, category, title, description, location, status, priority)
        values ('$B', 'hostel', 'water', 'Forged complaint', 'This description is long enough to pass.', 'Block B', 'resolved', 'critical');" > /dev/null

stored=$(own "select user_id::text || '|' || status || '|' || priority from public.complaints where title = 'Forged complaint';")
check "user_id rewritten to the caller, status+priority reset" "$A|reported|medium" "$stored"

check "mess category on a hostel complaint is rejected by CHECK" "1" \
  "$(as "$A" "insert into public.complaints (service_type, category, title, description, location)
              values ('hostel', 'taste', 'Wrong category', 'Long enough description here.', 'Main Mess');" \
    | grep -c 'violates check constraint')"

as "$A" "insert into public.complaints (service_type, category, title, description, location)
         values ('mess', 'food_quality', 'Rice was cold', 'The rice in the main mess was cold and watery today.', 'Main Mess');" > /dev/null
check "valid mess complaint is accepted" "1" \
  "$(own "select count(*) from public.complaints where title = 'Rice was cold';")"

as "$B" "insert into public.complaints (service_type, category, title, description, location)
         values ('hostel', 'water', 'Water cooler not working', 'The cooler on the third floor has not worked since yesterday.', 'Block B, 3rd Floor');" > /dev/null
check "valid hostel complaint is accepted" "1" \
  "$(own "select count(*) from public.complaints where title = 'Water cooler not working';")"

print ""
print "### B. Reference and timeline are generated"

ref=$(own "select reference from public.complaints where title = 'Rice was cold';")
check "reference is generated in CMP-nnnn form" "yes" \
  "$( [[ $ref == CMP-0* ]] && echo yes || echo "no ($ref)" )"

events=$(own "select e.status || '|' || e.note from public.complaint_events e
             join public.complaints c on c.id = e.complaint_id
             where c.title = 'Rice was cold';")
check "opening timeline event is auto-logged" "reported|Feedback submitted" "$events"

check "every complaint got a reference" "3" \
  "$(own "select count(*) from public.complaints where reference is not null;")"

check "title length floor is enforced" "1" \
  "$(as "$A" "insert into public.complaints (service_type, category, title, description, location)
              values ('hostel', 'water', 'ab', 'Long enough description here.', 'Block B');" \
    | grep -c 'violates check constraint')"

# Mirrors the exact statement createComplaintAction issues, including the
# RETURNING clause that feeds the success confirmation.
returned=$(as "$B" "insert into public.complaints (service_type, category, title, description, location)
              values ('mess', 'hygiene', 'Spoons were dirty', 'The spoons in the main mess were not washed today.', 'Main Mess')
              returning id, reference, status, created_at;")
check "insert...returning yields a reference and status=reported" "CMP-|reported" \
  "$(print -r -- "$returned" | grep -oE 'CMP-[0-9]+\|reported' | sed 's/^CMP-[0-9]*//')"

check "short description is rejected" "1" \
  "$(as "$A" "insert into public.complaints (service_type, category, title, description, location)
              values ('hostel', 'water', 'A valid enough title', 'too short', 'Block B');" \
    | grep -c 'violates check constraint')"

print ""
print "### C. Ownership isolation (the Test 7 guarantee)"

# A owns two: the forged insert (the trigger re-owned it to A) and "Rice was cold".
check "student A sees only their own 2 complaints" "2" \
  "$(as "$A" 'select count(*) from public.complaints;')"

check "student B sees only their own 1 complaint" "1" \
  "$(as "$B" 'select count(*) from public.complaints;')"

check "student A cannot see B's complaint in their list" "0" \
  "$(as "$A" "select count(*) from public.complaints where title = 'Water cooler not working';")"

check "student B cannot read student A's complaint" "0" \
  "$(as "$B" "select count(*) from public.complaints where user_id = '$A';")"

check "student B cannot read A's timeline" "0" \
  "$(as "$B" "select count(*) from public.complaint_events e
               join public.complaints c on c.id = e.complaint_id
               where c.user_id = '$A';")"

print ""
print "### D. Students cannot mutate protected fields"

as "$B" "update public.complaints set status = 'resolved';" > /dev/null
check "student B cannot mark anything resolved (blocked, not applied)" "0" \
  "$(own "select count(*) from public.complaints where status = 'resolved';")"

as "$B" "update public.complaints set priority = 'critical';" > /dev/null
check "student B cannot change anyone's priority" "3" \
  "$(own "select count(*) from public.complaints where priority = 'medium';")"

as "$B" "update public.complaints set image_path = 'x';" > /dev/null
check "student B cannot attach a photo to A's complaint" "0" \
  "$(own "select count(*) from public.complaints where image_path is not null;")"

as "$B" "delete from public.complaints;" > /dev/null
check "no student can delete any complaint" "3" \
  "$(own "select count(*) from public.complaints;")"

print ""
print "### E. Admin retains oversight (Phase 4 groundwork)"

check "admin can read all complaints" "3" \
  "$(as "$ADMIN" 'select count(*) from public.complaints;')"

as "$ADMIN" "update public.complaints set status = 'assigned' where title = 'Rice was cold';" > /dev/null
check "admin can move a complaint to assigned" "1" \
  "$(own "select count(*) from public.complaints where status = 'assigned';")"

print ""
print "### F. Storage is private and namespaced"

check "complaint-images bucket is private" "f" \
  "$(own "select public from storage.buckets where id = 'complaint-images';")"

check "bucket enforces a 5 MB limit" "5242880" \
  "$(own "select file_size_limit from storage.buckets where id = 'complaint-images';")"

as "$A" "insert into storage.objects (bucket_id, name) values ('complaint-images', 'complaints/$A/cmp-1/evidence.png');" > /dev/null
check "student can upload into their own folder" "1" \
  "$(own "select count(*) from storage.objects;")"

as "$A" "insert into storage.objects (bucket_id, name) values ('complaint-images', 'complaints/$B/cmp-9/evidence.png');" > /dev/null
check "student cannot upload into another student's folder" "1" \
  "$(own "select count(*) from storage.objects;")"

as "$A" "insert into storage.objects (bucket_id, name) values ('complaint-images', 'evidence.png');" > /dev/null
check "student cannot upload outside the complaints/ tree" "1" \
  "$(own "select count(*) from storage.objects;")"

check "student B cannot see student A's photo object" "0" \
  "$(as "$B" "select count(*) from storage.objects;")"

as "$B" "delete from storage.objects where name like '%$A%';" > /dev/null
check "student B cannot delete student A's photo" "1" \
  "$(own "select count(*) from storage.objects;")"

print ""
print "### G. Indexes exist for the documented query shapes"
idx=$(own "select string_agg(indexname, ',' order by indexname) from pg_indexes
             where tablename in ('complaints','complaint_events') and schemaname = 'public';")
for want in complaints_user_created_idx complaints_status_created_idx \
            complaints_service_type_idx complaint_events_complaint_created_idx; do
  if [[ "$idx" == *"$want"* ]]; then
    print -r -- "  PASS  index $want"
    pass=$((pass + 1))
  else
    print -r -- "  FAIL  index $want missing"
    fail=$((fail + 1))
  fi
done

print ""
print "-------------------------------------"
print "passed: $pass   failed: $fail"
[[ $fail -eq 0 ]] || exit 1