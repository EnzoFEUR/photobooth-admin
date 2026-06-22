-- =============================================
-- 🏗️ KANBOOTHAN MULTI-TENANT SCHEMA
-- Run this in Supabase SQL Editor (Dashboard > SQL)
-- =============================================

-- 1. CREATE ENUM FOR USER ROLES
CREATE TYPE user_role AS ENUM ('super_admin', 'franchisee');

-- =============================================
-- 2. PROFILES TABLE (Linked to Supabase Auth)
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'franchisee',
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create a profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (NEW.id, 'franchisee', COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- =============================================
-- 3. BOOTHS TABLE (Physical Kiosk Machines)
-- =============================================
CREATE TABLE booths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchisee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booth_name TEXT NOT NULL DEFAULT 'Untitled Booth',
  location_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'maintenance')),
  paper_remaining INTEGER NOT NULL DEFAULT 100 CHECK (paper_remaining >= 0 AND paper_remaining <= 100),
  ink_remaining INTEGER NOT NULL DEFAULT 100 CHECK (ink_remaining >= 0 AND ink_remaining <= 100),
  last_heartbeat TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for booths
ALTER TABLE booths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can do everything with booths"
  ON booths FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Franchisees can read their own booths"
  ON booths FOR SELECT
  USING (franchisee_id = auth.uid());

CREATE POLICY "Franchisees can update their own booths"
  ON booths FOR UPDATE
  USING (franchisee_id = auth.uid());

-- =============================================
-- 4. TRANSACTIONS TABLE (Payment Logs)
-- =============================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booth_id UUID REFERENCES booths(id) ON DELETE SET NULL,
  franchisee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'gcash', 'maya', 'card')),
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  layout_id TEXT,
  soft_copy_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can read all transactions"
  ON transactions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Franchisees can read their own transactions"
  ON transactions FOR SELECT
  USING (franchisee_id = auth.uid());

CREATE POLICY "Franchisees can insert their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (franchisee_id = auth.uid());

-- =============================================
-- 5. FRAMES TABLE (Custom Overlay Assets)
-- =============================================
CREATE TABLE frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchisee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Frame',
  storage_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for frames
ALTER TABLE frames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can do everything with frames"
  ON frames FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Franchisees can read their own frames"
  ON frames FOR SELECT
  USING (franchisee_id = auth.uid());

CREATE POLICY "Franchisees can insert their own frames"
  ON frames FOR INSERT
  WITH CHECK (franchisee_id = auth.uid());

CREATE POLICY "Franchisees can update their own frames"
  ON frames FOR UPDATE
  USING (franchisee_id = auth.uid());

CREATE POLICY "Franchisees can delete their own frames"
  ON frames FOR DELETE
  USING (franchisee_id = auth.uid());

-- =============================================
-- 6. LAYOUT PRICING TABLE
-- =============================================
ALTER TABLE layout_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read pricing"
  ON layout_pricing FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins can update pricing"
  ON layout_pricing FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
