"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  getUsers,
  getMenus,
  createVote,
  getUserVoteForDate,
  updateVote,
  type User as UserType,
  type Vote,
  type Menu,
} from "@/lib/supabase";

const voteOptions = [
  { value: "omnivora", label: "🥩 Omnívora", color: "bg-red-500" },
  { value: "vegetariana", label: "🥗 Vegetariana", color: "bg-green-500" },
  { value: "vegana", label: "🌱 Vegana", color: "bg-emerald-500" },
  {
    value: "porto_el_meu_menjar",
    label: "🥪 Porto el meu menjar",
    color: "bg-blue-500",
  },
  { value: "no_vindré", label: "❌ No vindré", color: "bg-gray-500" },
] as const;

export default function VotarPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<"dinar" | "sopar">(
    "dinar"
  );
  const [selectedVote, setSelectedVote] = useState<string>("");
  const [isVoteSubmitted, setIsVoteSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingVote, setExistingVote] = useState<Vote | null>(null);

  // Obtenir la data per votar - Lógica basada en hora límite de 9:00 AM
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
  const isVotingForToday = new Date().getHours() < 9;
  
  const votingDateFormatted = votingDate.toLocaleDateString("ca-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Obtenir el dia en català per mostrar el menú
  const votingDayInCatalan = votingDate
    .toLocaleDateString("ca-ES", { weekday: "long" })
    .toLowerCase();

  useEffect(() => {
    loadUsers();
    loadMenus();
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error("Error carregant usuaris:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMenus = async () => {
    try {
      const menusData = await getMenus();
      setMenus(menusData);
    } catch (error) {
      console.error("Error carregant menús:", error);
    }
  };

  const checkExistingVote = useCallback(async () => {
    if (!selectedUser) return;

    try {
      // Recalcular la fecha de votación dentro del callback
      const now = new Date();
      const currentHour = now.getHours();
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (currentHour >= 9) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
      
      const dateString = targetDate.getFullYear() + '-' + 
        String(targetDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(targetDate.getDate()).padStart(2, '0');

      const vote = await getUserVoteForDate(
        selectedUser,
        dateString,
        selectedMealType
      );
      
      if (vote) {
        setExistingVote(vote);
        setSelectedVote(vote.choice);
        setIsVoteSubmitted(true);
      } else {
        setExistingVote(null);
        setSelectedVote("");
        setIsVoteSubmitted(false);
      }
    } catch (error) {
      console.error("Error comprovant vot existent:", error);
    }
  }, [selectedUser, selectedMealType]);

  useEffect(() => {
    if (selectedUser) {
      checkExistingVote();
    }
  }, [selectedUser, selectedMealType, checkExistingVote]);

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    setSelectedVote("");
    setIsVoteSubmitted(false);
    setExistingVote(null);
  };

  const handleVoteSubmit = async () => {
    if (!selectedVote || !selectedUser || submitting) return;

    setSubmitting(true);
    try {
      if (existingVote) {
        // Actualitzar vot existent
        const updateData = {
          choice: selectedVote as
            | "omnivora"
            | "vegetariana"
            | "vegana"
            | "porto_el_meu_menjar"
            | "no_vindré",
          updated_at: new Date().toISOString(),
        };

        await updateVote(existingVote.id, updateData);
      } else {
        // Crear nou vot - recalcular fecha
        const now = new Date();
        const currentHour = now.getHours();
        const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        if (currentHour >= 9) {
          targetDate.setDate(targetDate.getDate() + 1);
        }
        
        const dateString = targetDate.getFullYear() + '-' + 
          String(targetDate.getMonth() + 1).padStart(2, '0') + '-' + 
          String(targetDate.getDate()).padStart(2, '0');

        const voteData = {
          user_id: selectedUser,
          date: dateString,
          choice: selectedVote as
            | "omnivora"
            | "vegetariana"
            | "vegana"
            | "porto_el_meu_menjar"
            | "no_vindré",
          meal_type: selectedMealType,
        };

        await createVote(voteData);
      }

      setIsVoteSubmitted(true);
    } catch (error) {
      console.error("Error enviant vot:", error);
      alert("Error enviant el vot. Torna-ho a provar.");
    } finally {
      setSubmitting(false);
    }
  };

  // Funcions per obtenir menús del dia de votació
  const getVotingMenus = (mealType: "dinar" | "sopar") => {
    return menus.filter(
      (menu) => menu.day === votingDayInCatalan && menu.meal_type === mealType
    );
  };

  // Función para normalizar nombres y generar URL de avatar
  const normalizeUserName = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
      .replace(/[^a-z0-9\s]/g, "") // Quitar caracteres especiales
      .replace(/\s+/g, "-") // Espacios por guiones
      .trim();
  };

  const getUserAvatarUrl = (user: UserType) => {
    const normalizedName = normalizeUserName(user.name);
    return `/avatars/${normalizedName}.jpeg`;
  };

  const getDietTypeColor = (dietType: string) => {
    switch (dietType) {
      case "omnivora":
        return "bg-red-500";
      case "vegetariana":
        return "bg-green-500";
      case "vegana":
        return "bg-emerald-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregant usuaris...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-500" size={32} />
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">
                    Votar per {isVotingForToday ? "Avui" : "Demà"}
                  </h1>
                  <p className="text-gray-600 flex items-center gap-2">
                    <Calendar size={18} />
                    {votingDateFormatted}
                  </p>
                  {isVotingForToday && (
                    <p className="text-sm text-orange-600 mt-1">
                      ⏰ Últimes hores per votar! (fins les 9:00 AM)
                    </p>
                  )}
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
          </div>

          {!selectedUser ? (
            /* Selección de usuario */
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Selecciona el teu nom
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user.id)}
                    className="p-4 bg-gray-50 rounded-lg border-2 border-transparent hover:border-orange-300 hover:bg-orange-50 transition-all focus:border-blue-500 focus:outline-none"
                  >
                    <div className="flex flex-col items-center">
                      {/* Avatar con fallback */}
                      <div className="relative w-16 h-16 mb-3">
                        <Image
                          src={getUserAvatarUrl(user)}
                          alt={`Avatar de ${user.name}`}
                          width={64}
                          height={64}
                          className="w-full h-full rounded-full object-cover border-2 border-orange-300"
                          onError={(e) => {
                            // Fallback a imagen por defecto
                            const target = e.target as HTMLImageElement;
                            target.src = '/avatars/default.jpeg';
                          }}
                          unoptimized={true}
                          priority={false}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-800 text-center">
                        {user.name}
                      </span>
                      {user.is_admin && (
                        <span className="text-xs text-orange-500 mt-1">
                          Admin
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Formulario de votación */
            <div className="space-y-8">
              {/* Información del usuario */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Hola, {users.find((u) => u.id === selectedUser)?.name}! 👋
                  </h2>
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
                      onClick={() => setSelectedMealType("dinar")}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        selectedMealType === "dinar"
                          ? "bg-orange-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      🍽️ Dinar
                    </button>
                    <button
                      onClick={() => setSelectedMealType("sopar")}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        selectedMealType === "sopar"
                          ? "text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                      style={
                        selectedMealType === "sopar"
                          ? { backgroundColor: "#2a747f" }
                          : {}
                      }
                    >
                      🌙 Sopar
                    </button>
                  </div>
                </div>
              </div>

              {/* Menú de demà */}
              <div className={`rounded-lg p-4 mb-6 ${
                        selectedMealType === 'dinar' 
                          ? 'bg-yellow-50 border border-yellow-200' 
                          : 'bg-teal-50 border border-teal-200'
                      }`}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  📋 Opcions de{" "}
                  {selectedMealType === "dinar" ? "dinar" : "sopar"} per {isVotingForToday ? "avui" : "demà"}:
                </h3>
                {getVotingMenus(selectedMealType).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                    {getVotingMenus(selectedMealType).map((menu) => (
                      <div
                        key={menu.id}
                        className={`rounded-lg p-4 border ${
                          selectedMealType === 'dinar'
                            ? 'bg-yellow-100 border-yellow-200'
                            : 'bg-teal-100 border-teal-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-gray-800 text-sm">
                            {menu.dish_name}
                          </h4>
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs text-white ${getDietTypeColor(
                              menu.diet_type
                            )}`}
                          >
                            {menu.diet_type.charAt(0).toUpperCase() +
                              menu.diet_type.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm mb-6">
                    No hi ha opcions de{" "}
                    {selectedMealType === "dinar" ? "dinar" : "sopar"}{" "}
                    configurades per {isVotingForToday ? "avui" : "demà"}.
                  </p>
                )}

                {!isVoteSubmitted ? (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Què vols{" "}
                      {selectedMealType === "dinar" ? "dinar" : "sopar"} {isVotingForToday ? "avui" : "demà"}?
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {voteOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setSelectedVote(option.value)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedVote === option.value
                              ? `${option.color} text-white border-transparent`
                              : selectedMealType === 'dinar'
                              ? "bg-yellow-100 text-gray-700 border-yellow-200 hover:border-yellow-300 hover:bg-yellow-200"
                              : "bg-teal-100 text-gray-700 border-teal-200 hover:border-teal-300 hover:bg-teal-200"
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
                      {submitting
                        ? "Enviant..."
                        : existingVote
                        ? "Actualitzar la meva elecció"
                        : "Confirmar la meva elecció"}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
                      <h3 className="font-semibold">
                        {existingVote
                          ? "¡Vot actualitzat correctament! ✅"
                          : "¡Vot registrat correctament! ✅"}
                      </h3>
                      <p>La teva elecció per {isVotingForToday ? "avui" : "demà"} ha estat guardada.</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedVote("");
                        setIsVoteSubmitted(false);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Canviar el meu vot
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
