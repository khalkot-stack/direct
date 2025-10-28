-- إضافة عمود username إذا لم يكن موجوداً
DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN username text;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column username already exists in public.profiles.';
END $$;

-- إضافة عمود website إذا لم يكن موجوداً
DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN website text;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column website already exists in public.profiles.';
END $$;

-- إضافة عمود car_model إذا لم يكن موجوداً
DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN car_model text;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column car_model already exists in public.profiles.';
END $$;

-- إضافة عمود car_color إذا لم يكن موجوداً
DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN car_color text;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column car_color already exists in public.profiles.';
END $$;

-- إضافة عمود license_plate إذا لم يكن موجوداً
DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN license_plate text;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column license_plate already exists in public.profiles.';
END $$;

-- إضافة عمود phone_number إذا لم يكن موجوداً (يجب أن يكون موجوداً من trigger ولكن للتأكد)
DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN phone_number text;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column phone_number already exists in public.profiles.';
END $$;

-- إضافة عمود updated_at إذا لم يكن موجوداً
DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN updated_at timestamp with time zone DEFAULT now();
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column updated_at already exists in public.profiles.';
END $$;

-- تحديث updated_at تلقائياً عند كل تحديث للصف
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();