import { supabase } from './src/lib/supabase.js'

async function testConnection() {
  console.log('Provant connexió a Supabase...')
  
  try {
    // Prova de connexió bàsica
    const { data, error } = await supabase
      .from('menus')
      .select('*')
      .limit(5)

    if (error) {
      console.error('Error:', error)
    } else {
      console.log('Connexió exitosa!')
      console.log('Dades trobades:', data?.length, 'menús')
      if (data?.length > 0) {
        console.log('Primer menú:', data[0])
      }
    }
  } catch (err) {
    console.error('Error de connexió:', err)
  }
}

testConnection()
