'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Calendar, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getVoteStats } from '@/lib/supabase'

interface VoteStats {
  [meal_type: string]: {
    [choice: string]: {
      count: number
      users: string[]
    }
  }
}

export default function ResultatsPage() {
  const [voteStats, setVoteStats] = useState<VoteStats | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Obtener fecha de votación según lógica de 9:00 AM - igual que en página de votaciones
  useEffect(() => {
    const getVotingDate = () => {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Si son antes de las 9:00 AM, votan para hoy
      // Si son después de las 9:00 AM, votan para mañana
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (currentHour >= 9) {
        // Después de las 9:00 AM - votar para mañana
        targetDate.setDate(targetDate.getDate() + 1);
      }
      // Antes de las 9:00 AM - votar para hoy (no se añade nada)
      
      return targetDate;
    };

    const votingDate = getVotingDate();
    // Crear string de fecha en formato YYYY-MM-DD sin zona horaria
    const votingDateString = votingDate.getFullYear() + '-' + 
      String(votingDate.getMonth() + 1).padStart(2, '0') + '-' + 
      String(votingDate.getDate()).padStart(2, '0');
    
    setSelectedDate(votingDateString);
  }, [])

  // Cargar estadísticas cuando cambie la fecha
  useEffect(() => {
    if (selectedDate) {
      loadVoteStats(selectedDate)
    }
  }, [selectedDate])

  const loadVoteStats = async (date: string) => {
    setLoading(true)
    try {
      const stats = await getVoteStats(date)
      setVoteStats(stats)
    } catch (error) {
      console.error('Error carregant estadístiques de vots:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    // Crear fecha local sin problemas de zona horaria
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.toLocaleDateString('ca-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  const getTotalVotes = (choices: Record<string, { count: number; users: string[] }>) => {
    return Object.values(choices).reduce((sum, data) => sum + data.count, 0)
  }

  // Función para generar resumen de votaciones para organizar mesas
  const generateMealSummary = (choices: Record<string, { count: number; users: string[] }>) => {
    const counts = {
      totalCoberts: 0,
      omnivors: 0,
      vegetarians: 0,
      vegans: 0
    }

    Object.entries(choices).forEach(([choice, data]) => {
      if (choice !== 'no_vindré') {
        counts.totalCoberts += data.count
      }
      
      if (choice === 'omnivora') {
        counts.omnivors += data.count
      } else if (choice === 'vegetariana') {
        counts.vegetarians += data.count
      } else if (choice === 'vegana') {
        counts.vegans += data.count
      }
    })

    return counts
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="text-blue-500" size={32} />
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">
                    Resultats de Vots
                  </h1>
                  <p className="text-gray-600">
                    Consulta els resultats per organitzar les taules
                  </p>
                </div>
              </div>
              <Link 
                href="/" 
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <ArrowLeft size={18} />
                Tornar
              </Link>
            </div>

            {/* Selector de fecha */}
            <div className="flex items-center gap-4">
              <Calendar className="text-gray-500" size={20} />
              <label className="font-medium text-gray-700">
                Selecciona la data:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {selectedDate && (
                <span className="text-sm text-gray-600 capitalize">
                  {formatDate(selectedDate)}
                </span>
              )}
            </div>
          </div>

          {/* Resultados */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-600">Carregant resultats...</p>
              </div>
            ) : voteStats && Object.keys(voteStats).length > 0 && Object.values(voteStats).some(choices => Object.keys(choices).length > 0) ? (
              <div className="space-y-8">
                {Object.entries(voteStats).map(([mealType, choices]) => {
                  if (Object.keys(choices).length === 0) return null
                  
                  const summary = generateMealSummary(choices)
                  
                  return (
                    <div key={mealType} className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className={`text-2xl font-bold capitalize ${
                          mealType === 'dinar' ? 'text-yellow-600' : 'text-[#2a747f]'
                        }`}>
                          {mealType === 'dinar' ? '🌞 Dinar' : '🌙 Sopar'}
                        </h3>
                        <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                          mealType === 'dinar' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-teal-100 text-[#2a747f]'
                        }`}>
                          Total: {getTotalVotes(choices)} persones
                        </div>
                      </div>

                      {/* Resumen para organizar mesas */}
                      <div className={`rounded-lg p-4 mb-6 ${
                        mealType === 'dinar' 
                          ? 'bg-yellow-50 border border-yellow-200' 
                          : 'bg-teal-50 border border-teal-200'
                      }`}>
                        <h4 className={`font-semibold mb-3 flex items-center gap-2 ${
                          mealType === 'dinar' ? 'text-yellow-800' : 'text-[#2a747f]'
                        }`}>
                          🍽️ Resum per organitzar les taules
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div className={`p-3 rounded-lg ${
                            mealType === 'dinar' ? 'bg-yellow-100' : 'bg-teal-100'
                          }`}>
                            <div className={`text-2xl font-bold ${
                              mealType === 'dinar' ? 'text-yellow-800' : 'text-[#2a747f]'
                            }`}>
                              {summary.totalCoberts}
                            </div>
                            <div className={`text-sm font-medium ${
                              mealType === 'dinar' ? 'text-yellow-700' : 'text-teal-700'
                            }`}>
                              Coberts
                            </div>
                          </div>
                          <div className="p-3 bg-red-100 rounded-lg">
                            <div className="text-2xl font-bold text-red-800">
                              {summary.omnivors}
                            </div>
                            <div className="text-sm font-medium text-red-700">
                              Omnívors
                            </div>
                          </div>
                          <div className="p-3 bg-green-100 rounded-lg">
                            <div className="text-2xl font-bold text-green-800">
                              {summary.vegetarians}
                            </div>
                            <div className="text-sm font-medium text-green-700">
                              Vegetarians
                            </div>
                          </div>
                          <div className="p-3 bg-emerald-100 rounded-lg">
                            <div className="text-2xl font-bold text-emerald-800">
                              {summary.vegans}
                            </div>
                            <div className="text-sm font-medium text-emerald-700">
                              Vegans
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(choices).map(([choice, data]) => (
                          <div key={choice} className="bg-gray-50 rounded-lg p-4 border">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-800 text-lg">
                                {choice === 'omnivora' ? '🥩 Omnívora' :
                                 choice === 'vegetariana' ? '🥗 Vegetariana' :
                                 choice === 'vegana' ? '🌱 Vegana' :
                                 choice === 'porto_el_meu_menjar' ? '🥪 Porto el meu menjar' :
                                 choice === 'no_vindré' ? '❌ No vindré' : choice}
                              </h4>
                              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                mealType === 'dinar' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-teal-100 text-[#2a747f]'
                              }`}>
                                {data.count}
                              </span>
                            </div>
                            
                            {data.users.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-medium text-gray-500 mb-2">
                                  {data.count} {data.count === 1 ? 'persona' : 'persones'}:
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
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="mx-auto text-gray-400 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No hi ha vots per aquesta data
                </h3>
                <p className="text-gray-500">
                  Prova amb una altra data o espera que la gent voti.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
