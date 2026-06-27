// POST /api/waitlist
// Body: { email: "user@example.com", role?: "producer" | "artist" | "other" }
// Returns: { ok: true } or { error: "..." }

export async function onRequestPost(context) {
	const { request, env } = context;

	try {
		const body = await request.json().catch(() => null);

		if (!body || typeof body !== "object") {
			return json(
				{ error: "Invalid request body" },
				400
			);
		}

		const { email, role = "other" } = body;

		if (!email || typeof email !== "string") {
			return json(
				{ error: "Email is required" },
				400
			);
		}

		const cleanEmail = email.toLowerCase().trim();

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
			return json(
				{ error: "Invalid email" },
				400
			);
		}

		if (cleanEmail.length > 254) {
			return json(
				{ error: "Email too long" },
				400
			);
		}

		const cleanRole = normalizeRole(role);

		if (!env.DB) {
			return json(
				{ error: "D1 database binding is not configured" },
				500
			);
		}

		await env.DB.prepare(
			`INSERT INTO waitlist (email, role, created_at)
			 VALUES (?, ?, ?)
			 ON CONFLICT(email) DO NOTHING`
		)
			.bind(cleanEmail, cleanRole, new Date().toISOString())
			.run();

		return json({ ok: true });
	} catch (err) {
		return json(
			{
				error: "Could not save",
				detail: err instanceof Error ? err.message : "Unknown error"
			},
			500
		);
	}
}

export async function onRequestOptions() {
	return new Response(null, {
		status: 204,
		headers: corsHeaders()
	});
}

function normalizeRole(role) {
	const allowedRoles = new Set(["producer", "artist", "other"]);

	if (typeof role !== "string") {
		return "other";
	}

	const cleanRole = role.toLowerCase().trim();

	return allowedRoles.has(cleanRole) ? cleanRole : "other";
}

function json(payload, status = 200) {
	return Response.json(payload, {
		status,
		headers: corsHeaders()
	});
}

function corsHeaders() {
	return {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type"
	};
}