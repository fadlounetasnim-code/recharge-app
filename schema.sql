-- Supabase SQL Schema for Recharge & SIM Manager

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop old tables if they exist to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_stock_movement_inserted ON public.stock_movements;

DROP TABLE IF EXISTS public.daily_reports CASCADE;
DROP TABLE IF EXISTS public.stock_movements CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.articles CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;

-- 1. Create Team Members Table (User Profiles)
CREATE TABLE public.team_members (
    id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'supervisor', 'employee')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    assigned_sector TEXT,
    dealer_code TEXT,
    monthly_recharges_goal NUMERIC NOT NULL DEFAULT 5000.00,
    monthly_sims_goal INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: To migrate an existing database on Supabase, run:
-- ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS monthly_recharges_goal NUMERIC NOT NULL DEFAULT 5000.00;
-- ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS monthly_sims_goal INTEGER NOT NULL DEFAULT 100;


-- 2. Create User Roles Table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'supervisor', 'employee')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, role)
);

-- 3. Create Clients Table
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    dealer_number TEXT NOT NULL UNIQUE,
    activity_type TEXT NOT NULL, -- AG, BT, VPA, LB, etc.
    address TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    notes TEXT,
    created_by UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Articles Table (Stock Catalog)
CREATE TABLE public.articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN ('recharge', 'sim', 'pack_sim')),
    face_value NUMERIC NOT NULL DEFAULT 0,
    buying_price NUMERIC NOT NULL DEFAULT 0,
    selling_price NUMERIC NOT NULL DEFAULT 0,
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Sales Table
CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    employee_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'none')),
    discount_value NUMERIC NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
    discount_amount NUMERIC NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    gross_total NUMERIC NOT NULL CHECK (gross_total >= 0),
    net_total NUMERIC NOT NULL CHECK (net_total >= 0),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'unpaid', 'partial')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Stock Movements Table
CREATE TABLE public.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL, -- Positive for stock in, Negative for sales/withdrawals
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'sale', 'correction', 'supplier_invoice', 'transfer')),
    employee_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
    invoice_number TEXT,
    discount_percentage NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create Daily Reports Table
CREATE TABLE public.daily_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_date DATE NOT NULL,
    employee_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
    sector TEXT,
    total_recharge_sales NUMERIC NOT NULL DEFAULT 0,
    total_sim_sales NUMERIC NOT NULL DEFAULT 0,
    total_gross_sales NUMERIC NOT NULL DEFAULT 0,
    total_discount NUMERIC NOT NULL DEFAULT 0,
    total_net_sales NUMERIC NOT NULL DEFAULT 0,
    clients_visited INTEGER NOT NULL DEFAULT 0,
    clients_served INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (report_date, employee_id)
);


-- ==========================================
-- Triggers & DB Functions
-- ==========================================

-- Trigger to Automatically Update Stock Quantity on movement
CREATE OR REPLACE FUNCTION public.update_article_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.articles
    SET stock_quantity = stock_quantity + NEW.quantity
    WHERE id = NEW.article_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_stock_movement_inserted
    AFTER INSERT ON public.stock_movements
    FOR EACH ROW EXECUTE FUNCTION public.update_article_stock();

-- Trigger to Link Auth Users to team_members automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role TEXT := 'employee';
BEGIN
    INSERT INTO public.team_members (id, full_name, email, role, is_active)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.email,
        default_role,
        true
    );
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, default_role);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger after function definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- Row Level Security (RLS)
-- ==========================================

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

-- Helper function to fetch role of current authenticated user
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.team_members WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 1. Team Members Policies
CREATE POLICY admin_all_team ON public.team_members FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY supervisor_read_team ON public.team_members FOR SELECT TO authenticated
  USING (public.get_user_role() = 'supervisor');

CREATE POLICY supervisor_manage_employees ON public.team_members FOR ALL TO authenticated
  USING (public.get_user_role() = 'supervisor' AND role = 'employee')
  WITH CHECK (public.get_user_role() = 'supervisor' AND role = 'employee');

