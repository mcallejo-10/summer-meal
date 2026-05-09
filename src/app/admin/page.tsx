'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Settings, ChefHat, BarChart3, Plus, Edit, Trash2, Save, X, LogOut, Copy, Share2, Users, UserPlus, Shield, Mail, UserX } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import type { Session, User } from '@supabase/supabase-js'
import { 
  getMenus, 
  createMenu, 
  updateMenu, 
  deleteMenu,
  getVoteStats,
  getNotVotedUsers,
  type Menu,
  type User as AppUser,
} from '@/lib/supabase'
import { getResultsDate, formatDateToISO, formatDateToCatalan } from '@/lib/dates'

export default function AdminPage() {
  const [selectedTab, setSelectedTab] = useState<'menus' | 'votes' | 'usuaris'>('menus')
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  
  const todayString = formatDateToISO(getResultsDate());
  
  interface VoteStats {
    [meal_type: string]: {
      [choice: string]: {
        count: number
        users: string[]
      }
    }
  }
  
  const [voteStats, setVoteStats] = useState<VoteStats | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(todayString)
  const [loadingVotes, setLoadingVotes] = useState(false)
  const [notVotedUsers, setNotVotedUsers] = useState<{ id: string; name: string }[]>([])
  
  const router = useRouter()
  const supabase = createClient()

  // ── Estat: gestió d'usuaris ─────────────────────────────────────────────────
  const [appUsers, setAppUsers] = useState<AppUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', is_admin: false })
  const [inviteSending, setInviteSending] = useState(false)
  const [usersMsg, setUsersMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  
  // Referencia para el formulario de edición
  const formRef = useRef<HTMLDivElement>(null)
  
  // Formulario para nuevos menús o edición
  const [formData, setFormData] = useState({
    dish_name: '',
    diet_type: 'omnivora' as 'omnivora' | 'vegetariana' | 'vegana',
    meal_type: 'dinar' as 'dinar' | 'sopar',
    day: 'dilluns' as 'dilluns' | 'dimarts' | 'dimecres' | 'dijous' | 'divendres' | 'dissabte' | 'diumenge'
  })

  // Función para cargar menús (definida antes de su uso)
  const loadMenus = useCallback(async () => {
    try {
      const menusData = await getMenus()
      setMenus(menusData)
    } catch (error) {
      console.error('Error carregant menús:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Función para cargar estadísticas de votos i qui no ha votat (en paral·lel)
  const loadVoteStats = useCallback(async (date: string) => {
    setLoadingVotes(true)
    try {
      const [stats, notVoted] = await Promise.all([
        getVoteStats(date),
        getNotVotedUsers(date),
      ])
      setVoteStats(stats)
      setNotVotedUsers(notVoted)
    } catch (error) {
      console.error('Error carregant estadístiques de vots:', error)
    } finally {
      setLoadingVotes(false)
    }
  }, [])

  // Verificar estado de autenticación
  const checkAuth = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUser(user)
        await loadMenus() // Solo cargar menús si está autenticado
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error)
      router.push('/login')
    } finally {
      setAuthLoading(false)
    }
  }, [router, supabase.auth, loadMenus])

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuth()
    
    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user || null)
        setAuthLoading(false)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [checkAuth, router, supabase.auth])

  // Cargar estadísticas cuando cambie la fecha o la pestaña
  useEffect(() => {
    if (selectedTab === 'votes' && user) {
      loadVoteStats(selectedDate)
    }
  }, [selectedTab, selectedDate, user, loadVoteStats])

  // Carrega la llista d'usuaris cridant la nostra API Route (servidor).
  // useCallback aquí (no al final) perquè els Hooks sempre han d'estar
  // al màxim nivell del component, mai després d'un 'return' anticipat.
  const loadAppUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      setAppUsers(data)
    } catch (e) {
      console.error('Error carregant usuaris:', e)
    } finally {
      setUsersLoading(false)
    }
  }, [])

  // appUsers.length === 0 evita tornar a carregar si ja els tenim.
  useEffect(() => {
    if (selectedTab === 'usuaris' && appUsers.length === 0) {
      loadAppUsers()
    }
  }, [selectedTab, appUsers.length, loadAppUsers])

  // Cerrar sesión
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error cerrando sesión:', error)
    }
  }

  // Si está cargando la autenticación, mostrar loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificant autenticació...</p>
        </div>
      </div>
    )
  }

  // Si no está autenticado, no mostrar nada (se redirigirá)
  if (!user) {
    return null
  }

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      dish_name: '',
      diet_type: 'omnivora',
      meal_type: 'dinar',
      day: 'dilluns'
    })
    setShowAddForm(false)
    setEditingMenu(null)
  }

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingMenu) {
        // Actualizar menú existente
        await updateMenu(editingMenu.id, formData)
      } else {
        // Crear nuevo menú
        await createMenu(formData)
      }
      
      // Recargar menús y resetear formulario
      await loadMenus()
      resetForm()
    } catch (error) {
      console.error('Error guardant menú:', error)
      alert('Error guardant el menú. Torna-ho a provar.')
    }
  }

  // Iniciar edición de un menú
  const startEdit = (menu: Menu) => {
    setFormData({
      dish_name: menu.dish_name,
      diet_type: menu.diet_type,
      meal_type: menu.meal_type,
      day: menu.day
    })
    setEditingMenu(menu)
    setShowAddForm(true)
    
    // Scroll suave al formulario después de un pequeño delay
    setTimeout(() => {
      formRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      })
    }, 100)
  }

  // Eliminar un menú
  const handleDelete = async (menuId: string) => {
    if (!confirm('Estàs segur que vols eliminar aquest plat?')) return
    
    try {
      await deleteMenu(menuId)
      await loadMenus()
    } catch (error) {
      console.error('Error eliminant menú:', error)
      alert('Error eliminant el menú. Torna-ho a provar.')
    }
  }

  // ── Handlers: gestió d'usuaris ───────────────────────────────────────────────

  // Envia el formulari de convit a l'API Route.
  // L'API crida inviteUserByEmail de Supabase → l'usuari rep un email.
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteSending(true)
    setUsersMsg(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUsersMsg({ type: 'ok', text: `✅ Invitació enviada a ${inviteForm.email}!` })
      setInviteForm({ name: '', email: '', is_admin: false })
      setShowInviteForm(false)
      await loadAppUsers()
    } catch (e: unknown) {
      setUsersMsg({ type: 'err', text: e instanceof Error ? e.message : 'Error enviant invitació' })
    } finally {
      setInviteSending(false)
    }
  }

  // Desa els canvis de nom o rol cridant PATCH a l'API Route.
  const handleUpdateUser = async (u: AppUser) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id, name: u.name, is_admin: u.is_admin }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      setEditingUser(null)
      await loadAppUsers()
    } catch (e) {
      console.error('Error actualitzant usuari:', e)
    }
  }

  // Elimina l'usuari cridant DELETE a l'API Route.
  // La FK ON DELETE CASCADE elimina de public.users i tots els seus vots.
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Segur que vols eliminar ${userName}?\nTots els seus vots s'eliminaran.`)) return
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      await loadAppUsers()
    } catch (e) {
      console.error('Error eliminant usuari:', e)
    }
  }

  // Generar resumen para compartir con el restaurante
  const generateSummary = () => {
    if (!voteStats) return ''
    
    const [year, month, day] = selectedDate.split('-').map(Number);
    const formattedDate = formatDateToCatalan(new Date(year, month - 1, day));
    
    let summary = `📋 Resum per ${formattedDate}\n\n`
    
    Object.entries(voteStats).forEach(([mealType, choices]) => {
      if (Object.keys(choices).length === 0) return
      
      const mealName = mealType === 'dinar' ? 'Dinar' : 'Sopar'
      const mealEmoji = mealType === 'dinar' ? '☀️' : '🌙'
      
      summary += `${mealEmoji} ${mealName}: `
      
      const counts = {
        omnivora: 0,
        vegetariana: 0,
        vegana: 0
      }
      
      Object.entries(choices).forEach(([choice, data]) => {
        if (choice in counts) {
          counts[choice as keyof typeof counts] = data.count
        }
      })
      
      const parts = []
      if (counts.omnivora > 0) parts.push(`${counts.omnivora} omnívors`)
      if (counts.vegetariana > 0) parts.push(`${counts.vegetariana} vegetarians`)
      if (counts.vegana > 0) parts.push(`${counts.vegana} vegans`)
      
      if (parts.length > 0) {
        summary += parts.join(', ')
      } else {
        summary += 'Cap vot registrat'
      }
      
      summary += '\n'
    })
    
    return summary.trim()
  }

  // Copiar resumen al portapapeles
  const copyToClipboard = async () => {
    const summary = generateSummary()
    try {
      await navigator.clipboard.writeText(summary)
      alert('Resumen copiado al portapapeles!')
    } catch (error) {
      console.error('Error copiando al portapapeles:', error)
      alert('Error copiando al portapapeles')
    }
  }

  // Compartir por WhatsApp
  const shareWhatsApp = () => {
    const summary = generateSummary()
    const encodedText = encodeURIComponent(summary)
    const whatsappUrl = `https://wa.me/?text=${encodedText}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header del panel de admin */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="text-orange-500" size={32} />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800">
                Panell d&apos;Administració
              </h1>
              <p className="text-gray-600">
                Gestiona els menús i visualitza els resultats dels vots
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-2 py-2 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
            >
              <LogOut size={12}  />
              Tancar Sessió
            </button>
          </div>

          {/* Pestañas de navegación */}
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setSelectedTab('menus')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                selectedTab === 'menus'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <ChefHat className="inline mr-2" size={18} />
              Gestió de Menús
            </button>
            <button
              onClick={() => setSelectedTab('votes')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                selectedTab === 'votes'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <BarChart3 className="inline mr-2" size={18} />
              Resultats de Vots
            </button>
            <button
              onClick={() => setSelectedTab('usuaris')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                selectedTab === 'usuaris'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <Users className="inline mr-2" size={18} />
              Usuaris
            </button>
          </div>
        </div>

        {/* Contenido de las pestañas */}
        {selectedTab === 'menus' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                Gestió de Menús
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(true)
                  // Scroll suave al formulario después de un pequeño delay
                  setTimeout(() => {
                    formRef.current?.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'center' 
                    })
                  }, 100)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus size={18} />
                Afegir Plat
              </button>
            </div>

            {/* Formulario para agregar/editar */}
            {showAddForm && (
              <div ref={formRef} className="bg-gray-50 rounded-lg p-6 mb-6 border-2 border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {editingMenu ? (
                      <span className="flex items-center gap-2">
                        <Edit size={20} className="text-orange-500" />
                        Editant: <span className="text-orange-600">{editingMenu.dish_name}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Plus size={20} className="text-green-500" />
                        Afegir Nou Plat
                      </span>
                    )}
                  </h3>
                  {editingMenu && (
                    <div className="text-xs text-gray-500 bg-orange-100 px-2 py-1 rounded">
                      {editingMenu.day} • {editingMenu.meal_type} • {editingMenu.diet_type}
                    </div>
                  )}
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nombre del plato */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom del plat
                      </label>
                      <input
                        type="text"
                        value={formData.dish_name}
                        onChange={(e) => setFormData({...formData, dish_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-500"
                        placeholder="Ex: Pasta amb tomàquet"
                        required
                      />
                    </div>

                    {/* Día de la semana */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dia de la setmana
                      </label>
                      <select
                        value={formData.day}
                        onChange={(e) => setFormData({...formData, day: e.target.value as typeof formData.day})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-500"
                      >
                        <option value="dilluns">Dilluns</option>
                        <option value="dimarts">Dimarts</option>
                        <option value="dimecres">Dimecres</option>
                        <option value="dijous">Dijous</option>
                        <option value="divendres">Divendres</option>
                        <option value="dissabte">Dissabte</option>
                        <option value="diumenge">Diumenge</option>
                      </select>
                    </div>

                    {/* Tipo de comida */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipus de menjar
                      </label>
                      <select
                        value={formData.meal_type}
                        onChange={(e) => setFormData({...formData, meal_type: e.target.value as typeof formData.meal_type})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-500"
                      >
                        <option value="dinar">Dinar</option>
                        <option value="sopar">Sopar</option>
                      </select>
                    </div>

                    {/* Tipo de dieta */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipus de dieta
                      </label>
                      <select
                        value={formData.diet_type}
                        onChange={(e) => setFormData({...formData, diet_type: e.target.value as typeof formData.diet_type})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-500"
                      >
                        <option value="omnivora">Omnívora</option>
                        <option value="vegetariana">Vegetariana</option>
                        <option value="vegana">Vegana</option>
                      </select>
                    </div>
                  </div>

                  {/* Botones del formulario */}
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Save size={18} />
                      {editingMenu ? 'Actualitzar' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <X size={18} />
                      Cancel·lar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Lista de menús */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregant menús...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {menus.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    No hi ha menús configurats. Afegeix el primer plat!
                  </p>
                ) : (
                  menus.map((menu) => (
                    <div
                      key={menu.id}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                        editingMenu?.id === menu.id 
                          ? 'bg-orange-50 border-orange-300 shadow-md' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {editingMenu?.id === menu.id && (
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">
                            {menu.dish_name}
                          </h4>
                          <div className="flex gap-4 text-sm text-gray-600 mt-1">
                            <span className="capitalize">{menu.day}</span>
                            <span className="capitalize">{menu.meal_type}</span>
                            <span 
                              className={`px-2 py-1 rounded-full text-xs text-white ${
                                menu.diet_type === 'omnivora' ? 'bg-red-500' :
                                menu.diet_type === 'vegetariana' ? 'bg-green-500' :
                                'bg-emerald-500'
                              }`}
                            >
                              {menu.diet_type}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(menu)}
                          className={`p-2 rounded-lg transition-colors ${
                            editingMenu?.id === menu.id
                              ? 'text-orange-600 bg-orange-100'
                              : 'text-blue-600 hover:bg-blue-100'
                          }`}
                          title={editingMenu?.id === menu.id ? 'Editant aquest plat' : 'Editar plat'}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(menu.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'usuaris' && (
          <div className="bg-white rounded-lg shadow-lg p-6">

            {/* Capçalera del tab */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Gestió d&apos;Usuaris</h2>
              <button
                onClick={() => { setShowInviteForm(!showInviteForm); setUsersMsg(null) }}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <UserPlus size={18} />
                Convidar Usuari
              </button>
            </div>

            {/* Missatge d'èxit o error */}
            {usersMsg && (
              <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
                usersMsg.type === 'ok'
                  ? 'bg-green-100 border border-green-300 text-green-700'
                  : 'bg-red-100 border border-red-300 text-red-700'
              }`}>
                {usersMsg.text}
              </div>
            )}

            {/* Formulari de convit */}
            {showInviteForm && (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Mail size={20} className="text-orange-500" />
                  Convidar nou usuari
                </h3>
                <form onSubmit={handleInviteUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                    <input
                      type="text"
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-700"
                      placeholder="Ex: Jordi Garcia"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-700"
                      placeholder="jordi@empresa.com"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="invite_is_admin"
                      checked={inviteForm.is_admin}
                      onChange={(e) => setInviteForm({ ...inviteForm, is_admin: e.target.checked })}
                      className="w-4 h-4 text-orange-500 rounded"
                    />
                    <label htmlFor="invite_is_admin" className="text-sm font-medium text-gray-700">
                      Rol d&apos;administrador
                    </label>
                  </div>
                  <div className="flex gap-3 md:col-span-2">
                    <button
                      type="submit"
                      disabled={inviteSending}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition-colors"
                    >
                      <Mail size={18} />
                      {inviteSending ? 'Enviant...' : 'Enviar invitació'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowInviteForm(false); setUsersMsg(null) }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <X size={18} />
                      Cancel·lar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Llista d'usuaris */}
            {usersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregant usuaris...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appUsers.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No hi ha usuaris registrats.</p>
                ) : (
                  appUsers.map((u) => (
                    <div
                      key={u.id}
                      className={`flex items-center p-4 rounded-lg border transition-all ${
                        editingUser?.id === u.id
                          ? 'bg-orange-50 border-orange-300 shadow-md'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {editingUser?.id === u.id ? (
                        // ── Mode edició inline ───────────────────────────────────
                        <form
                          onSubmit={(e) => { e.preventDefault(); handleUpdateUser(editingUser) }}
                          className="flex flex-1 items-center gap-3 flex-wrap"
                        >
                          <input
                            type="text"
                            value={editingUser.name}
                            onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                            className="px-3 py-1.5 border border-orange-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 text-gray-700"
                            required
                          />
                          <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={editingUser.is_admin}
                              onChange={(e) => setEditingUser({ ...editingUser, is_admin: e.target.checked })}
                              className="w-4 h-4 text-orange-500"
                            />
                            Admin
                          </label>
                          <div className="flex gap-2 ml-auto">
                            <button type="submit" className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="Desar">
                              <Save size={16} />
                            </button>
                            <button type="button" onClick={() => setEditingUser(null)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Cancel·lar">
                              <X size={16} />
                            </button>
                          </div>
                        </form>
                      ) : (
                        // ── Mode lectura ─────────────────────────────────────────
                        <>
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800">{u.name}</span>
                                {u.is_admin && (
                                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium flex items-center gap-1">
                                    <Shield size={10} />
                                    Admin
                                  </span>
                                )}
                              </div>
                              <span className="text-sm text-gray-500">{u.email}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingUser(u)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Editar usuari"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Eliminar usuari"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'votes' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                Resultats de Vots
              </h2>
              <div className="flex items-center gap-4">
                <label className="font-medium text-gray-700">
                  Data:
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 text-gray-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {loadingVotes ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <p className="mt-2 text-gray-600">Carregant estadístiques...</p>
              </div>
            ) : voteStats && Object.keys(voteStats).length > 0 ? (
              <div className="space-y-8">
                {/* Resumen para compartir */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 ">
                  <div className="flex flex-wrap items-center justify-between mb-3">
                    <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                      <Share2 size={18} />
                      Resum dels vots per restaurant
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                      >
                        <Copy size={14} />
                        Copiar
                      </button>
                      <button
                        onClick={shareWhatsApp}
                        className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                      >
                        <Share2 size={14} />
                        WhatsApp
                      </button>
                    </div>
                  </div>
                  <div className="bg-white rounded p-3 text-sm text-gray-700 font-mono whitespace-pre-line border">
                    {generateSummary()}
                  </div>
                </div>

                {/* Estadísticas detalladas */}
                {Object.entries(voteStats).map(([mealType, choices]) => (
                  <div key={mealType} className="border rounded-lg p-6">
                    <h3 className={`text-xl font-bold mb-4 capitalize ${
                      mealType === 'dinar' ? 'text-yellow-600' : 'text-[#2a747f]'
                    }`}>
                      {mealType === 'dinar' ? '☀️ Dinar' : '🌙 Sopar'}
                    </h3>
                    
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(choices).map(([choice, data]) => (
                        <div key={choice} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-800 text-lg">
                              {choice}
                            </h4>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                              mealType === 'dinar' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-teal-100 text-[#2a747f]'
                            }`}>
                              {data.count} {data.count === 1 ? 'vot' : 'vots'}
                            </span>
                          </div>
                          
                          {data.users.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-600 mb-2">
                                Persones:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {data.users.map((user, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-white rounded text-xs text-gray-700 border"
                                  >
                                    {user}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <strong>Total de vots per {mealType}:</strong> {' '}
                        {Object.values(choices).reduce((sum, data) => sum + data.count, 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="mx-auto text-gray-400 mb-4" size={64} />
                <p className="text-gray-600">
                  No hi ha vots registrats per aquesta data.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Prova amb una altra data o assegura&apos;t que hi hagi menús disponibles.
                </p>
              </div>
            )}

            {/* Qui no ha votat */}
            {!loadingVotes && (
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <UserX size={20} className="text-red-500" />
                  Qui no ha votat
                  {notVotedUsers.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-700 text-sm rounded-full font-medium">
                      {notVotedUsers.length}
                    </span>
                  )}
                </h3>

                {notVotedUsers.length === 0 ? (
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
                    ✅ Tothom ha votat per aquesta data!
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {notVotedUsers.map((u) => (
                      <span
                        key={u.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-full text-sm font-medium"
                      >
                        <UserX size={12} />
                        {u.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
