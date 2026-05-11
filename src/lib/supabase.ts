import { createClient } from '@/lib/supabase-browser'

/**
 * Client singleton per a operacions des del navegador.
 * 
 * NOTA: Totes les funcions d'aquest fitxer utilitzen el client del navegador.
 * Quan convertim pàgines a Server Components, crearem versions server-side
 * d'aquestes funcions que utilitzin supabase-server.ts en comptes d'aquesta.
 */
const supabase = createClient()

// Tipus per a les nostres taules de base de dades
export interface User {
  id: string
  name: string
  email?: string
  is_admin: boolean
  created_at: string
}

export interface Menu {
  id: string
  dish_name: string
  diet_type: 'omnivora' | 'vegetariana' | 'vegana'
  meal_type: 'dinar' | 'sopar'
  day: 'dilluns' | 'dimarts' | 'dimecres' | 'dijous' | 'divendres' | 'dissabte' | 'diumenge'
  created_at: string
}

export interface Vote {
  id: string
  user_id: string
  voted_by?: string | null
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

export async function createMenu(menu: Omit<Menu, 'id' | 'created_at'>) {
  const menuWithTimestamp = {
    ...menu,
    created_at: new Date().toISOString()
  }
  
  const { data, error } = await supabase
    .from('menus')
    .insert([menuWithTimestamp])
    .select()
  
  if (error) {
    console.error('Error creant menú:', error)
    throw error
  }
  return data?.[0]
}

export async function updateMenu(menuId: string, updates: Partial<Menu>) {
  const { data, error } = await supabase
    .from('menus')
    .update(updates)
    .eq('id', menuId)
    .select()
  
  if (error) {
    console.error('Error actualitzant menú:', error)
    throw error
  }
  
  return data?.[0]
}

export async function deleteMenu(menuId: string) {
  const { error } = await supabase
    .from('menus')
    .delete()
    .eq('id', menuId)
  
  if (error) {
    console.error('Error eliminant menú:', error)
    throw error
  }
}

// Funcions per treballar amb vots
export async function createVote(vote: Omit<Vote, 'id' | 'created_at' | 'updated_at'>) {
  const now = new Date().toISOString()
  const voteWithTimestamps = {
    ...vote,
    created_at: now,
    updated_at: now
  }
  
  const { data, error } = await supabase
    .from('votes')
    .insert([voteWithTimestamps])
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

// Retorna els usuaris que NO han votat per a una data concreta
export async function getNotVotedUsers(date: string): Promise<{ id: string; name: string }[]> {
  const [{ data: allUsers }, { data: votes }] = await Promise.all([
    supabase.from('users').select('id, name').order('name'),
    supabase.from('votes').select('user_id, meal_type').eq('date', date),
  ])

  if (!allUsers) return []

  // Un usuari ha "votat completament" només si té vot de dinar I de sopar
  const mealTypesByUser = new Map<string, Set<string>>()
  votes?.forEach((v: { user_id: string; meal_type: string }) => {
    if (!mealTypesByUser.has(v.user_id)) mealTypesByUser.set(v.user_id, new Set())
    mealTypesByUser.get(v.user_id)!.add(v.meal_type)
  })

  return allUsers.filter((u: { id: string; name: string }) => {
    const mealTypes = mealTypesByUser.get(u.id)
    return !mealTypes || !mealTypes.has('dinar') || !mealTypes.has('sopar')
  })
}

// Nueva función para obtener estadísticas de votos
export async function getVoteStats(date: string) {
  const { data, error } = await supabase
    .from('votes')
    .select(`
      choice,
      meal_type,
      voter:users!votes_user_id_fkey(name)
    `)
    .eq('date', date)
  
  if (error) {
    console.error('Error obtenint estadístiques de vots:', error)
    return { dinar: {}, sopar: {} }
  }

  // Organizar por meal_type y choice
  const stats = {
    dinar: {} as Record<string, { count: number; users: string[] }>,
    sopar: {} as Record<string, { count: number; users: string[] }>
  }

  data?.forEach((vote: { choice: string; meal_type: string; voter: { name: string } | null }) => {
    const mealType = vote.meal_type as 'dinar' | 'sopar'
    const choice = vote.choice
    const userName = vote.voter?.name || 'Usuari desconegut'

    if (!stats[mealType][choice]) {
      stats[mealType][choice] = { count: 0, users: [] }
    }
    
    stats[mealType][choice].count++
    stats[mealType][choice].users.push(userName)
  })

  return stats
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

// Configuració de l'app (deadlines, etc.)
export interface AppSettings {
  voting_cutoff_hour: number
  results_cutoff_hour: number
}

export async function getAppSettings(): Promise<AppSettings> {
  const { data } = await supabase.from('settings').select('key, value')
  const map = Object.fromEntries((data || []).map((r: { key: string; value: string }) => [r.key, r.value]))
  return {
    voting_cutoff_hour: parseInt(map.voting_cutoff_hour ?? '10'),
    results_cutoff_hour: parseInt(map.results_cutoff_hour ?? '22'),
  }
}

export async function updateAppSetting(key: string, value: string) {
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() })
  if (error) {
    console.error('Error actualitzant configuració:', error)
    throw error
  }
}

export async function updateVote(voteId: string, updates: Partial<Vote>) {
  const updatesWithTimestamp = {
    ...updates,
    updated_at: new Date().toISOString()
  }
  
  const { data, error } = await supabase
    .from('votes')
    .update(updatesWithTimestamp)
    .eq('id', voteId)
    .select()
  
  if (error) {
    console.error('Error actualitzant vot:', error)
    throw error
  }
  return data?.[0]
}
