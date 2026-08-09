function getSupabase() {
  const url = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!url || !key) {
    throw new Error("Supabase environment variables are missing");
  }

  return { url, key };
}

function supabaseHeaders(key, extra = {}) {
  return {
    "Content-Type": "application/json",
    "apikey": key,
    ...extra
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url, key } = getSupabase();
    const body = req.body || {};

    const email = String(body.email || "").trim().toLowerCase();
    const startDate = String(body.startDate || "").trim();

    if (!startDate || !email) {
      return res.status(400).json({
        error: "startDate and email are required"
      });
    }

    const row = {
      email,
      start_date: startDate,
      duration_days: Number(body.duration || 5),
      cycle_length: Number(body.cycleLength || 28),
      reminder_days: Number(body.reminderDays || 3),
      timezone: String(body.timezone || "UTC"),
      active: true
    };

    /*
      Do not use ?on_conflict=email here.
      Older versions of the table may not have a UNIQUE constraint on email.
      Instead, find the row first, then PATCH it or INSERT it.
    */
    const lookupUrl =
      `${url}/rest/v1/cycle_reminders` +
      `?email=eq.${encodeURIComponent(email)}` +
      `&select=id&limit=1`;

    const lookup = await fetch(lookupUrl, {
      method: "GET",
      headers: {
        "apikey": key
      }
    });

    const lookupText = await lookup.text();

    if (!lookup.ok) {
      console.error("Supabase lookup error:", lookup.status, lookupText);
      return res.status(500).json({
        error: "Supabase save failed",
        stage: "lookup",
        status: lookup.status,
        details: lookupText
      });
    }

    let existing = [];
    try {
      existing = lookupText ? JSON.parse(lookupText) : [];
    } catch {
      existing = [];
    }

    let response;

    if (existing.length > 0) {
      response = await fetch(
        `${url}/rest/v1/cycle_reminders?id=eq.${encodeURIComponent(existing[0].id)}`,
        {
          method: "PATCH",
          headers: supabaseHeaders(key, {
            "Prefer": "return=minimal"
          }),
          body: JSON.stringify(row)
        }
      );
    } else {
      response = await fetch(
        `${url}/rest/v1/cycle_reminders`,
        {
          method: "POST",
          headers: supabaseHeaders(key, {
            "Prefer": "return=minimal"
          }),
          body: JSON.stringify(row)
        }
      );
    }

    const text = await response.text();

    if (!response.ok) {
      console.error("Supabase write error:", response.status, text);

      return res.status(500).json({
        error: "Supabase save failed",
        stage: existing.length > 0 ? "update" : "insert",
        status: response.status,
        details: text
      });
    }

    return res.status(200).json({
      ok: true,
      action: existing.length > 0 ? "updated" : "created"
    });
  } catch (error) {
    console.error("Save reminder error:", error);

    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}
