function getSupabase() {
  const url = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!url || !key) {
    throw new Error("Supabase environment variables are missing");
  }

  return { url, key };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { url, key } = getSupabase();

    const {
      startDate,
      duration,
      cycleLength,
      reminderDays,
      email,
      timezone
    } = req.body || {};

    if (!startDate || !email) {
      return res.status(400).json({
        error: "startDate and email are required"
      });
    }

    const row = {
      email: String(email).trim().toLowerCase(),
      start_date: startDate,
      duration_days: Number(duration || 5),
      cycle_length: Number(cycleLength || 28),
      reminder_days: Number(reminderDays || 3),
      timezone: timezone || "UTC",
      active: true
    };

    // 1. ابحث عن البريد أولًا
    const lookupUrl =
      `${url}/rest/v1/cycle_reminders` +
      `?select=id` +
      `&email=eq.${encodeURIComponent(row.email)}` +
      `&limit=1`;

    const lookupResponse = await fetch(lookupUrl, {
      method: "GET",
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`
      }
    });

    const lookupText = await lookupResponse.text();

    if (!lookupResponse.ok) {
      return res.status(500).json({
        error: "Supabase lookup failed",
        status: lookupResponse.status,
        details: lookupText,
        url_used: lookupUrl.replace(row.email, "***")
      });
    }

    let existing = [];

    try {
      existing = JSON.parse(lookupText);
    } catch {
      existing = [];
    }

    let response;

    // 2. لو موجود حدثه
    if (existing.length > 0) {
      response = await fetch(
        `${url}/rest/v1/cycle_reminders?id=eq.${existing[0].id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "apikey": key,
            "Authorization": `Bearer ${key}`,
            "Prefer": "return=minimal"
          },
          body: JSON.stringify(row)
        }
      );
    }

    // 3. لو مش موجود أضفه
    else {
      response = await fetch(
        console.log("SUPABASE URL:", url);
console.log(
  "TABLE URL:",
  `${url}/rest/v1/cycle_reminders`
);,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": key,
            "Authorization": `Bearer ${key}`,
            "Prefer": "return=minimal"
          },
          body: JSON.stringify(row)
        }
      );
    }

    const responseText = await response.text();

    if (!response.ok) {
      return res.status(500).json({
        error: "Supabase save failed",
        status: response.status,
        details: responseText
      });
    }

    return res.status(200).json({
      ok: true,
      action: existing.length > 0 ? "updated" : "created"
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}
