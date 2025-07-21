// Script per provar la connexió a Supabase
async function testSupabase() {
  const supabaseUrl = 'https://txdffbesemavctsuwrmd.supabase.co'
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZGZmYmVzZW1hdmN0c3V3cm1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MjY5MTcsImV4cCI6MjA2NjIwMjkxN30.06SkQCuppzSkTtvjORTVJMaqdq8eEr5l-IweDLjEjEY'
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/menus?select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    const data = await response.text()
    console.log('Response data:', data)
    
    if (response.ok) {
      const parsedData = JSON.parse(data)
      console.log('Parsed data:', parsedData)
      console.log('Number of records:', parsedData.length)
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

// Si estem al navegador, executa el test
if (typeof window !== 'undefined') {
  testSupabase()
}
