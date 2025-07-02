'use client'

import { useState } from 'react'
import { Calendar, ChefHat, Clock } from 'lucide-react'

// Datos temporales del menú
const mockMenus = [
  {
    id: '1',
    date: '2025-07-03',
    meals: [
      { id: '1', name: 'Paella Valenciana', description: 'Paella tradicional con pollo y verduras', meal_type: 'omnivora' as const },
      { id: '2', name: 'Ensalada Buddha Bowl', description: 'Bowl con quinoa, aguacate y verduras', meal_type: 'vegetariana' as const },
      { id: '3', name: 'Curry de Garbanzos', description: 'Curry vegano con leche de coco', meal_type: 'vegana' as const },
    ]
  },
  {
    id: '2',
    date: '2025-07-04',
    meals: [
      { id: '4', name: 'Pollo al curry', description: 'Pollo tierno con salsa de curry suave', meal_type: 'omnivora' as const },
      { id: '5', name: 'Lasaña de verduras', description: 'Lasaña con berenjena, calabacín y queso', meal_type: 'vegetariana' as const },
      { id: '6', name: 'Bowl de Tofu', description: 'Tofu marinado con verduras salteadas', meal_type: 'vegana' as const },
    ]
  },
  {
    id: '3',
    date: '2025-07-05',
    meals: [
      { id: '7', name: 'Pescado al horno', description: 'Pescado fresco con patatas y hierbas', meal_type: 'omnivora' as const },
      { id: '8', name: 'Risotto de setas', description: 'Risotto cremoso con setas de temporada', meal_type: 'vegetariana' as const },
      { id: '9', name: 'Lentejas especiadas', description: 'Lentejas con especias del mediterráneo', meal_type: 'vegana' as const },
    ]
  }
]

export default function MenuPage() {
  const [selectedWeek, setSelectedWeek] = useState('current')

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getMealTypeColor = (mealType: string) => {
    switch (mealType) {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
            <Calendar className="text-blue-500" size={36} />
            Menú Semanal
          </h1>
          <p className="text-gray-600 text-lg">
            Consulta los platos disponibles para los próximos días
          </p>
        </div>

        <div className="mb-6">
          <div className="flex justify-center">
            <div className="bg-white rounded-lg p-2 shadow-md">
              <button
                onClick={() => setSelectedWeek('current')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  selectedWeek === 'current'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Esta semana
              </button>
              <button
                onClick={() => setSelectedWeek('next')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  selectedWeek === 'next'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Próxima semana
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {mockMenus.map((dayMenu) => (
            <div key={dayMenu.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="text-orange-500" size={24} />
                <h2 className="text-xl font-bold text-gray-800">
                  {formatDate(dayMenu.date)}
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {dayMenu.meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {meal.name}
                      </h3>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs text-white ${getMealTypeColor(
                          meal.meal_type
                        )}`}
                      >
                        {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {meal.description}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <ChefHat size={16} className="text-gray-400" />
                      <span className="text-xs text-gray-500">
                        Preparado fresh del día
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Información importante</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Los menús pueden cambiar según disponibilidad de ingredientes</li>
            <li>• Las votaciones cierran a las 15:00 del día anterior</li>
            <li>• Para alergias o intolerancias, contacta con el administrador</li>
            <li>• Los platos veganos están libres de productos de origen animal</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
