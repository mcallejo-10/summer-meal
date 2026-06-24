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
  course: 'primer' | 'segon' | null  // null = menús antics sense curs assignat
  created_at: string
}

export interface Vote {
  id: string
  user_id: string
  voted_by?: string | null
  date: string
  // choice és null quan l'usuari vota plats; 'no_vindré'/'porto_el_meu_menjar' per opcions especials
  // 'omnivora'/'vegetariana'/'vegana' per vots antics (compatibilitat)
  choice: 'omnivora' | 'vegetariana' | 'vegana' | 'porto_el_meu_menjar' | 'no_vindré' | null
  first_course_id: string | null
  second_course_id: string | null
  meal_type: 'dinar' | 'sopar'
  created_at: string
  updated_at: string
}

// Estructura de stats per plat (nova)
export interface DishStats {
  dish_id: string
  dish_name: string
  diet_type: 'omnivora' | 'vegetariana' | 'vegana'
  count: number
  users: string[]
}

export interface MealVoteStats {
  primer: DishStats[]
  segon: DishStats[]
  no_vindré: { count: number; users: string[] }
  porto_el_meu_menjar: { count: number; users: string[] }
  totalCoberts: number
}

export interface VoteStatsByDish {
  dinar: MealVoteStats
  sopar: MealVoteStats
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
    supabase.from('votes').select('user_id, meal_type, choice, first_course_id').eq('date', date),
  ])

  if (!allUsers) return []

  const mealTypesByUser = new Map<string, Set<string>>()
  votes?.forEach((v: { user_id: string; meal_type: string; choice: string | null; first_course_id: string | null }) => {
    // Vot vàlid: té choice (opció especial o vot antic) o first_course_id (vot per plats)
    const hasVoted = v.choice !== null || v.first_course_id !== null
    if (hasVoted) {
      if (!mealTypesByUser.has(v.user_id)) mealTypesByUser.set(v.user_id, new Set())
      mealTypesByUser.get(v.user_id)!.add(v.meal_type)
    }
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

// Nova funció: estadístiques de vots per plat (sistema nou)
function emptyMealStats(): MealVoteStats {
  return {
    primer: [],
    segon: [],
    'no_vindré': { count: 0, users: [] },
    porto_el_meu_menjar: { count: 0, users: [] },
    totalCoberts: 0,
  }
}

// MenuV2: taula nova amb course obligatori (per al nou sistema de votació per plats)
export interface MenuV2 {
  id: string
  dish_name: string
  diet_type: 'omnivora' | 'vegetariana' | 'vegana'
  meal_type: 'dinar' | 'sopar'
  day: 'dilluns' | 'dimarts' | 'dimecres' | 'dijous' | 'divendres' | 'dissabte' | 'diumenge'
  course: 'primer' | 'segon'
  created_at: string
}

export async function getMenusV2(): Promise<MenuV2[]> {
  const { data, error } = await supabase
    .from('menus_v2')
    .select('*')
    .order('day', { ascending: true })
  if (error) { console.error('Error obtenint menus_v2:', error); return [] }
  return data || []
}

export async function createMenuV2(menu: Omit<MenuV2, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('menus_v2')
    .insert([{ ...menu, created_at: new Date().toISOString() }])
    .select()
  if (error) { console.error('Error creant menu_v2:', error); throw error }
  return data?.[0]
}

export async function updateMenuV2(menuId: string, updates: Partial<MenuV2>) {
  const { data, error } = await supabase
    .from('menus_v2')
    .update(updates)
    .eq('id', menuId)
    .select()
  if (error) { console.error('Error actualitzant menu_v2:', error); throw error }
  return data?.[0]
}

export async function deleteMenuV2(menuId: string) {
  const { error } = await supabase
    .from('menus_v2')
    .delete()
    .eq('id', menuId)
  if (error) { console.error('Error eliminant menu_v2:', error); throw error }
}

export async function getVoteStatsByDish(date: string): Promise<VoteStatsByDish> {
  const [votesResult, menusResult] = await Promise.all([
    supabase
      .from('votes')
      .select('*, voter:users!votes_user_id_fkey(name)')
      .eq('date', date),
    supabase.from('menus_v2').select('*'),  // llegim de menus_v2
  ])

  if (votesResult.error) {
    console.error('Error obtenint vots per plat:', votesResult.error)
    return { dinar: emptyMealStats(), sopar: emptyMealStats() }
  }

  const votes = votesResult.data || []
  const menus: MenuV2[] = menusResult.data || []
  const menusMap = new Map(menus.map(m => [m.id, m]))

  const stats: VoteStatsByDish = {
    dinar: emptyMealStats(),
    sopar: emptyMealStats(),
  }

  votes.forEach((vote: {
    choice: string | null
    meal_type: string
    first_course_id: string | null
    second_course_id: string | null
    voter: { name: string } | null
  }) => {
    const mealType = vote.meal_type as 'dinar' | 'sopar'
    const userName = vote.voter?.name || 'Usuari desconegut'

    if (vote.choice === 'no_vindré') {
      stats[mealType]['no_vindré'].count++
      stats[mealType]['no_vindré'].users.push(userName)
    } else if (vote.choice === 'porto_el_meu_menjar') {
      stats[mealType].porto_el_meu_menjar.count++
      stats[mealType].porto_el_meu_menjar.users.push(userName)
    } else if (vote.first_course_id) {
      // Vot per plats (sistema nou)
      stats[mealType].totalCoberts++

      // Primer plat
      const firstMenu = menusMap.get(vote.first_course_id)
      if (firstMenu) {
        let ds = stats[mealType].primer.find(d => d.dish_id === firstMenu.id)
        if (!ds) {
          ds = { dish_id: firstMenu.id, dish_name: firstMenu.dish_name, diet_type: firstMenu.diet_type, count: 0, users: [] }
          stats[mealType].primer.push(ds)
        }
        ds.count++
        ds.users.push(userName)
      }

      // Segon plat
      if (vote.second_course_id) {
        const secondMenu = menusMap.get(vote.second_course_id)
        if (secondMenu) {
          let ds = stats[mealType].segon.find(d => d.dish_id === secondMenu.id)
          if (!ds) {
            ds = { dish_id: secondMenu.id, dish_name: secondMenu.dish_name, diet_type: secondMenu.diet_type, count: 0, users: [] }
            stats[mealType].segon.push(ds)
          }
          ds.count++
          ds.users.push(userName)
        }
      }
    }
    // Vots antics (omnivora/vegetariana/vegana) s'ignoren en el nou sistema
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
    .maybeSingle()
  
  if (error) {
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
