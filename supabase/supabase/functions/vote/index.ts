///<reference types='@hcaptcha/types'/>
// supabase functions deploy vote --project-ref xxxxxxxxxxxxxxx

import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const MAX_BODY_LENGTH = 5000; // try to prevent people using long bodies to DOS
// attack the JSON parsing

const VOTES_PER_REQUEST = 10; // how many votes should the user submit before
// actually posting them to the api

Deno.serve(async (req) => {
	if ( req.method !== 'POST' ) {
		return new Response('Voting is not idempotent, you must POST your vote', { status: 405 });
	}

	if ( !req.headers.has('Content-Length') ) {
		return new Response('Content-Length must be included', { status: 411 });
	}

	const contentLength = parseInt( req.headers.get('Content-Length') as string );
	// parsing as string because even if null, returns NaN, which is always
	// false on evalutation

	if ( contentLength > MAX_BODY_LENGTH ) {
		return new Response('Content-Length cannot exceed 5000', { status: 413 });
	}

	const body = await req.text(); // req.json() essentially just calls
	// JSON.parse() on req.text() anyways, so should have no significant
	// performance cost

	if ( body.length !== contentLength ) { // I think body.length is essentially
		// byte length, will fix if not
		return new Response('Actual body length didn\'t match the header Content-Length', {status: 400});
	}

	let bodyObject;

	try {
		bodyObject = JSON.parse(body);
	} catch (_) {
		return new Response('Body couldn\'t be parsed as JSON', {status: 400})
	}

	if (
		bodyObject === null ||
		typeof bodyObject !== 'object' ||
		!Array.isArray(bodyObject.votes) ||
		bodyObject.votes.length !== VOTES_PER_REQUEST
	) {
		return new Response('Didn\'t include a valid number of votes', {status: 400});
	}

	const responseData = {};

	if ( typeof bodyObject['h-captcha-response'] === 'string' ) {
		// this is first because should prefer to refresh jwt

	} else if ( typeof bodyObject.jwt === 'string' ) {

	} else {
		return new Response('No valid method of authentication', {status: 401});
	}


	try {
		const supabase = createClient(
			Deno.env.get('SUPABASE_URL') ?? '',
			Deno.env.get('SUPABASE_ANON_KEY') ?? ''
		);

		const { data, error } = await supabase.from('countries').select('*');

		if (error) {
			throw error;
		}

		return new Response(JSON.stringify({ data }), {
			headers: { 'Content-Type': 'application/json' },
			status: 200,
		});
	} catch (err) {
		console.error(String(err?.message ?? err));
		return new Response(String(err?.message ?? err), { status: 500 });
	}
});