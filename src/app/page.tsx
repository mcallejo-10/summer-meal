'use client'

import { useState, useEffect } from 'react'
import { ChefHat, CheckCircle, BarChart3, Settings, Calendar, Users, Utensils } from 'lucide-react'
import Link from 'next/link'
import { getUsers } from '@/lib/supabase'

export default function Home() {
  const [totalUsers, setTotalUsers] = useState(0)
  const [loading, setLoading] = useState(true)

  // Obtener información básica
  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const users = await getUsers()
      setTotalUsers(users.length)
    } catch (error) {
      console.error('Error carregant estadístiques:', error)
    } finally {
      setLoading(false)
    }
  }

  // Obtenir la data de demà
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowFormatted = tomorrow.toLocaleDateString('ca-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header principal */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="bg-white rounded-full p-6 shadow-lg">
                <ChefHat className="text-orange-500" size={64} />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Summer Meal
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Organitza els menús i vots del teu grup
            </p>
            <p className="text-lg text-gray-500">
              🗓️ Properament: <span className="font-semibold capitalize">{tomorrowFormatted}</span>
            </p>
          </div>

          {/* Navegación principal con 3 opciones */}
          <div className="grid gap-6 md:grid-cols-3 mb-12">
            {/* Ver Menús */}
            <Link 
              href="/menus"
              className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="p-8 text-center">
                <div className="bg-orange-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                  <Utensils className="text-orange-500 w-full h-full" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  Ver Menús
                </h3>
                <p className="text-gray-600 mb-4">
                  Descobreix què tenim preparat cada dia de la setmana
                </p>
                <div className="bg-orange-50 rounded-lg p-3 text-sm text-orange-700">
                  📋 Consulta tots els plats disponibles
                </div>
              </div>
            </Link>

            {/* Votar */}
            <Link 
              href="/votar"
              className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="p-8 text-center">
                <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                  <CheckCircle className="text-green-500 w-full h-full" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  Votar
                </h3>
                <p className="text-gray-600 mb-4">
                  Vota la teva preferència per demà
                </p>
                <div className="bg-green-50 rounded-lg p-3 text-sm text-green-700">
                  ✅ Registra la teva elecció per {tomorrowFormatted.split(',')[0]}
                </div>
              </div>
            </Link>

            {/* Ver Resultados */}
            <Link 
              href="/resultats"
              className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="p-8 text-center">
                <div className="bg-blue-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <BarChart3 className="text-blue-500 w-full h-full" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  Ver Resultats
                </h3>
                <p className="text-gray-600 mb-4">
                  Consulta els resultats per organitzar les taules
                </p>
                <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                  📊 Veu qui ve i què necessiteu
                </div>
              </div>
            </Link>
          </div>

          {/* Información del grupo */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              📈 Informació del Grup
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center">
                <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto mb-3">
                  <Users className="text-purple-500 w-full h-full" />
                </div>
                <div className="text-3xl font-bold text-gray-800">
                  {loading ? '...' : totalUsers}
                </div>
                <div className="text-gray-600">Persones registrades</div>
              </div>
              <div className="text-center">
                <div className="bg-yellow-100 rounded-full p-3 w-16 h-16 mx-auto mb-3">
                  <Calendar className="text-yellow-500 w-full h-full" />
                </div>
                <div className="text-3xl font-bold text-gray-800">7</div>
                <div className="text-gray-600">Dies de la setmana</div>
              </div>
              <div className="text-center">
                <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-3">
                  <ChefHat className="text-green-500 w-full h-full" />
                </div>
                <div className="text-3xl font-bold text-gray-800">2</div>
                <div className="text-gray-600">Menjars per dia</div>
              </div>
            </div>
          </div>

          {/* Instrucciones de uso */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
            <h2 className="text-2xl font-bold mb-6 text-center">
              🚀 Com funciona?
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center">
                <div className="bg-white bg-opacity-20 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                  <span className="text-2xl">1️⃣</span>
                </div>
                <h3 className="font-bold mb-2">Consulta els menús</h3>
                <p className="text-blue-100">
                  Veu què hi ha per menjar cada dia
                </p>
              </div>
              <div className="text-center">
                <div className="bg-white bg-opacity-20 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                  <span className="text-2xl">2️⃣</span>
                </div>
                <h3 className="font-bold mb-2">Vota la teva preferència</h3>
                <p className="text-blue-100">
                  Tria què vols menjar demà
                </p>
              </div>
              <div className="text-center">
                <div className="bg-white bg-opacity-20 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                  <span className="text-2xl">3️⃣</span>
                </div>
                <h3 className="font-bold mb-2">Organitza les taules</h3>
                <p className="text-blue-100">
                  Usa els resultats per saber quants vindran
                </p>
              </div>
            </div>
          </div>

          {/* Acceso de administrador */}
          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
            >
              <Settings size={20} />
              Accés d&apos;Administrador
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
