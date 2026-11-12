export async function onRequestPost({ request, env }) {
  try {
    const form = await request.formData();

    const token = form.get("cf-turnstile-response");

    if (!token || !env.TURNSTILE_SECRET_KEY) {
      return new Response("Security verification unavailable.", {
        status: 400
      });
    }

    const verification = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          secret: env.TURNSTILE_SECRET_KEY,
          response: token
        })
      }
    );

    const result = await verification.json();

    if (!result.success) {
      return new Response("Security verification failed.", {
        status: 403
      });
    }

    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const state = String(form.get("state") || "").trim();
    const service = String(form.get("service") || "").trim();

    if (!name || !email || !service) {
      return new Response("Please complete required fields.", {
        status: 400
      });
    }

    if (
      name.length > 150 ||
      email.length > 254 ||
      phone.length > 40 ||
      state.length > 100 ||
      service.length > 150 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return new Response("Invalid form information.", {
        status: 400
      });
    }

    if (!env.DB) {
      return new Response("Database unavailable.", {
        status: 503
      });
    }

    await env.DB.prepare(
      `INSERT INTO consultations
       (full_name, email, phone, state, service)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(name, email, phone, state, service)
      .run();

    return new Response(
      "Thank you! Your consultation request has been received.",
      { status: 200 }
    );

  } catch (error) {
    console.error("Consultation submission failed");

    return new Response(
      "Unable to process your request right now.",
      { status: 500 }
    );
  }
}
