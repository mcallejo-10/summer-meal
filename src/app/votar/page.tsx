"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Calendar, ArrowLeft, CheckCircle, Users, ChevronDown, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import {
  getUsers,
  getMenus,
  createVote,
  getUserVoteForDate,
  updateVote,
  getAppSettings,
  type User as UserType,
  type Vote,
  type Menu,
} from "@/lib/supabase";

import {
  getVotingDate,
  isVotingForToday,
  formatDateToISO,
  formatDateToCatalan,
  getDayNameInCatalan,
  VOTING_CUTOFF_HOUR,
} from "@/lib/dates";

const supabase = createClient();


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
  const router = useRouter();

  const [users, setUsers] = useState<UserType[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<"dinar" | "sopar">("dinar");
  const [selectedVote, setSelectedVote] = useState<string>("");
  const [isVoteSubmitted, setIsVoteSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingVote, setExistingVote] = useState<Vote | null>(null);
  const [isColleagueExpanded, setIsColleagueExpanded] = useState(false);
  const [votingCutoff, setVotingCutoff] = useState(VOTING_CUTOFF_HOUR);
  const touchStartX = useRef<number | null>(null);
  const [slideDir, setSlideDir] = useState<'from-right' | 'from-left'>('from-right');

  const votingDate = getVotingDate(votingCutoff);
  const votingForToday = isVotingForToday(votingCutoff);
  const votingDateFormatted = formatDateToCatalan(votingDate, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Carreguem sessió + usuaris + menús en paral·lel (més ràpid que en seqüència)
  // Promise.all espera que els 3 es completin i retorna els resultats en ordre.
  // EN ANGULAR: seria forkJoin([getUser$, getUsers$, getMenus$])
  useEffect(() => {
    async function init() {
      const [
        { data: { user } },
        usersData,
        menusData,
        settings,
      ] = await Promise.all([
        supabase.auth.getUser(),
        getUsers(),
        getMenus(),
        getAppSettings(),
      ]);

      setUsers(usersData);
      setMenus(menusData);
      setVotingCutoff(settings.voting_cutoff_hour);

      if (user) {
        setLoggedInUserId(user.id);
        setSelectedUser(user.id); // pre-seleccionem l'usuari loguejat
      }

      setLoading(false);
    }
    init();
  }, []);

  const checkExistingVote = useCallback(async () => {
    if (!selectedUser) return;

    try {
      const dateString = formatDateToISO(getVotingDate());

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

  const handleColleagueSelect = (userId: string) => {
    setSelectedUser(userId);
    setSelectedVote("");
    setIsVoteSubmitted(false);
    setExistingVote(null);
    setIsColleagueExpanded(false);
  };

  const handleVoteSelf = () => {
    setSelectedUser(loggedInUserId);
    setSelectedVote("");
    setIsVoteSubmitted(false);
    setExistingVote(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Variables derivades: calculades a partir de l'estat, no emmagatzemades.
  // EN ANGULAR: seria com getters en un component.
  const loggedInUser = users.find((u) => u.id === loggedInUserId);
  const votingForUser = users.find((u) => u.id === selectedUser);
  const isVotingForSelf = selectedUser === loggedInUserId;

  const switchMealType = (type: "dinar" | "sopar") => {
    if (type === selectedMealType) return;
    setSlideDir(type === "sopar" ? "from-right" : "from-left");
    setSelectedMealType(type);
    setSelectedVote("");
    setIsVoteSubmitted(false);
    setExistingVote(null);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && selectedMealType === "dinar") switchMealType("sopar");
      if (diff < 0 && selectedMealType === "sopar") switchMealType("dinar");
    }
    touchStartX.current = null;
  };

  const handleVoteSubmit = async () => {
    if (!selectedVote || !selectedUser || submitting) return;

    setSubmitting(true);
    try {
      if (existingVote) {
        await updateVote(existingVote.id, {
          choice: selectedVote as
            | "omnivora"
            | "vegetariana"
            | "vegana"
            | "porto_el_meu_menjar"
            | "no_vindré",
        });
      } else {
        const voteData = {
          date: formatDateToISO(getVotingDate()),
          user_id: selectedUser,
          voted_by: loggedInUserId,
          choice: selectedVote as
            | "omnivora"
            | "vegetariana"
            | "vegana"
            | "porto_el_meu_menjar"
            | "no_vindré",
          meal_type: selectedMealType,
        };

        const newVote = await createVote(voteData);
        if (newVote) setExistingVote(newVote as Vote);
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
      (menu) => menu.day === getDayNameInCatalan(votingDate) && menu.meal_type === mealType
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
    return `/api/avatar/${normalizedName}`;
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregant...</p>
        </div>
      </div>
    );
  }

  // Si el perfil no existeix a la taula users (p.ex. el trigger no s'ha executat)
  if (!loggedInUser || !votingForUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm bg-white rounded-xl shadow-sm p-8">
          <p className="text-gray-700 mb-4">
            No s&apos;ha trobat el teu perfil. Contacta amb l&apos;administrador.
          </p>
          <button
            onClick={handleLogout}
            className="text-orange-600 font-medium hover:text-orange-800"
          >
            Tancar sessió
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="container mx-auto px-4 py-6 max-w-2xl">

        {/* ── Header: títol, data i selector dinar/sopar ── */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Votar per {votingForToday ? "Avui" : "Demà"}
              </h1>
              <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                <Calendar size={14} />
                {votingDateFormatted}
              </p>
              {votingForToday && (
                <p className="text-xs text-orange-600 mt-1">
                  ⏰ Últimes hores! (fins les 10:00)
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/"
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                title="Tancar sessió"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Selector dinar / sopar */}
          <div className="flex gap-2">
            <button
              onClick={() => switchMealType("dinar")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors text-sm ${
                selectedMealType === "dinar"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              🍽️ Dinar
            </button>
            <button
              onClick={() => switchMealType("sopar")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors text-sm ${
                selectedMealType === "sopar" ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              style={selectedMealType === "sopar" ? { backgroundColor: "#2a747f" } : {}}
            >
              🌙 Sopar
            </button>
          </div>
        </div>

        {/* ── Per qui votem ─────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex items-center gap-3">
          <div className="relative w-14 h-14 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getUserAvatarUrl(votingForUser)}
              alt={votingForUser.name}
              className="w-full h-full rounded-full object-cover border-2 border-orange-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/avatars/default.jpeg";
              }}
            />
            {!isVotingForSelf && (
              <div className="absolute -bottom-1 -right-1 bg-orange-500 rounded-full p-1">
                <Users size={10} className="text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {isVotingForSelf ? (
              <h2 className="text-lg font-bold text-gray-800">
                Hola, {votingForUser.name}! 👋
              </h2>
            ) : (
              <>
                <h2 className="text-lg font-bold text-gray-800 truncate">
                  Votant per {votingForUser.name}
                </h2>
                <p className="text-sm text-gray-400">
                  Enviat per {loggedInUser.name}
                </p>
              </>
            )}
          </div>
          {!isVotingForSelf && (
            <button
              onClick={handleVoteSelf}
              className="text-sm text-orange-500 hover:text-orange-700 font-medium shrink-0"
            >
              ← El meu vot
            </button>
          )}
        </div>

        {/* ── Menú + Formulari de votació ───────────────── */}
        <div
          key={selectedMealType}
          className={`rounded-xl p-4 mb-4 slide-${slideDir} ${
            selectedMealType === "dinar"
              ? "bg-yellow-50 border border-yellow-200"
              : "bg-teal-50 border border-teal-200"
          }`}
        >
          <h3 className="text-base font-semibold text-gray-800 mb-3">
            📋 Opcions de {selectedMealType === "dinar" ? "dinar" : "sopar"} per{" "}
            {votingForToday ? "avui" : "demà"}:
          </h3>
          {getVotingMenus(selectedMealType).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              {getVotingMenus(selectedMealType).map((menu) => (
                <div
                  key={menu.id}
                  className={`rounded-lg p-3 border text-sm ${
                    selectedMealType === "dinar"
                      ? "bg-yellow-100 border-yellow-200"
                      : "bg-teal-100 border-teal-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-800">{menu.dish_name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs text-white shrink-0 ${getDietTypeColor(menu.diet_type)}`}
                    >
                      {menu.diet_type.charAt(0).toUpperCase() + menu.diet_type.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm mb-4">
              No hi ha opcions de {selectedMealType} configurades per{" "}
              {votingForToday ? "avui" : "demà"}.
            </p>
          )}

          {!isVoteSubmitted ? (
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-3">
                Què {isVotingForSelf ? "vols" : `vol ${votingForUser.name}`}{" "}
                {selectedMealType === "dinar" ? "dinar" : "sopar"}{" "}
                {votingForToday ? "avui" : "demà"}?
              </h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {voteOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedVote(option.value)}
                    className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                      selectedVote === option.value
                        ? `${option.color} text-white border-transparent`
                        : selectedMealType === "dinar"
                        ? "bg-yellow-100 text-gray-700 border-yellow-200 hover:border-yellow-300 hover:bg-yellow-200"
                        : "bg-teal-100 text-gray-700 border-teal-200 hover:border-teal-300 hover:bg-teal-200"
                    }`}
                  >
                    {option.label}
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
                  ? `Actualitzar elecció${!isVotingForSelf ? ` de ${votingForUser.name}` : ""}`
                  : `Confirmar elecció${!isVotingForSelf ? ` per ${votingForUser.name}` : ""}`}
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-lg mb-3">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle size={18} />
                  <span className="font-semibold">
                    {existingVote ? "Vot actualitzat! ✅" : "Vot registrat! ✅"}
                  </span>
                </div>
                <p className="text-sm">
                  {isVotingForSelf
                    ? `La teva elecció per ${votingForToday ? "avui" : "demà"} ha estat guardada.`
                    : `L'elecció de ${votingForUser.name} per ${votingForToday ? "avui" : "demà"} ha estat guardada.`}
                </p>
              </div>
              <button
                onClick={() => { setSelectedVote(""); setIsVoteSubmitted(false); }}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Canviar elecció
              </button>
            </div>
          )}
        </div>

        {/* ── Votar per un company (acordió) ────────────── */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <button
            onClick={() => setIsColleagueExpanded(!isColleagueExpanded)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2 font-medium text-gray-700">
              <Users size={18} className="text-orange-500" />
              Votar per un company
            </span>
            <ChevronDown
              size={18}
              className={`text-gray-400 transition-transform duration-200 ${
                isColleagueExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          {isColleagueExpanded && (
            <div className="px-4 pb-4 border-t border-gray-100 pt-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {users
                  .filter((u) => u.id !== loggedInUserId)
                  .map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleColleagueSelect(user.id)}
                      className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                        selectedUser === user.id && !isVotingForSelf
                          ? "border-orange-400 bg-orange-50"
                          : "border-transparent bg-gray-50 hover:bg-orange-50 hover:border-orange-200"
                      }`}
                    >
                      <div className="w-12 h-12">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getUserAvatarUrl(user)}
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover border-2 border-orange-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/avatars/default.jpeg";
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                        {user.name.split(" ")[0]}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
