import type { APIRoute } from "astro";

/** This route runs on demand; the rest of the site stays prerendered. */
export const prerender = false;

const LIMITS = { name: 100, email: 254, message: 4000 } as const;

const UNAVAILABLE =
    "The message could not be sent. Please try again later.";

type Fields = { name: string; email: string; message: string };

function json(body: unknown, status: number): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
    });
}

function validate(form: FormData): { fields: Fields } | { error: string } {
    // Bots fill in every field they find. Humans never see this one.
    if (String(form.get("company") ?? "").trim() !== "") {
        return { error: "Rejected." };
    }

    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();

    if (!name || !email || !message) {
        return { error: "Please fill in every field." };
    }
    if (
        name.length > LIMITS.name ||
        email.length > LIMITS.email ||
        message.length > LIMITS.message
    ) {
        return { error: "That is longer than this form accepts." };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        return { error: "That email address does not look right." };
    }

    return { fields: { name, email, message } };
}

/** "failed" is the visitor's problem to retry; "unavailable" is ours. */
type CheckResult = "passed" | "failed" | "unavailable";

async function checkTurnstile(
    token: string,
    secret: string,
    ip: string | null,
): Promise<CheckResult> {
    const body = new FormData();
    body.append("secret", secret);
    body.append("response", token);
    if (ip) body.append("remoteip", ip);

    try {
        const response = await fetch(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            { method: "POST", body },
        );

        if (!response.ok) {
            console.error("Turnstile siteverify failed", {
                status: response.status,
            });
            return "unavailable";
        }

        const result = (await response.json()) as { success?: boolean };
        return result.success === true ? "passed" : "failed";
    } catch (error) {
        // DNS or connectivity trouble inside the Worker. Letting this escape
        // would return an opaque 500 rather than the JSON the client parses.
        console.error("Turnstile siteverify threw", error);
        return "unavailable";
    }
}

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
    const env = locals.runtime.env;

    let form: FormData;
    try {
        form = await request.formData();
    } catch {
        return json({ error: "Malformed request." }, 400);
    }

    const validated = validate(form);
    if ("error" in validated) return json({ error: validated.error }, 400);
    const { name, email, message } = validated.fields;

    const token = String(form.get("cf-turnstile-response") ?? "");
    if (!token) {
        return json({ error: "Please complete the anti-spam check." }, 400);
    }
    const check = await checkTurnstile(
        token,
        env.TURNSTILE_SECRET_KEY,
        clientAddress ?? null,
    );

    if (check === "failed") {
        return json({ error: "The anti-spam check failed. Try again." }, 403);
    }
    if (check === "unavailable") {
        return json({ error: UNAVAILABLE }, 502);
    }

    let sent: Response;
    try {
        sent = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                authorization: `Bearer ${env.RESEND_API_KEY}`,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                from: env.CONTACT_FROM_EMAIL,
                to: [env.CONTACT_TO_EMAIL],
                // The visitor controls this address, so it is only ever a
                // reply-to. Putting it in `from` would forge the sender and
                // get the mail spam-filtered.
                reply_to: email,
                subject: `Portfolio enquiry from ${name}`,
                text: `From: ${name} <${email}>\n\n${message}`,
            }),
        });
    } catch (error) {
        console.error("Resend request threw", error);
        return json({ error: UNAVAILABLE }, 502);
    }

    if (!sent.ok) {
        console.error("Resend rejected the message", {
            status: sent.status,
            body: await sent.text(),
        });
        return json({ error: UNAVAILABLE }, 502);
    }

    return json({ ok: true }, 200);
};
