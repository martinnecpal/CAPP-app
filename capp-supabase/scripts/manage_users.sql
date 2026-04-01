-- =============================================================
-- CAPP — Správa používateľov (spúšťa profesor v SQL Editore)
-- =============================================================

-- --- Pozrieť všetkých používateľov ---
SELECT * FROM v_users;

-- --- Nastaviť rolu konkrétnemu používateľovi ---
-- (Študent si musí najprv zaregistrovať účet cez Supabase Auth,
--  potom profesor zmení rolu.)

-- Príklad: povýšiť na profesora
SELECT set_user_role('kolega@stuba.sk', 'professor');

-- Príklad: nastaviť na študenta (default)
SELECT set_user_role('student01@stuba.sk', 'student');

-- Príklad: read-only prístup
SELECT set_user_role('hosť@example.com', 'readonly');


-- =============================================================
-- HROMADNÉ NASTAVENIE ROLÍ pre skupinu študentov
-- Stačí doplniť emaily a spustiť
-- =============================================================

DO $$
DECLARE
  student_emails TEXT[] := ARRAY[
    'student01@stuba.sk',
    'student02@stuba.sk',
    'student03@stuba.sk'
    -- pridaj ďalšie...
  ];
  email TEXT;
BEGIN
  FOREACH email IN ARRAY student_emails LOOP
    UPDATE profiles SET role = 'student' WHERE profiles.email = email;
    RAISE NOTICE 'Nastavená rola student pre: %', email;
  END LOOP;
END;
$$;
