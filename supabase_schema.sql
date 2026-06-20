-- 1. Crear la tabla de Perfiles (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    country_code TEXT DEFAULT 'cr',
    points INT DEFAULT 0,
    accuracy INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS) en la tabla profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Crear políticas de acceso para profiles
CREATE POLICY "Permitir lectura pública de perfiles" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Permitir a los usuarios actualizar su propio perfil" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Permitir a los usuarios insertar su propio perfil" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);


-- 2. Crear la tabla de Predicciones (Predictions)
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    match_id TEXT NOT NULL,
    home_score INT NOT NULL,
    away_score INT NOT NULL,
    points_earned INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Restricción para evitar duplicados: solo un pronóstico por usuario y partido
    UNIQUE(user_id, match_id)
);

-- Habilitar Row Level Security (RLS) en la tabla predictions
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Crear políticas de acceso para predictions
CREATE POLICY "Permitir lectura pública de predicciones" 
ON public.predictions FOR SELECT 
USING (true);

CREATE POLICY "Permitir a usuarios autenticados insertar sus predicciones" 
ON public.predictions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir a usuarios autenticados actualizar sus propias predicciones" 
ON public.predictions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Permitir a usuarios autenticados eliminar sus propias predicciones" 
ON public.predictions FOR DELETE 
USING (auth.uid() = user_id);


-- 3. Crear una función y trigger para crear automáticamente el perfil del usuario al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, country_code)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'country_code', 'cr')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger en la tabla auth.users de Supabase
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
