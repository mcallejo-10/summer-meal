'use client'

import { useState, useEffect } from 'react'
import { ChefHat, ArrowLeft, Calendar, FileImage } from 'lucide-react'
import Link from 'next/link'
import { getMenus, type Menu } from '@/lib/supabase'

export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string>('')

  // Obtener día de hoy
  useEffect(() => {
    const today = new Date()
    const todayInCatalan = today.toLocaleDateString('ca-ES', { weekday: 'long' }).toLowerCase()
    setSelectedDay(todayInCatalan)
  }, [])

  useEffect(() => {
    loadMenus()
  }, [])

  const loadMenus = async () => {
    try {
      const menusData = await getMenus()
      setMenus(menusData)
    } catch (error) {
      console.error('Error carregant menús:', error)
    } finally {
      setLoading(false)
    }
  }

  const daysOfWeek = [
    { value: 'dilluns', label: 'Dilluns' },
    { value: 'dimarts', label: 'Dimarts' },
    { value: 'dimecres', label: 'Dimecres' },
    { value: 'dijous', label: 'Dijous' },
    { value: 'divendres', label: 'Divendres' },
    { value: 'dissabte', label: 'Dissabte' },
    { value: 'diumenge', label: 'Diumenge' }
  ]

  const getMenusForDay = (day: string, mealType: 'dinar' | 'sopar') => {
    return menus.filter(menu => menu.day === day && menu.meal_type === mealType)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregant menús...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex flex-col gap-4 mb-4">
              {/* Título y descripción */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ChefHat className="text-orange-500" size={32} />
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                      Menús de la Setmana
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base">
                      Descobreix què tenim preparat cada dia
                    </p>
                  </div>
                </div>
                
                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => window.open('/menu-personal-2025.jpeg', '_blank')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                  >
                    <FileImage size={18} />
                    <span className="text-sm sm:text-base">Veure Menú Complet</span>
                  </button>
                  <Link 
                    href="/" 
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    <ArrowLeft size={18} />
                    <span className="text-sm sm:text-base">Tornar</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Selector de día */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="text-gray-500" size={20} />
                <span className="font-medium text-gray-700">Dia:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.value}
                    onClick={() => setSelectedDay(day.value)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      selectedDay === day.value
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Menús del día seleccionado */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Dinar */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-yellow-600 mb-6 flex items-center gap-3">
                🌞 Dinar
                <span className="text-sm font-normal text-gray-500 capitalize">
                  {daysOfWeek.find(d => d.value === selectedDay)?.label}
                </span>
              </h2>
              
              {getMenusForDay(selectedDay, 'dinar').length > 0 ? (
                <div className="space-y-4">
                  {getMenusForDay(selectedDay, 'dinar').map((menu) => (
                    <div key={menu.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-lg mb-2">
                            {menu.dish_name}
                          </h3>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs text-white font-medium ${getDietTypeColor(menu.diet_type)}`}
                        >
                          {menu.diet_type.charAt(0).toUpperCase() + menu.diet_type.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ChefHat className="mx-auto mb-3 text-gray-300" size={48} />
                  <p>No hi ha menú de dinar per aquest dia</p>
                </div>
              )}
            </div>

            {/* Sopar */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-[#2a747f] mb-6 flex items-center gap-3">
                🌙 Sopar
                <span className="text-sm font-normal text-gray-500 capitalize">
                  {daysOfWeek.find(d => d.value === selectedDay)?.label}
                </span>
              </h2>
              
              {getMenusForDay(selectedDay, 'sopar').length > 0 ? (
                <div className="space-y-4">
                  {getMenusForDay(selectedDay, 'sopar').map((menu) => (
                    <div key={menu.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-lg mb-2">
                            {menu.dish_name}
                          </h3>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs text-white font-medium ${getDietTypeColor(menu.diet_type)}`}
                        >
                          {menu.diet_type.charAt(0).toUpperCase() + menu.diet_type.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ChefHat className="mx-auto mb-3 text-gray-300" size={48} />
                  <p>No hi ha menú de sopar per aquest dia</p>
                </div>
              )}
            </div>
          </div>

          {/* Información adicional */}
          <div className="mt-8 bg-orange-50 border border-orange-200 rounded-lg p-6">
            <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
              <ChefHat size={20} />
              Informació sobre els menús
            </h3>
            <div className="grid gap-3 md:grid-cols-3 text-sm text-orange-700">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span><strong>Omnívora:</strong> Inclou carn i peix</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span><strong>Vegetariana:</strong> Sense carn ni peix</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                <span><strong>Vegana:</strong> Sense productes animals</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
