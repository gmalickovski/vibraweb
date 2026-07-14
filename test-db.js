import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ribbastgcdjdobplzopj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpYmJhc3RnY2RqZG9icGx6b3BqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NDI4ODEsImV4cCI6MjA5MjMxODg4MX0.ejdtp6ki3eyWmQmxe7B2Yu6HFgwIR88q4PaDrsHvyRA'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log("Fetching pessoal_impressao for numero 1...")
  const { data, error } = await supabase
    .from('interpretacoes')
    .select('numero, tipo, titulo')
    .eq('tipo', 'pessoal_impressao')
  
  if (error) console.error("Error:", error)
  else console.log("Impressao:", data?.length, "rows found", data)

  const { data: d2, error: e2 } = await supabase
    .from('interpretacoes')
    .select('numero, tipo, titulo')
    .eq('tipo', 'pessoal_expressao')
  
  if (e2) console.error("Error 2:", e2)
  else console.log("Expressao:", d2?.length, "rows found")
}

test()
