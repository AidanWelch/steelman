// supabase functions deploy vote --project-ref xxxxxxxxxxxxxxx

import { createClient } from 'https://esm.sh/@supabase/supabase-js';

Deno.serve(async (req) => {
	try {
		const supabase = createClient(
			Deno.env.get('SUPABASE_URL') ?? '',
			Deno.env.get('SUPABASE_ANON_KEY') ?? '',
			{ global: { headers: { Authorization: req.headers.get('Authorization')! } } }
		)

		const { data, error } = await supabase.from('countries').select('*')

		if (error) {
			throw error
		}

		return new Response(JSON.stringify({ data }), {
			headers: { 'Content-Type': 'application/json' },
			status: 200,
		})
	} catch (err) {
		return new Response(String(err?.message ?? err), { status: 500 })
	}
});