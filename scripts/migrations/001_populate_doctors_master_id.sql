-- Migration: Populate missing doctors.master_id with their own id
-- Run this on the Supabase SQL editor or via psql connected to your DB

BEGIN;

-- For safety, only update rows where master_id is null
UPDATE public.doctors
SET master_id = id
WHERE master_id IS NULL;

COMMIT;

-- Note: This only updates the relational `doctors` table. If your application
-- stores doctor objects inside the `clinics.data` JSON blob, run the accompanying
-- Node migration to update those JSON blobs as well.
