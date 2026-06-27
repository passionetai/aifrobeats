// POST /api/analyze
// Body: { vibe: "sad Burna Boy at 100 BPM with horns" }
// Returns: { bpm, key, mood_tags: [], elements: [], description }

export async function onRequestPost(context) {
	const { request, env } = context;

	try {
		const { vibe } = await request.json();

		if (!vibe || typeof vibe !== "string" || vibe.trim().length === 0) {
			return Response.json({ error: "Invalid vibe input" }, { status: 400 });
		}

		if (vibe.length > 300) {
			return Response.json({ error: "Vibe input is too long" }, { status: 400 });
		}

		if (!env.AI) {
			return Response.json(
				{ error: "Workers AI binding is not configured" },
				{ status: 500 }
			);
		}

		const cleanVibe = vibe.trim();

		const systemPrompt = `You are an expert Afrobeats music producer and A&R. Given a vibe description, output structured tags as if cataloging a beat for a marketplace.

You know the Afrobeats production vocabulary deeply: log drum, shekere, talking drum, 808 sub bass, dotted hi-hats, sparse horns, melancholic vocal chops, amapiano-influenced bass slides, Afro-house four-on-the-floor patterns, mid-tempo (90-115 BPM) sweet spot, common keys including A minor, D minor, F# minor, G minor, C minor, and E minor.

Interpret references musically, not literally. If the user mentions an artist, infer tempo, mood, percussion, melody, and arrangement style without copying any copyrighted melody or lyric.

Output ONLY valid JSON in this exact shape, nothing else:
{
	"bpm": <integer between 85 and 130>,
	"key": "<key like 'A minor' or 'F# minor'>",
	"mood_tags": [<3-5 short mood words>],
	"elements": [<4-7 specific production elements>],
	"description": "<one sentence, max 25 words, describing where this beat sits in the Afrobeats spectrum>"
}`;

		const aiResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
			messages: [
				{
					role: "system",
					content: systemPrompt
				},
				{
					role: "user",
					content: `Vibe: ${cleanVibe}`
				}
			],
			temperature: 0.7,
			max_tokens: 400
		});

		const text = aiResponse.response || "";
		const jsonMatch = text.match(/\{[\s\S]*\}/);

		if (!jsonMatch) {
			return Response.json(
				{ error: "Could not parse AI response" },
				{ status: 500 }
			);
		}

		const parsed = JSON.parse(jsonMatch[0]);
		const normalized = normalizeAnalysis(parsed, cleanVibe);

		return Response.json(normalized);
	} catch (err) {
		return Response.json(
			{
				error: "Analysis failed",
				detail: err instanceof Error ? err.message : "Unknown error"
			},
			{ status: 500 }
		);
	}
}

export async function onRequestOptions() {
	return new Response(null, {
		status: 204,
		headers: corsHeaders()
	});
}

function normalizeAnalysis(data, vibe) {
	const bpm = clampInteger(data.bpm, 85, 130, inferFallbackBpm(vibe));
	const key = typeof data.key === "string" && data.key.trim()
		? data.key.trim()
		: "A minor";

	const mood_tags = normalizeStringArray(data.mood_tags, 3, 5, [
		"melancholic",
		"warm",
		"mid-tempo"
	]);

	const elements = normalizeStringArray(data.elements, 4, 7, [
		"log drum",
		"808 sub bass",
		"dotted hi-hats",
		"sparse horns"
	]);

	const description = typeof data.description === "string" && data.description.trim()
		? trimSentence(data.description.trim(), 25)
		: "This beat sits in warm mid-tempo Afrobeats territory with clean percussion and emotional melodic space.";

	return {
		bpm,
		key,
		mood_tags,
		elements,
		description
	};
}

function normalizeStringArray(value, min, max, fallback) {
	const source = Array.isArray(value) ? value : fallback;

	const cleaned = source
		.map((item) => String(item || "").trim())
		.filter(Boolean)
		.slice(0, max);

	if (cleaned.length >= min) {
		return cleaned;
	}

	const extras = fallback.filter((item) => !cleaned.includes(item));

	return [...cleaned, ...extras].slice(0, max);
}

function clampInteger(value, min, max, fallback) {
	const number = Number.parseInt(value, 10);

	if (Number.isNaN(number)) {
		return fallback;
	}

	return Math.min(max, Math.max(min, number));
}

function inferFallbackBpm(vibe) {
	const match = vibe.match(/\b(8[5-9]|9[0-9]|1[01][0-9]|12[0-9]|130)\s?bpm\b/i);

	if (match) {
		return Number.parseInt(match[1], 10);
	}

	return 100;
}

function trimSentence(sentence, maxWords) {
	const words = sentence.split(/\s+/);

	if (words.length <= maxWords) {
		return sentence;
	}

	return `${words.slice(0, maxWords).join(" ")}.`;
}

function corsHeaders() {
	return {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type"
	};
}