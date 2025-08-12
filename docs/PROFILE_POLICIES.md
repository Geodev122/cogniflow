# Profile Policies

This document defines the expected row level security policies for the `profiles` table. New migrations should reference this list to avoid duplicating or redefining policies.

## Enabled policies

1. **profiles_insert_own** – Allows an authenticated user to insert their own profile (`auth.uid() = id`).
2. **profiles_select_own** – Allows an authenticated user to read their own profile (`auth.uid() = id`).
3. **profiles_update_own** – Allows an authenticated user to update their own profile (`auth.uid() = id`).
4. **profiles_therapists_read_clients** – Allows a therapist to read the profile of a client they are linked to through `therapist_client_relations`.

These policies comprise the minimal, non-recursive set used by the application. Future migrations should drop any existing profile policies and recreate only these definitions when changes are necessary.
