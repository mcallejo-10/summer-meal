"use client";

import { useState, useEffect } from "react";
import { BarChart3, Calendar, ArrowLeft, UserX } from "lucide-react";
import Link from "next/link";
import { getVoteStatsByDish, getNotVotedUsers, getAppSettings, type VoteStatsByDish } from "@/lib/supabase";
import { getResultsDate, formatDateToISO, formatDateToCatalan } from "@/lib/dates";

export default function ResultatsPage() {
  const [voteStats, setVoteStats] = useState<VoteStatsByDish | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [notVotedUsers, setNotVotedUsers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getAppSettings().then((s) => {
      setSelectedDate(formatDateToISO(getResultsDate(s.results_cutoff_hour)));
    });
  }, []);

  // Cargar estadísticas cuando cambie la fecha
  useEffect(() => {
    if (selectedDate) {
      loadVoteStats(selectedDate);
    }
  }, [selectedDate]);

  const loadVoteStats = async (date: string) => {
    setLoading(true);
    try {
      const [stats, notVoted] = await Promise.all([
        getVoteStatsByDish(date),
        getNotVotedUsers(date),
      ]);
      setVoteStats(stats);
      setNotVotedUsers(notVoted);
    } catch (error) {
      console.error("Error carregant estadístiques de vots:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);
    return formatDateToCatalan(new Date(year, month - 1, day));
  };

  const dietShort = (d: string) => d === 'omnivora' ? 'O' : d === 'vegetariana' ? 'V' : 'Ve';
  const dietColor = (d: string) => d === 'omnivora' ? 'bg-red-500' : d === 'vegetariana' ? 'bg-green-500' : 'bg-emerald-500';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between flex-wrap mb-4">
              <div className="flex items-center flex-wrap gap-3">
                <div className="flex flex-nowrap">
                  <BarChart3 className="text-blue-500" size={32} />              
                    <h1 className="text-3xl font-bold text-gray-800">
                      Resultats de Vots
                    </h1>
                  
                </div>
                  <p className="text-gray-600 flex text-nowrap">
                    Consulta els resultats per organitzar les taules
                  </p>
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
            <div className="flex flex-wrap items-center gap-4">
              <Calendar className="text-gray-500" size={20} />
              <label className="font-medium text-gray-700">
                Selecciona la data:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 text-gray-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {selectedDate && (
                <span className="text-sm text-gray-800 capitalize">
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
            ) : voteStats ? (
              <div className="space-y-8">
                {(['dinar', 'sopar'] as const).map(mealType => {
                  const s = voteStats[mealType];
                  const hasData = s.primer.length > 0 || s.segon.length > 0 ||
                    s['no_vindré'].count > 0 || s.porto_el_meu_menjar.count > 0;
                  if (!hasData) return null;

                  const mealColor = mealType === 'dinar' ? 'text-yellow-600' : 'text-[#2a747f]';
                  const pillColor = mealType === 'dinar' ? 'bg-yellow-100 text-yellow-800' : 'bg-teal-100 text-[#2a747f]';
                  const bgColor = mealType === 'dinar' ? 'bg-yellow-50 border-yellow-200' : 'bg-teal-50 border-teal-200';

                  const renderDishes = (dishes: typeof s.primer, label: string) =>
                    dishes.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-700 mb-3">{label}</h4>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {dishes.map(dish => (
                            <div key={dish.dish_id} className="bg-white rounded-lg p-4 border shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-800">{dish.dish_name}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-2 py-0.5 rounded-full text-xs text-white ${dietColor(dish.diet_type)}`}>
                                    {dietShort(dish.diet_type)}
                                  </span>
                                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${pillColor}`}>
                                    {dish.count}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {dish.users.map((u, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-gray-50 rounded text-xs text-gray-600 border">{u}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );

                  return (
                    <div key={mealType} className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-2xl font-bold capitalize ${mealColor}`}>
                          {mealType === 'dinar' ? '☀️ Dinar' : '🌙 Sopar'}
                        </h3>
                        {s.totalCoberts > 0 && (
                          <div className={`px-4 py-2 rounded-full text-sm font-bold ${pillColor}`}>
                            {s.totalCoberts} cobert{s.totalCoberts !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>

                      {/* Resum numèric ràpid */}
                      {s.totalCoberts > 0 && (
                        <div className={`rounded-lg p-4 mb-6 border ${bgColor}`}>
                          <h4 className={`font-semibold mb-3 ${mealColor}`}>🍽️ Resum per organitzar les taules</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                            <div className={`p-3 rounded-lg ${mealType === 'dinar' ? 'bg-yellow-100' : 'bg-teal-100'}`}>
                              <div className={`text-2xl font-bold ${mealColor}`}>{s.totalCoberts}</div>
                              <div className={`text-sm font-medium ${mealType === 'dinar' ? 'text-yellow-700' : 'text-teal-700'}`}>Coberts</div>
                            </div>
                            {(['omnivora','vegetariana','vegana'] as const).map(dt => {
                              // Comptem persones úniques per dieta mirant els primers seleccionats
                              const uniqueUsers = new Set(
                                s.primer.filter(d => d.diet_type === dt).flatMap(d => d.users)
                              ).size;
                              if (uniqueUsers === 0) return null;
                              const colors = { omnivora: 'bg-red-100 text-red-800', vegetariana: 'bg-green-100 text-green-800', vegana: 'bg-emerald-100 text-emerald-800' };
                              const names = { omnivora: 'Omnívors', vegetariana: 'Vegetarians', vegana: 'Vegans' };
                              return (
                                <div key={dt} className={`p-3 rounded-lg ${colors[dt].split(' ')[0]}`}>
                                  <div className={`text-2xl font-bold ${colors[dt].split(' ')[1]}`}>{uniqueUsers}</div>
                                  <div className={`text-sm font-medium ${colors[dt].split(' ')[1]}`}>{names[dt]}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {renderDishes(s.primer, '🥗 Primers')}
                      {renderDishes(s.segon, '🍽️ Segons')}

                      {(s['no_vindré'].count > 0 || s.porto_el_meu_menjar.count > 0) && (
                        <div className="grid gap-3 md:grid-cols-2">
                          {s['no_vindré'].count > 0 && (
                            <div className="bg-gray-50 rounded-lg p-4 border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-700">❌ No vindran</span>
                                <span className="px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-700">{s['no_vindré'].count}</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {s['no_vindré'].users.map((u, i) => <span key={i} className="px-2 py-0.5 bg-white rounded text-xs text-gray-600 border">{u}</span>)}
                              </div>
                            </div>
                          )}
                          {s.porto_el_meu_menjar.count > 0 && (
                            <div className="bg-gray-50 rounded-lg p-4 border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-700">🥪 Porten menjar</span>
                                <span className="px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-700">{s.porto_el_meu_menjar.count}</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {s.porto_el_meu_menjar.users.map((u, i) => <span key={i} className="px-2 py-0.5 bg-white rounded text-xs text-gray-600 border">{u}</span>)}
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

          {/* Qui no ha votat */}
          {!loading && (
            <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
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
      </div>
    </div>
  );
}
