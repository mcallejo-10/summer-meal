'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Settings, ChefHat, BarChart3, Plus, Edit, Trash2, Save, X, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-auth'
import { 
  getMenus, 
  createMenu, 
  updateMenu, 
  deleteMenu,
  type Menu 
} from '@/lib/supabase'

export default function AdminPage() {
  const [selectedTab, setSelectedTab] = useState<'menus' | 'votes'>('menus')
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  
  const router = useRouter()
  const supabase = createClient()
  
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user)
        setAuthLoading(false)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [checkAuth, router, supabase.auth])

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
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <LogOut size={18} />
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

        {selectedTab === 'votes' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Resultats de Vots
            </h2>
            <p className="text-gray-600">
              Aquí podràs veure els resultats dels vots en temps real.
            </p>
            {/* Aquí agregaremos la visualización de votos en el siguiente paso */}
          </div>
        )}
      </div>
    </div>
  )
}
