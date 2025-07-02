'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, Calendar, ChefHat } from 'lucide-react'
import { 
  getUsers, 
  createVote, 
  getUserVoteForDate, 
  updateVote,
  type User as UserType,
  type Vote 
} from '@/lib/supabase'

const voteOptions = [
  { value: 'omnivora', label: '🥩 Omnívora', color: 'bg-red-500' },
  { value: 'vegetariana', label: '🥗 Vegetariana', color: 'bg-green-500' },
  { value: 'vegana', label: '🌱 Vegana', color: 'bg-emerald-500' },
  { value: 'porto_el_meu_menjar', label: '🥪 Porto el meu menjar', color: 'bg-blue-500' },
  { value: 'no_vindré', label: '❌ No vindré', color: 'bg-gray-500' },
] as const

export default function Home() {
  const [users, setUsers] = useState<UserType[]>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [selectedMealType, setSelectedMealType] = useState<'dinar' | 'sopar'>('dinar')
  const [selectedVote, setSelectedVote] = useState<string>('')
  const [isVoteSubmitted, setIsVoteSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [existingVote, setExistingVote] = useState<Vote | null>(null)

  // Obtenir la data de demà
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowFormatted = tomorrow.toLocaleDateString('ca-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const tomorrowDateString = tomorrow.toISOString().split('T')[0]

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const usersData = await getUsers()
      setUsers(usersData)
    } catch (error) {
      console.error('Error carregant usuaris:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkExistingVote = useCallback(async () => {
    if (!selectedUser) return
    
    try {
      const vote = await getUserVoteForDate(selectedUser, tomorrowDateString, selectedMealType)
      if (vote) {
        setExistingVote(vote)
        setSelectedVote(vote.choice)
        setIsVoteSubmitted(true)
      } else {
        setExistingVote(null)
        setSelectedVote('')
        setIsVoteSubmitted(false)
      }
    } catch (error) {
      console.error('Error comprovant vot existent:', error)
    }
  }, [selectedUser, tomorrowDateString, selectedMealType])

  useEffect(() => {
    if (selectedUser) {
      checkExistingVote()
    }
  }, [selectedUser, selectedMealType, checkExistingVote])

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId)
    setSelectedVote('')
    setIsVoteSubmitted(false)
    setExistingVote(null)
  }

  const handleVoteSubmit = async () => {
    if (!selectedVote || !selectedUser || submitting) return
    
    setSubmitting(true)
    try {
      if (existingVote) {
        // Actualitzar vot existent
        await updateVote(existingVote.id, {
          choice: selectedVote as 'omnivora' | 'vegetariana' | 'vegana' | 'porto_el_meu_menjar' | 'no_vindré',
          updated_at: new Date().toISOString()
        })
      } else {
        // Crear nou vot
        await createVote({
          user_id: selectedUser,
          date: tomorrowDateString,
          choice: selectedVote as 'omnivora' | 'vegetariana' | 'vegana' | 'porto_el_meu_menjar' | 'no_vindré',
          meal_type: selectedMealType
        })
      }
      
      setIsVoteSubmitted(true)
      console.log('Vot enviat correctament!')
    } catch (error) {
      console.error('Error enviant vot:', error)
      alert('Error enviant el vot. Torna-ho a provar.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregant usuaris...</p>
        </div>
      </div>
    )
  }

  if (!selectedUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
              <ChefHat className="text-orange-500" size={36} />
              Benvingut a Summer Meal
            </h1>
            <p className="text-gray-600 text-lg">
              Selecciona el teu nom per votar el menjar de demà
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user.id)}
                className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none"
              >
                <div className="flex flex-col items-center">
                  <User className="text-blue-500 mb-2" size={24} />
                  <span className="text-sm font-medium text-gray-800 text-center">
                    {user.name}
                  </span>
                  {user.is_admin && (
                    <span className="text-xs text-orange-500 mt-1">Admin</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const selectedUserData = users.find(u => u.id === selectedUser)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Hola, {selectedUserData?.name}! 👋
              </h2>
              <p className="text-gray-600 flex items-center gap-2 mt-2">
                <Calendar size={18} />
                Menú per {tomorrowFormatted}
              </p>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className="text-blue-500 hover:text-blue-700 text-sm font-medium"
            >
              Canviar usuari
            </button>
          </div>

          {/* Selector de tipus de menjar */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Tipus de menjar:
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => setSelectedMealType('dinar')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedMealType === 'dinar'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🍽️ Dinar
              </button>
              <button
                onClick={() => setSelectedMealType('sopar')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedMealType === 'sopar'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🌙 Sopar
              </button>
            </div>
          </div>

          {!isVoteSubmitted ? (
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Què vols {selectedMealType === 'dinar' ? 'dinar' : 'sopar'} demà?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {voteOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedVote(option.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedVote === option.value
                        ? `${option.color} text-white border-transparent`
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleVoteSubmit}
                disabled={!selectedVote || submitting}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Enviant...' : existingVote ? 'Actualitzar la meva elecció' : 'Confirmar la meva elecció'}
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
                <h3 className="font-semibold">
                  {existingVote ? '¡Vot actualitzat correctament! ✅' : '¡Vot registrat correctament! ✅'}
                </h3>
                <p>La teva elecció per demà ha estat guardada.</p>
              </div>
              <button
                onClick={() => {
                  setSelectedVote('')
                  setIsVoteSubmitted(false)
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Canviar el meu vot
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
