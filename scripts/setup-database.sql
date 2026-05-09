-- ============================================
-- Summer Meal v2 - Esquema de Base de Dades
-- ============================================
-- Executar aquest SQL al SQL Editor de Supabase
-- per crear totes les taules necessàries.
-- ============================================

-- 1. TAULA D'USUARIS
-- Guarda els membres del grup que participen als menjars.
-- El camp is_admin determina si poden accedir al panell d'administració.
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. TAULA DE MENÚS
-- Defineix els plats disponibles per cada dia de la setmana.
-- Cada plat té un tipus de dieta (omnívora, vegetariana, vegana)
-- i un tipus de menjar (dinar o sopar).
CREATE TABLE IF NOT EXISTS menus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dish_name TEXT NOT NULL,
  diet_type TEXT NOT NULL CHECK (diet_type IN ('omnivora', 'vegetariana', 'vegana')),
  meal_type TEXT NOT NULL CHECK (meal_type IN ('dinar', 'sopar')),
  day TEXT NOT NULL CHECK (day IN ('dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte', 'diumenge')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. TAULA DE VOTS
-- Registra el vot de cada usuari per cada dia i tipus de menjar.
-- La constraint UNIQUE(user_id, date, meal_type) assegura que un 
-- usuari només pot tenir UN vot per dia i tipus de menjar.
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  choice TEXT NOT NULL CHECK (choice IN ('omnivora', 'vegetariana', 'vegana', 'porto_el_meu_menjar', 'no_vindré')),
  meal_type TEXT NOT NULL CHECK (meal_type IN ('dinar', 'sopar')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, date, meal_type)
);

-- ============================================
-- ÍNDEXOS per millorar el rendiment de les consultes
-- ============================================

-- Buscar vots per data (la consulta més freqüent)
CREATE INDEX IF NOT EXISTS idx_votes_date ON votes(date);

-- Buscar vots per usuari i data
CREATE INDEX IF NOT EXISTS idx_votes_user_date ON votes(user_id, date);

-- Buscar menús per dia
CREATE INDEX IF NOT EXISTS idx_menus_day ON menus(day);
