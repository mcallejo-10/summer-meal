import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipus per a les nostres taules de base de dades
export interface User {
  id: string
  name: string
  is_admin: boolean
  created_at: string
}

export interface Menu {
  id: string
  diet_type: 'omnivora' | 'vegetariana' | 'vegana' | 'porto_el_meu_menjar' | 'no_vindré'
  meal_type: 'dinar' | 'sopar'
  day: 'dilluns' | 'dimarts' | 'dimecres' | 'dijous' | 'divendres' | 'dissabte' | 'diumenge'
  created_at: string
}

export interface Vote {
  id: string
  user_id: string
  menu_id?: string
  date: string
  choice: 'omnivora' | 'vegetariana' | 'vegana' | 'porto_el_meu_menjar' | 'no_vindré'
  meal_type: 'dinar' | 'sopar'
  created_at: string
  updated_at: string
}

// Funcions helper per treballar amb dies en català
export const DAYS_CA = {
  'dilluns': 1,
  'dimarts': 2,
  'dimecres': 3,
  'dijous': 4,
  'divendres': 5,
  'dissabte': 6,
  'diumenge': 0
} as const

export const DIET_TYPES_CA = {
  'omnivora': '🥩 Omnívora',
  'vegetariana': '🥗 Vegetariana', 
  'vegana': '🌱 Vegana',
  'porto_el_meu_menjar': '🍽️ Porto el meu menjar',
  'no_vindré': '❌ No vindré'
} as const

export const MEAL_TYPES_CA = {
  'dinar': '☀️ Dinar',
  'sopar': '🌙 Sopar'
} as const

// Funcions per treballar amb usuaris
export async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('name')
  
  if (error) {
    console.error('Error obtenint usuaris:', error)
    return []
  }
  return data || []
}

// Funcions per treballar amb menús
export async function getMenus() {
  const { data, error } = await supabase
    .from('menus')
    .select('*')
    .order('day', { ascending: true })
  
  if (error) {
    console.error('Error obtenint menús:', error)
    return []
  }
  return data || []
}

// Funcions per treballar amb vots
export async function createVote(vote: Omit<Vote, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('votes')
    .insert([vote])
    .select()
  
  if (error) {
    console.error('Error creant vot:', error)
    throw error
  }
  return data?.[0]
}

export async function getVotesByDate(date: string) {
  const { data, error } = await supabase
    .from('votes')
    .select(`
      *,
      users(name)
    `)
    .eq('date', date)
  
  if (error) {
    console.error('Error obtenint vots:', error)
    return []
  }
  return data || []
}

export async function getUserVoteForDate(userId: string, date: string, mealType: 'dinar' | 'sopar') {
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .eq('meal_type', mealType)
    .single()
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error('Error obtenint vot de l\'usuari:', error)
  }
  return data
}

export async function updateVote(voteId: string, updates: Partial<Vote>) {
  const { data, error } = await supabase
    .from('votes')
    .update(updates)
    .eq('id', voteId)
    .select()
  
  if (error) {
    console.error('Error actualitzant vot:', error)
    throw error
  }
  return data?.[0]
}
