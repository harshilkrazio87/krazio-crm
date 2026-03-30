-- Confirm email for admin@kraziocloud.com so they can log in without clicking a link
UPDATE auth.users
SET email_confirmed_at = NOW(), updated_at = NOW()
WHERE email = 'admin@kraziocloud.com';
