/**
 * UTILITATS DE DATES — src/lib/dates.ts
 *
 * Per què existeix aquest fitxer?
 * La lògica de "per a quina data votarem" estava duplicada en 4 fitxers.
 * Principi DRY (Don't Repeat Yourself): una sola font de veritat.
 * Si cal canviar el cutoff de les 10h, es canvia AQUÍ i ja està.
 *
 * EN ANGULAR: Seria un Injectable service (DateService) amb mètodes públics.
 * En Next.js, com que no hi ha injecció de dependències, usem funcions pures
 * exportades des d'un fitxer de utilitats. Més simple, mateix resultat.
 */

/** Hora límit per votar: abans d'aquesta hora es vota per avui, després per demà (10h AM) */
export const VOTING_CUTOFF_HOUR = 10

/** Hora límit per als resultats: a partir d'aquí el default passa a mostrar demà (22h PM) */
export const RESULTS_CUTOFF_HOUR = 22

/**
 * Retorna la data d'avui sense problemes de timezone.
 *
 * Per què no fer servir simplement `new Date()`?
 * `new Date()` retorna un objecte amb timezone UTC internament.
 * Quan el converteixes a string (.toISOString()) pot canviar el dia si
 * estàs a UTC+2 (Espanya). Construïm la data amb valors locals explícits.
 */
export function getLocalToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/**
 * Retorna la data de demà sense problemes de timezone.
 */
export function getTomorrow(): Date {
  const tomorrow = getLocalToday()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow
}

/**
 * Retorna la data per la qual s'ha de votar:
 * - Abans de les 10h → avui (última oportunitat!)
 * - A partir de les 10h → demà
 */
export function getVotingDate(cutoffHour = VOTING_CUTOFF_HOUR): Date {
  const targetDate = getLocalToday()
  if (new Date().getHours() >= cutoffHour) {
    targetDate.setDate(targetDate.getDate() + 1)
  }
  return targetDate
}

/**
 * Retorna true si estem en el període de votar per avui (abans de les 10h).
 */
export function isVotingForToday(cutoffHour = VOTING_CUTOFF_HOUR): boolean {
  return new Date().getHours() < cutoffHour
}

/**
 * Retorna la data per mostrar als resultats:
 * - Abans de les 22h → avui (el sopar encara no ha acabat)
 * - A partir de les 22h → demà (el sopar ja ha passat, la gent ja vota per demà)
 */
export function getResultsDate(cutoffHour = RESULTS_CUTOFF_HOUR): Date {
  const targetDate = getLocalToday()
  if (new Date().getHours() >= cutoffHour) {
    targetDate.setDate(targetDate.getDate() + 1)
  }
  return targetDate
}

/**
 * Converteix una data a format YYYY-MM-DD (el format que usa Supabase/SQL).
 *
 * Per què no usar date.toISOString().split('T')[0]?
 * Perquè .toISOString() sempre retorna UTC. Si a Espanya és les 00:30,
 * UTC és les 22:30 del dia anterior → el dia seria incorrecte.
 * Construïm el string manualment amb valors locals.
 */
export function formatDateToISO(date: Date): string {
  return (
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0')
  )
}

/**
 * Formata una data en català per mostrar a la UI.
 * Força la timezone d'Espanya per evitar problemes quan s'executa al servidor.
 *
 * @param date - La data a formatar
 * @param options - Opcions de format (per defecte: dia de la setmana + dia + mes)
 */
export function formatDateToCatalan(
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }
): string {
  return date.toLocaleDateString('ca-ES', {
    timeZone: 'Europe/Madrid',
    ...options,
  })
}

/**
 * Retorna el nom del dia de la setmana en català (minúscules).
 * S'usa per filtrar els menús del dia correcte.
 * Ex: new Date() un dimarts → 'dimarts'
 */
export function getDayNameInCatalan(date: Date): string {
  return date.toLocaleDateString('ca-ES', {
    weekday: 'long',
    timeZone: 'Europe/Madrid',
  }).toLowerCase()
}
