'use client'

import { useState, useEffect } from 'react'
import { Calendar, ChefHat } from 'lucide-react'
import { getMenus, type Menu } from '@/lib/supabase'

// Ordre dels dies de la setmana
const DAYS_ORDER = ['dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte', 'diumenge']

const DAYS_LABELS = {
  'dilluns': 'Dilluns',
  'dimarts': 'Dimarts', 
  'dimecres': 'Dimecres',
  'dijous': 'Dijous',
  'divendres': 'Divendres',
  'dissabte': 'Dissabte',
  'diumenge': 'Diumenge'
}

export default function MenuPage() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMenus()
  }, [])

  const loadMenus = async () => {
    try {
      const menuData = await getMenus()
      setMenus(menuData || [])
    } catch (error) {
      console.error('Error carregant menús:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDietTypeColor = (dietType: string) => {
    switch (dietType) {
      case 'omnivora':
        return 'bg-red-500'
      case 'vegetariana':
        return 'bg-green-500'
      case 'vegana':
        return 'bg-emerald-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Organitzar menús per dia i tipus de menjar
  const organizeMenusByDay = () => {
    const organized: Record<string, { dinar: Menu[], sopar: Menu[] }> = {}
    
    DAYS_ORDER.forEach(day => {
      organized[day] = { dinar: [], sopar: [] }
    })

    menus.forEach(menu => {
      if (organized[menu.day]) {
        organized[menu.day][menu.meal_type].push(menu)
      }
    })

    return organized
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregant menús...</p>
        </div>
      </div>
    )
  }

  const organizedMenus = organizeMenusByDay()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
            <Calendar className="text-blue-500" size={36} />
            Menú Setmanal
          </h1>
          <p className="text-gray-600 text-lg">
            El mateix menú es repeteix cada setmana
          </p>
        </div>

        <div className="grid gap-6">
          {DAYS_ORDER.map((day) => {
            const dayMenus = organizedMenus[day]
            const hasMenus = dayMenus.dinar.length > 0 || dayMenus.sopar.length > 0

            if (!hasMenus) return null

            return (
              <div key={day} className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <ChefHat className="text-orange-500" size={24} />
                  {DAYS_LABELS[day as keyof typeof DAYS_LABELS]}
                </h2>

                {/* Dinar */}
                {dayMenus.dinar.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-orange-600 mb-3 flex items-center gap-2">
                      🍽️ Dinar
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {dayMenus.dinar.map((menu) => (
                        <div
                          key={menu.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-gray-800 text-sm">
                              {menu.dish_name}
                            </h4>
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs text-white ${getDietTypeColor(
                                menu.diet_type
                              )}`}
                            >
                              {menu.diet_type.charAt(0).toUpperCase() + menu.diet_type.slice(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sopar */}
                {dayMenus.sopar.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-purple-600 mb-3 flex items-center gap-2">
                      🌙 Sopar
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {dayMenus.sopar.map((menu) => (
                        <div
                          key={menu.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-gray-800 text-sm">
                              {menu.dish_name}
                            </h4>
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs text-white ${getDietTypeColor(
                                menu.diet_type
                              )}`}
                            >
                              {menu.diet_type.charAt(0).toUpperCase() + menu.diet_type.slice(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {menus.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No hi ha menús configurats encara.</p>
            <p className="text-gray-400 text-sm mt-2">Contacta amb l&apos;administrador per afegir menús.</p>
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Informació important</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Aquest menú es repeteix cada setmana</li>
            <li>• Les votacions tanquen a les 15:00 del dia anterior</li>
            <li>• Per al·lèrgies o intoleràncies, contacta amb l&apos;administrador</li>
            <li>• Els plats vegans estan lliures de productes d&apos;origen animal</li>
            <li>• Sempre pots triar &quot;Porto el meu menjar&quot; o &quot;No vindré&quot;</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
