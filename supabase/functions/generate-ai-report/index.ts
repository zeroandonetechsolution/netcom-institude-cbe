import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { faculty_id } = await req.json()
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Fetch reports from Supabase (instead of local SQLite)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const { data: rows, error: dbError } = await supabaseClient
      .from('reports')
      .select('*, users(name)')
      .eq('faculty_id', faculty_id)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (dbError) throw dbError
    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'No reports found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Mock AI Summarization (Replace with actual OpenAI/Gemini fetch if needed)
    // For now, mirroring the prompt style from original ai_service.js
    let rawData = rows.map(r => `${r.date} [${r.attendance_status}]: ${r.activities || r.leave_reason}`).join('\n')
    const summary = `Netcom Weekly Report Summary for Faculty ID: ${faculty_id}\n\n${rawData}\n\n(AI Synthesized via Supabase Edge Functions)`

    // 3. (In a real deployment, you'd call a mail API here like Resend or SendGrid)
    console.log('Final Summary to Email:', summary)

    return new Response(JSON.stringify({ success: true, message: 'AI report synthesized and logged' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
