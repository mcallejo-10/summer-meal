import { supabase } from './src/lib/supabase'

// Dades d'exemple per a la taula menus
const sampleMenus = [
  // Dilluns
  { day: 'dilluns', meal_type: 'dinar', diet_type: 'omnivora', name: 'Paella Valenciana', description: 'Paella tradicional amb pollastre i verdures' },
  { day: 'dilluns', meal_type: 'dinar', diet_type: 'vegetariana', name: 'Amanida Buddha Bowl', description: 'Bowl amb quinoa, alvocat i verdures' },
  { day: 'dilluns', meal_type: 'dinar', diet_type: 'vegana', name: 'Curry de Cigrons', description: 'Curry vegà amb llet de coco' },
  { day: 'dilluns', meal_type: 'sopar', diet_type: 'omnivora', name: 'Pollastre a la planxa', description: 'Amb verdures de temporada' },
  { day: 'dilluns', meal_type: 'sopar', diet_type: 'vegetariana', name: 'Truita de patates', description: 'Truita casolana amb amanida' },
  { day: 'dilluns', meal_type: 'sopar', diet_type: 'vegana', name: 'Tofu saltejat', description: 'Amb verdures asiàtiques' },

  // Dimarts
  { day: 'dimarts', meal_type: 'dinar', diet_type: 'omnivora', name: 'Pollastre al curry', description: 'Pollastre tendre amb salsa de curry suau' },
  { day: 'dimarts', meal_type: 'dinar', diet_type: 'vegetariana', name: 'Lasanya de verdures', description: 'Lasanya amb albergínia, carbassó i formatge' },
  { day: 'dimarts', meal_type: 'dinar', diet_type: 'vegana', name: 'Bowl de Tofu', description: 'Tofu marinat amb verdures saltejades' },
  { day: 'dimarts', meal_type: 'sopar', diet_type: 'omnivora', name: 'Peix al forn', description: 'Peix fresc amb patates i herbes' },
  { day: 'dimarts', meal_type: 'sopar', diet_type: 'vegetariana', name: 'Pasta amb verdures', description: 'Pasta integral amb verdures de temporada' },
  { day: 'dimarts', meal_type: 'sopar', diet_type: 'vegana', name: 'Llenties especiades', description: 'Llenties amb espècies del mediterrani' },

  // Dimecres
  { day: 'dimecres', meal_type: 'dinar', diet_type: 'omnivora', name: 'Peix al forn', description: 'Peix fresc amb patates i herbes' },
  { day: 'dimecres', meal_type: 'dinar', diet_type: 'vegetariana', name: 'Risotto de bolets', description: 'Risotto cremós amb bolets de temporada' },
  { day: 'dimecres', meal_type: 'dinar', diet_type: 'vegana', name: 'Llenties especiades', description: 'Llenties amb espècies del mediterrani' },
  { day: 'dimecres', meal_type: 'sopar', diet_type: 'omnivora', name: 'Hamburguesa casolana', description: 'Amb patates fregides' },
  { day: 'dimecres', meal_type: 'sopar', diet_type: 'vegetariana', name: 'Crema de verdures', description: 'Amb pa integral torrat' },
  { day: 'dimecres', meal_type: 'sopar', diet_type: 'vegana', name: 'Hamburguesa vegana', description: 'Amb patates al forn' },

  // Dijous
  { day: 'dijous', meal_type: 'dinar', diet_type: 'omnivora', name: 'Macarrons amb carn', description: 'Macarrons amb salsa de tomàquet i carn' },
  { day: 'dijous', meal_type: 'dinar', diet_type: 'vegetariana', name: 'Quinoa amb verdures', description: 'Quinoa amb verdures rostides' },
  { day: 'dijous', meal_type: 'dinar', diet_type: 'vegana', name: 'Estofat de mongetes', description: 'Mongetes amb verdures i espècies' },
  { day: 'dijous', meal_type: 'sopar', diet_type: 'omnivora', name: 'Sopa amb entrepà', description: 'Sopa casolana amb entrepà mixt' },
  { day: 'dijous', meal_type: 'sopar', diet_type: 'vegetariana', name: 'Amanida completa', description: 'Amanida amb nous, formatge i fruita' },
  { day: 'dijous', meal_type: 'sopar', diet_type: 'vegana', name: 'Sopa de verdures', description: 'Sopa amb llegums i cereals' },

  // Divendres
  { day: 'divendres', meal_type: 'dinar', diet_type: 'omnivora', name: 'Fideuà de marisc', description: 'Fideuà amb marisc fresc' },
  { day: 'divendres', meal_type: 'dinar', diet_type: 'vegetariana', name: 'Arròs amb verdures', description: 'Arròs amb verdures de temporada' },
  { day: 'divendres', meal_type: 'dinar', diet_type: 'vegana', name: 'Fideuà vegetal', description: 'Fideuà amb verdures i algues' },
  { day: 'divendres', meal_type: 'sopar', diet_type: 'omnivora', name: 'Pizza individual', description: 'Pizza amb ingredients frescos' },
  { day: 'divendres', meal_type: 'sopar', diet_type: 'vegetariana', name: 'Pizza vegetariana', description: 'Pizza amb verdures i formatge' },
  { day: 'divendres', meal_type: 'sopar', diet_type: 'vegana', name: 'Pizza vegana', description: 'Pizza amb verdures i formatge vegà' }
]

async function insertSampleMenus() {
  console.log('Insertant menús d\'exemple...')
  
  const { data, error } = await supabase
    .from('menus')
    .insert(sampleMenus)
    .select()

  if (error) {
    console.error('Error insertant menús:', error)
  } else {
    console.log('Menús insertats correctament:', data?.length, 'elements')
  }
}

// Executar només si es crida directament
if (require.main === module) {
  insertSampleMenus()
}
