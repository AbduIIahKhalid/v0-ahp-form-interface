-- Insert admin user into Supabase auth.users
-- This must be run after the admin signs up through the UI
-- Or manually create user with this email in Supabase dashboard

-- Note: The actual admin user creation happens through Supabase Auth sign up
-- This script is just for documentation
-- Admin credentials: abdullahkhalid@gmail.com / 12345678

-- To create the admin user, either:
-- 1. Go to /auth/sign-up and create the account
-- 2. Or use the Supabase dashboard to manually create the user

COMMENT ON SCHEMA public IS 'Admin user should be created with email: abdullahkhalid@gmail.com';