CREATE POLICY employee_read_team ON public.team_members FOR SELECT TO authenticated
  USING (true);

CREATE POLICY self_update_team ON public.team_members FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- 2. User Roles Policies
CREATE POLICY admin_all_roles ON public.user_roles FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY read_all_roles ON public.user_roles FOR SELECT TO authenticated
  USING (true);

-- 3. Clients Policies
CREATE POLICY admin_all_clients ON public.clients FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY supervisor_all_clients ON public.clients FOR ALL TO authenticated
  USING (public.get_user_role() = 'supervisor') WITH CHECK (public.get_user_role() = 'supervisor');

CREATE POLICY employee_read_own_clients ON public.clients FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.get_user_role() IN ('admin', 'supervisor'));

CREATE POLICY employee_insert_clients ON public.clients FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY employee_update_clients ON public.clients FOR UPDATE TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- 4. Articles Policies
CREATE POLICY admin_supervisor_all_articles ON public.articles FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'supervisor')) WITH CHECK (public.get_user_role() IN ('admin', 'supervisor'));

CREATE POLICY employee_read_articles ON public.articles FOR SELECT TO authenticated
  USING (true);

-- 5. Sales Policies
CREATE POLICY admin_all_sales ON public.sales FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY supervisor_all_sales ON public.sales FOR ALL TO authenticated
  USING (public.get_user_role() = 'supervisor') WITH CHECK (public.get_user_role() = 'supervisor');

CREATE POLICY employee_read_own_sales ON public.sales FOR SELECT TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY employee_insert_own_sales ON public.sales FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY employee_update_own_sales ON public.sales FOR UPDATE TO authenticated
  USING (employee_id = auth.uid()) WITH CHECK (employee_id = auth.uid());

-- 6. Stock Movements Policies
CREATE POLICY admin_supervisor_all_movements ON public.stock_movements FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'supervisor')) WITH CHECK (public.get_user_role() IN ('admin', 'supervisor'));

CREATE POLICY employee_read_own_movements ON public.stock_movements FOR SELECT TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY employee_insert_own_movements ON public.stock_movements FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid());

-- 7. Daily Reports Policies
CREATE POLICY admin_supervisor_all_reports ON public.daily_reports FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'supervisor')) WITH CHECK (public.get_user_role() IN ('admin', 'supervisor'));

CREATE POLICY employee_read_own_reports ON public.daily_reports FOR SELECT TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY employee_insert_own_reports ON public.daily_reports FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY employee_update_own_reports ON public.daily_reports FOR UPDATE TO authenticated
  USING (employee_id = auth.uid()) WITH CHECK (employee_id = auth.uid());


-- ==========================================
-- Prepopulate Default Articles (Seed)
-- ==========================================
INSERT INTO public.articles (name, category, face_value, buying_price, selling_price, stock_quantity, is_active) VALUES
('Recharge 5 DH', 'recharge', 5, 4.70, 5, 0, true),
('Recharge 10 DH', 'recharge', 10, 9.40, 10, 0, true),
('Recharge 20 DH', 'recharge', 20, 18.80, 20, 0, true),
('Recharge 50 DH', 'recharge', 50, 47.00, 50, 0, true),
('Recharge 100 DH', 'recharge', 100, 94.00, 100, 0, true),
('Recharge 500 DH', 'recharge', 500, 470.00, 500, 0, true),
('Recharge 1000 DH', 'recharge', 1000, 940.00, 1000, 0, true),
('Recharge 5000 DH', 'recharge', 5000, 4700.00, 5000, 0, true),
('Carte SIM', 'sim', 0, 10.00, 20, 0, true),
('Pack SIM', 'pack_sim', 0, 80.00, 120, 0, true)
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- 8. Create Supplier Payments Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.supplier_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    receipt_photo TEXT, -- URL or Base64 string
    employee_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_supervisor_all_payments ON public.supplier_payments FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'supervisor')) WITH CHECK (public.get_user_role() IN ('admin', 'supervisor'));

CREATE POLICY employee_read_all_payments ON public.supplier_payments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY employee_insert_own_payments ON public.supplier_payments FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid());