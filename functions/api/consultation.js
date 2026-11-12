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

    return new Response(
      "Verification successful. Consultation processing is not yet enabled.",
      { status: 200 }
    );
  } catch {
    return new Response("Unable to process request.", {
      status: 400
    });
  }
}
