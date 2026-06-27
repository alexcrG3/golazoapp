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


-- 4. Bucket de Storage para fotos de perfil (avatars)
-- Ejecutar esto en el SQL Editor de Supabase:
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Política: cualquiera puede ver las fotos de perfil (bucket público)
CREATE POLICY "Avatars son públicos"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Política: usuarios autenticados pueden subir su propia foto
CREATE POLICY "Usuarios pueden subir su avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política: usuarios autenticados pueden actualizar su propia foto
CREATE POLICY "Usuarios pueden actualizar su avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política: usuarios autenticados pueden eliminar su propia foto
CREATE POLICY "Usuarios pueden eliminar su avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Crear la tabla de Grupos (Groups)
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en public.groups
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para public.groups
CREATE POLICY "Permitir lectura pública de grupos" 
ON public.groups FOR SELECT 
USING (true);

CREATE POLICY "Permitir crear grupos a usuarios autenticados" 
ON public.groups FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Permitir a creadores actualizar sus grupos" 
ON public.groups FOR UPDATE 
USING (auth.uid() = creator_id);

CREATE POLICY "Permitir a creadores eliminar sus grupos" 
ON public.groups FOR DELETE 
USING (auth.uid() = creator_id);


-- 6. Crear la tabla de Miembros de Grupo (Group Members)
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(group_id, user_id)
);

-- Habilitar RLS en public.group_members
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para public.group_members
CREATE POLICY "Permitir lectura pública de miembros de grupo" 
ON public.group_members FOR SELECT 
USING (true);

CREATE POLICY "Permitir unirse a usuarios autenticados" 
ON public.group_members FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir salir de grupo a miembros" 
ON public.group_members FOR DELETE 
USING (auth.uid() = user_id);
