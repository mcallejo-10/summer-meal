-- ============================================================
-- SUMMER MEAL v2 — Esquema de Base de Dades (Versió 2)
-- ============================================================
-- Com executar-ho:
-- 1. Ves a supabase.com → el teu projecte → SQL Editor
-- 2. Copia i enganxa tot aquest fitxer
-- 3. Clica "Run"
-- ============================================================


-- ============================================================
-- TAULA: users
-- ============================================================
-- Diferència clau vs. v1: l'id és el MATEIX UUID que auth.users.id
-- Això vincula el login de Supabase amb les dades de l'usuari.
-- 
-- EN ANGULAR: és com tenir un UserService que guarda les dades
-- de l'usuari autenticat. Aquí la BD fa la vinculació automàticament.
-- ============================================================
CREATE TABLE public.users (
  id        UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name      TEXT NOT NULL,
  email     TEXT UNIQUE NOT NULL,
  is_admin  BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);


-- ============================================================
-- TAULA: menus
-- ============================================================
-- Igual que la v1. Els menús no necessiten canvis.
-- ============================================================
CREATE TABLE public.menus (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day        TEXT NOT NULL CHECK (day IN ('dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte', 'diumenge')),
  meal_type  TEXT NOT NULL CHECK (meal_type IN ('dinar', 'sopar')),
  dish_name  TEXT NOT NULL,
  diet_type  TEXT NOT NULL CHECK (diet_type IN ('omnivora', 'vegetariana', 'vegana')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);


-- ============================================================
-- TAULA: votes
-- ============================================================
-- Nova columna: voted_by → l'usuari que ha enviat el vot.
-- Pot ser diferent de user_id quan vots en nom d'un company.
-- Exemple: la Júlia (voted_by) vota per en Marc (user_id) perquè
-- ell no tenia el telèfon a mà.
-- ============================================================
CREATE TABLE public.votes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  voted_by   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  date       DATE NOT NULL,
  choice     TEXT NOT NULL CHECK (choice IN ('omnivora', 'vegetariana', 'vegana', 'porto_el_meu_menjar', 'no_vindré')),
  meal_type  TEXT NOT NULL CHECK (meal_type IN ('dinar', 'sopar')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, date, meal_type)
);


-- ============================================================
-- TRIGGER: handle_new_user
-- ============================================================
-- Quan algú accepta la invitació i es registra a Supabase Auth,
-- aquest trigger crea automàticament el seu registre a public.users.
--
-- És com un "lifecycle hook" de la BD: s'executa automàticament
-- AFTER INSERT a auth.users.
--
-- raw_user_meta_data: dades extra que passem quan convidem l'usuari
-- (el nom i si és admin). L'admin les posa quan envia la invitació.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, is_admin)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE((new.raw_user_meta_data->>'is_admin')::boolean, false)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- En Angular, protegeixes les rutes amb Guards al frontend.
-- El problema: si algú fa una petició directa a l'API, el guard no s'executa.
-- 
-- Les RLS policies protegeixen les dades A NIVELL DE BD.
-- Fins i tot si algú té la anon key, no pot llegir/escriure
-- el que les policies no li permeten. És la segona línia de defensa.
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;


-- USERS: Qualsevol usuari autenticat pot veure la llista d'usuaris.
-- Necessari per mostrar la llista "vota per un company".
CREATE POLICY "users_select_authenticated"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

-- USERS: Cada usuari pot actualitzar el seu propi perfil.
-- auth.uid() → l'UUID de l'usuari autenticat en aquest moment.
CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);


-- MENUS: Tothom pot veure els menús (la pàgina /menus és pública).
CREATE POLICY "menus_select_public"
  ON public.menus FOR SELECT
  USING (true);

-- MENUS: Només admins poden crear/editar/eliminar menús.
-- Comprova si l'usuari autenticat té is_admin = true a la taula users.
CREATE POLICY "menus_admin_all"
  ON public.menus FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );


-- VOTES: Tothom pot veure els resultats (la pàgina /resultats és pública).
CREATE POLICY "votes_select_public"
  ON public.votes FOR SELECT
  USING (true);

-- VOTES: Qualsevol usuari autenticat pot crear vots
-- (per ells mateixos o per un company → user_id pot ser diferent d'auth.uid())
CREATE POLICY "votes_insert_authenticated"
  ON public.votes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- VOTES: Qualsevol usuari autenticat pot modificar vots
-- (per canviar el seu vot o el d'un company)
CREATE POLICY "votes_update_authenticated"
  ON public.votes FOR UPDATE
  TO authenticated
  USING (true);
