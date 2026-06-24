'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Settings, ChefHat, BarChart3, Plus, Edit, Trash2, Save, X, LogOut, Copy, Share2, Users, UserPlus, Shield, Mail, UserX, Bell, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import type { Session, User } from '@supabase/supabase-js'
import { 
  getMenusV2,
  createMenuV2,
  updateMenuV2,
  deleteMenuV2,
  getVoteStatsByDish,
  getNotVotedUsers,
  getAppSettings,
  updateAppSetting,
  type Menu,
  type MenuV2,
  type User as AppUser,
  type VoteStatsByDish,
} from '@/lib/supabase'
import { getResultsDate, formatDateToISO, formatDateToCatalan } from '@/lib/dates'

export default function AdminPage() {
  const [selectedTab, setSelectedTab] = useState<'menus' | 'votes' | 'usuaris' | 'config'>('votes')
  const [menus, setMenus] = useState<Menu[]>([])
  const [menusV2, setMenusV2] = useState<MenuV2[]>([])
  const [loadingV2, setLoadingV2] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  
  const todayString = formatDateToISO(getResultsDate());
  
  const [voteStats, setVoteStats] = useState<VoteStatsByDish | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(todayString)
  const [loadingVotes, setLoadingVotes] = useState(false)
  const [notVotedUsers, setNotVotedUsers] = useState<{ id: string; name: string }[]>([])
  const [sendingReminder, setSendingReminder] = useState(false)
  const [reminderResult, setReminderResult] = useState<string | null>(null)
  const [configSettings, setConfigSettings] = useState({ voting_cutoff_hour: 10, results_cutoff_hour: 22 })
  const [savingConfig, setSavingConfig] = useState(false)
  const [configMsg, setConfigMsg] = useState<string | null>(null)
  
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
  const [deleteModal, setDeleteModal] = useState<{ userId: string; userName: string } | null>(null)
  
  // Referencia para el formulario de edición
  const formRef = useRef<HTMLDivElement>(null)
  
  // Formulario para nuevos menús o edición
  const [formData, setFormData] = useState({
    dish_name: '',
    diet_type: 'omnivora' as 'omnivora' | 'vegetariana' | 'vegana',
    meal_type: 'dinar' as 'dinar' | 'sopar',
    day: 'dilluns' as 'dilluns' | 'dimarts' | 'dimecres' | 'dijous' | 'divendres' | 'dissabte' | 'diumenge',
    course: 'primer' as 'primer' | 'segon',
  })

  // Formulari per menus_v2 (nous plats amb primer/segon)
  const [formDataV2, setFormDataV2] = useState({
    dish_name: '',
    diet_type: 'omnivora' as 'omnivora' | 'vegetariana' | 'vegana',
    meal_type: 'dinar' as 'dinar' | 'sopar',
    day: 'dilluns' as MenuV2['day'],
    course: 'primer' as 'primer' | 'segon',
  })
  const [showAddFormV2, setShowAddFormV2] = useState(false)
  const [editingMenuV2, setEditingMenuV2] = useState<MenuV2 | null>(null)
  const formRefV2 = useRef<HTMLDivElement>(null)

  // Función para cargar menús (definida antes de su uso)
  const loadMenus = useCallback(async () => {
    try {
      const menusData = await getMenusV2()
      setMenus(menusData)
    } catch (error) {
      console.error('Error carregant menús:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMenusV2 = useCallback(async () => {
    setLoadingV2(true)
    try {
      const data = await getMenusV2()
      setMenusV2(data)
    } catch (error) {
      console.error('Error carregant menus_v2:', error)
    } finally {
      setLoadingV2(false)
    }
  }, [])

  const loadConfig = useCallback(async () => {
    const s = await getAppSettings()
    setConfigSettings(s)
  }, [])

  useEffect(() => {
    if (selectedTab === 'config') loadConfig()
  }, [selectedTab, loadConfig])

  const handleSaveConfig = async () => {
    setSavingConfig(true)
    setConfigMsg(null)
    try {
      await Promise.all([
        updateAppSetting('voting_cutoff_hour', String(configSettings.voting_cutoff_hour)),
        updateAppSetting('results_cutoff_hour', String(configSettings.results_cutoff_hour)),
      ])
      setConfigMsg('✅ Configuració guardada')
    } catch {
      setConfigMsg('❌ Error guardant la configuració')
    } finally {
      setSavingConfig(false)
    }
  }

  const handleSendReminder = async () => {
    if (!notVotedUsers.length) return
    setSendingReminder(true)
    setReminderResult(null)
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: notVotedUsers.map((u) => u.id) }),
      })
      const data = await res.json()
      setReminderResult(`✅ Recordatori enviat a ${data.sent} dispositiu${data.sent !== 1 ? 's' : ''}`)
    } catch {
      setReminderResult('❌ Error enviant el recordatori')
    } finally {
      setSendingReminder(false)
    }
  }

  // Función para cargar estadísticas de votos i qui no ha votat (en paral·lel)
  const loadVoteStats = useCallback(async (date: string) => {
    setLoadingVotes(true)
    try {
      const [stats, notVoted] = await Promise.all([
        getVoteStatsByDish(date),
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

  // Carregar menus_v2 quan s'obre el tab de menús
  useEffect(() => {
    if (selectedTab === 'menus' && user) {
      loadMenusV2()
    }
  }, [selectedTab, user, loadMenusV2])

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
      day: 'dilluns',
      course: 'primer',
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
        await updateMenuV2(editingMenu.id, formData)
      } else {
        // Crear nuevo menú
        await createMenuV2(formData)
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
      day: menu.day,
      course: menu.course ?? 'primer',
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
      await deleteMenuV2(menuId)
      await loadMenus()
    } catch (error) {
      console.error('Error eliminant menú:', error)
      alert('Error eliminant el menú. Torna-ho a provar.')
    }
  }

  // ── Handlers: menus_v2 ──────────────────────────────────────────────────────

  const resetFormV2 = () => {
    setFormDataV2({ dish_name: '', diet_type: 'omnivora', meal_type: 'dinar', day: 'dilluns', course: 'primer' })
    setShowAddFormV2(false)
    setEditingMenuV2(null)
  }

  const handleSubmitV2 = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingMenuV2) {
        await updateMenuV2(editingMenuV2.id, formDataV2)
      } else {
        await createMenuV2(formDataV2)
      }
      await loadMenusV2()
      resetFormV2()
    } catch {
      alert('Error guardant el plat. Torna-ho a provar.')
    }
  }

  const startEditV2 = (menu: MenuV2) => {
    setFormDataV2({ dish_name: menu.dish_name, diet_type: menu.diet_type, meal_type: menu.meal_type, day: menu.day, course: menu.course })
    setEditingMenuV2(menu)
    setShowAddFormV2(true)
    setTimeout(() => formRefV2.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
  }

  const handleDeleteV2 = async (menuId: string) => {
    if (!confirm('Estàs segur que vols eliminar aquest plat?')) return
    try {
      await deleteMenuV2(menuId)
      await loadMenusV2()
    } catch {
      alert('Error eliminant el plat.')
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
  const handleDeleteUser = (userId: string, userName: string) => {
    setDeleteModal({ userId, userName })
  }

  const confirmDeleteUser = async () => {
    if (!deleteModal) return
    try {
      const res = await fetch(`/api/admin/users?id=${deleteModal.userId}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      await loadAppUsers()
    } catch (e) {
      console.error('Error eliminant usuari:', e)
    } finally {
      setDeleteModal(null)
    }
  }

  // Generar resum per compartir amb el restaurant (nou format per plats)
  const generateSummary = () => {
    if (!voteStats) return ''

    const [year, month, day] = selectedDate.split('-').map(Number);
    const formattedDate = formatDateToCatalan(new Date(year, month - 1, day));
    const dietShort = (d: string) => d === 'omnivora' ? 'O' : d === 'vegetariana' ? 'V' : 'Ve'

    let summary = `📋 Resum per ${formattedDate}\n`;

    (['dinar', 'sopar'] as const).forEach(mealType => {
      const s = voteStats[mealType];
      if (s.primer.length === 0 && s.segon.length === 0) return;

      const emoji = mealType === 'dinar' ? '☀️' : '🌙';
      summary += `\n${emoji} ${mealType === 'dinar' ? 'Dinar' : 'Sopar'}:\n`;

      if (s.primer.length > 0) {
        summary += `Primers:\n`;
        s.primer.forEach(d => {
          summary += `  • ${d.dish_name} (${dietShort(d.diet_type)}): ${d.count}\n`;
        });
      }
      if (s.segon.length > 0) {
        summary += `Segons:\n`;
        s.segon.forEach(d => {
          summary += `  • ${d.dish_name} (${dietShort(d.diet_type)}): ${d.count}\n`;
        });
      }
    });

    return summary.trim();
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
          <div className="flex border-b border-gray-200">
            {([
              { id: 'menus', icon: <ChefHat size={16} />, label: 'Menús' },
              { id: 'votes', icon: <BarChart3 size={16} />, label: 'Resultats' },
              { id: 'usuaris', icon: <Users size={16} />, label: 'Usuaris' },
              { id: 'config', icon: <Settings size={16} />, label: 'Config' },
            ] as { id: 'menus'|'votes'|'usuaris'|'config'; icon: React.ReactNode; label: string }[]).map(({ id, icon, label }) => (
              <button
                key={id}
                onClick={() => setSelectedTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium border-b-2 transition-colors ${
                  selectedTab === id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                {icon}{label}
              </button>
            ))}
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

                    {/* Curs (primer / segon) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Curs del plat
                      </label>
                      <select
                        value={formData.course}
                        onChange={(e) => setFormData({...formData, course: e.target.value as 'primer' | 'segon'})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-500"
                      >
                        <option value="primer">🥗 Primer plat</option>
                        <option value="segon">🍽️ Segon plat</option>
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

        {/* ── Secció menus_v2 (nova taula de plats amb primer/segon) ── */}
        {selectedTab === 'menus' && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Plats Nous (menus_v2)</h2>
                <p className="text-sm text-gray-500 mt-1">Taula de prova — aquí afegeixes els plats amb primer/segon que la gent votarà</p>
              </div>
              <button
                onClick={() => {
                  setShowAddFormV2(true)
                  setTimeout(() => formRefV2.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus size={18} />
                Afegir Plat
              </button>
            </div>

            {showAddFormV2 && (
              <div ref={formRefV2} className="bg-gray-50 rounded-lg p-6 mb-6 border-2 border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {editingMenuV2 ? (
                      <span className="flex items-center gap-2">
                        <Edit size={20} className="text-green-600" />
                        Editant: <span className="text-green-700">{editingMenuV2.dish_name}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Plus size={20} className="text-green-600" />
                        Nou Plat (menus_v2)
                      </span>
                    )}
                  </h3>
                </div>
                <form onSubmit={handleSubmitV2} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom del plat</label>
                      <input
                        type="text"
                        value={formDataV2.dish_name}
                        onChange={(e) => setFormDataV2({...formDataV2, dish_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-500"
                        placeholder="Ex: Pasta amb tomàquet"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dia de la setmana</label>
                      <select
                        value={formDataV2.day}
                        onChange={(e) => setFormDataV2({...formDataV2, day: e.target.value as MenuV2['day']})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-500"
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipus de menjar</label>
                      <select
                        value={formDataV2.meal_type}
                        onChange={(e) => setFormDataV2({...formDataV2, meal_type: e.target.value as 'dinar' | 'sopar'})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-500"
                      >
                        <option value="dinar">Dinar</option>
                        <option value="sopar">Sopar</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipus de dieta</label>
                      <select
                        value={formDataV2.diet_type}
                        onChange={(e) => setFormDataV2({...formDataV2, diet_type: e.target.value as 'omnivora' | 'vegetariana' | 'vegana'})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-500"
                      >
                        <option value="omnivora">Omnívora</option>
                        <option value="vegetariana">Vegetariana</option>
                        <option value="vegana">Vegana</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Curs del plat</label>
                      <select
                        value={formDataV2.course}
                        onChange={(e) => setFormDataV2({...formDataV2, course: e.target.value as 'primer' | 'segon'})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-500"
                      >
                        <option value="primer">🥗 Primer plat</option>
                        <option value="segon">🍽️ Segon plat</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      <Save size={18} />
                      {editingMenuV2 ? 'Actualitzar' : 'Guardar'}
                    </button>
                    <button type="button" onClick={resetFormV2} className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                      <X size={18} />
                      Cancel·lar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loadingV2 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregant plats...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {menusV2.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    Encara no hi ha plats a menus_v2. Afegeix-ne per provar la votació!
                  </p>
                ) : (
                  menusV2.map((menu) => (
                    <div
                      key={menu.id}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                        editingMenuV2?.id === menu.id
                          ? 'bg-green-50 border-green-300 shadow-md'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-lg">{menu.course === 'primer' ? '🥗' : '🍽️'}</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{menu.dish_name}</h4>
                          <div className="flex gap-3 text-sm text-gray-600 mt-1 flex-wrap">
                            <span className="capitalize">{menu.day}</span>
                            <span className="capitalize">{menu.meal_type}</span>
                            <span className="capitalize font-medium text-green-700">{menu.course}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs text-white ${
                              menu.diet_type === 'omnivora' ? 'bg-red-500' :
                              menu.diet_type === 'vegetariana' ? 'bg-green-500' :
                              'bg-emerald-500'
                            }`}>
                              {menu.diet_type}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditV2(menu)}
                          className={`p-2 rounded-lg transition-colors ${
                            editingMenuV2?.id === menu.id
                              ? 'text-green-700 bg-green-100'
                              : 'text-blue-600 hover:bg-blue-100'
                          }`}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteV2(menu.id)}
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

        {selectedTab === 'config' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Clock size={22} className="text-orange-500" />
              Configuració de Deadlines
            </h2>

            <div className="space-y-6 max-w-sm">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ⏰ Hora límit de votació
                </label>
                <p className="text-xs text-gray-600 mb-2">Abans d&apos;aquesta hora es vota per avui, després per demà</p>
                <select
                  value={configSettings.voting_cutoff_hour}
                  onChange={(e) => setConfigSettings(s => ({ ...s, voting_cutoff_hour: parseInt(e.target.value) }))}
                  className="border border-gray-300 text-gray-700 rounded-lg px-3 py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, '0')}:00 h</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🌙 Hora límit de resultats
                </label>
                <p className="text-xs text-gray-600 mb-2">A partir d&apos;aquesta hora els resultats mostren el dia següent</p>
                <select
                  value={configSettings.results_cutoff_hour}
                  onChange={(e) => setConfigSettings(s => ({ ...s, results_cutoff_hour: parseInt(e.target.value) }))}
                  className="border border-gray-300 text-gray-700 rounded-lg px-3 py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, '0')}:00 h</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                <Save size={16} />
                {savingConfig ? 'Guardant...' : 'Guardar canvis'}
              </button>

              {configMsg && (
                <p className="text-sm text-gray-700">{configMsg}</p>
              )}
            </div>
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
            ) : voteStats ? (
              <div className="space-y-8">
                {/* Resum per compartir */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex flex-wrap items-center justify-between mb-3">
                    <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                      <Share2 size={18} />
                      Resum dels vots per restaurant
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={copyToClipboard} className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">
                        <Copy size={14} /> Copiar
                      </button>
                      <button onClick={shareWhatsApp} className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors">
                        <Share2 size={14} /> WhatsApp
                      </button>
                    </div>
                  </div>
                  <div className="bg-white rounded p-3 text-sm text-gray-700 font-mono whitespace-pre-line border">
                    {generateSummary()}
                  </div>
                </div>

                {/* Stats detallats per dinar i sopar */}
                {(['dinar', 'sopar'] as const).map(mealType => {
                  const s = voteStats[mealType];
                  const hasData = s.primer.length > 0 || s.segon.length > 0 ||
                    s['no_vindré'].count > 0 || s.porto_el_meu_menjar.count > 0;
                  if (!hasData) return null;

                  const mealColor = mealType === 'dinar' ? 'text-yellow-600' : 'text-[#2a747f]';
                  const pillColor = mealType === 'dinar' ? 'bg-yellow-100 text-yellow-800' : 'bg-teal-100 text-[#2a747f]';

                  const renderDishList = (dishes: typeof s.primer, label: string) => (
                    dishes.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-700 mb-2">{label}</h4>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {dishes.map(dish => (
                            <div key={dish.dish_id} className="bg-gray-50 rounded-lg p-3 border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-800 text-sm">{dish.dish_name}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-1.5 py-0.5 rounded-full text-xs text-white ${
                                    dish.diet_type === 'omnivora' ? 'bg-red-500' :
                                    dish.diet_type === 'vegetariana' ? 'bg-green-500' : 'bg-emerald-500'
                                  }`}>
                                    {dish.diet_type === 'omnivora' ? 'O' : dish.diet_type === 'vegetariana' ? 'V' : 'Ve'}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${pillColor}`}>
                                    {dish.count}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {dish.users.map((u, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-white rounded text-xs text-gray-600 border">{u}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  );

                  return (
                    <div key={mealType} className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-xl font-bold capitalize ${mealColor}`}>
                          {mealType === 'dinar' ? '☀️ Dinar' : '🌙 Sopar'}
                        </h3>
                        {s.totalCoberts > 0 && (
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${pillColor}`}>
                            {s.totalCoberts} cobert{s.totalCoberts !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {renderDishList(s.primer, '🥗 Primers')}
                      {renderDishList(s.segon, '🍽️ Segons')}

                      {/* Opcions especials */}
                      {(s['no_vindré'].count > 0 || s.porto_el_meu_menjar.count > 0) && (
                        <div className="grid gap-3 md:grid-cols-2">
                          {s['no_vindré'].count > 0 && (
                            <div className="bg-gray-50 rounded-lg p-3 border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-700 text-sm">❌ No vindrà</span>
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{s['no_vindré'].count}</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {s['no_vindré'].users.map((u, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-white rounded text-xs text-gray-600 border">{u}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {s.porto_el_meu_menjar.count > 0 && (
                            <div className="bg-gray-50 rounded-lg p-3 border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-700 text-sm">🥪 Porta menjar</span>
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">{s.porto_el_meu_menjar.count}</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {s.porto_el_meu_menjar.users.map((u, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-white rounded text-xs text-gray-600 border">{u}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
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
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <UserX size={20} className="text-red-500" />
                    Qui no ha votat
                    {notVotedUsers.length > 0 && (
                      <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-700 text-sm rounded-full font-medium">
                        {notVotedUsers.length}
                      </span>
                    )}
                  </h3>
                  {notVotedUsers.length > 0 && (
                    <button
                      onClick={handleSendReminder}
                      disabled={sendingReminder}
                      className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50 transition-colors"
                    >
                      <Bell size={14} />
                      {sendingReminder ? 'Enviant...' : 'Enviar recordatori'}
                    </button>
                  )}
                </div>
                {reminderResult && (
                  <p className="text-sm mb-3 text-gray-700">{reminderResult}</p>
                )}

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

    {deleteModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 size={18} className="text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Eliminar usuari</h2>
          </div>
          <p className="text-gray-600 mb-1">Segur que vols eliminar <span className="font-semibold text-gray-800">{deleteModal.userName}</span>?</p>
          <p className="text-sm text-red-500 mb-6">Tots els seus vots s&apos;eliminaran i no es pot desfer.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteModal(null)}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel·lar
            </button>
            <button
              onClick={confirmDeleteUser}
              className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  )
}
