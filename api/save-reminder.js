function getSupabase() {
  const rawUrl = String(process.env.SUPABASE_URL || "").trim();
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!rawUrl || !key) {
    throw new Error("Supabase environment variables are missing");
  }

  // Normalize the project URL so we never create a malformed REST URL.
  const url = rawUrl.replace(/\/+$/, "");

  return { url, key };
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function supabaseRequest(url, key, path, options = {}) {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Content-Profile": "public",
      "Accept-Profile": "public",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return { response, data, text };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { url, key } = getSupabase();
    const body = req.body || {};
    const { startDate, duration, cycleLength, reminderDays, email, timezone } = body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!startDate || !normalizedEmail) {
      return res.status(400).json({
        ok: false,
        error: "startDate and email are required"
      });
    }

    if (!validEmail(normalizedEmail)) {
      return res.status(400).json({
        ok: false,
        error: "صيغة البريد الإلكتروني غير صحيحة"
      });
    }

    const row = {
      email: normalizedEmail,
      start_date: startDate,
      duration_days: Math.min(15, Math.max(1, Number(duration || 5))),
      cycle_length: Math.min(60, Math.max(15, Number(cycleLength || 28))),
      reminder_days: Math.min(30, Math.max(0, Number(reminderDays || 0))),
      timezone: String(timezone || "UTC"),
      active: true,
      last_reminder_key: null,
      updated_at: new Date().toISOString()
    };

    // First try a normal INSERT. This avoids relying on the
    // on_conflict query parameter and gives us a clearer fallback.
    const insertResult = await supabaseRequest(
      url,
      key,
      "cycle_reminders",
      {
        method: "POST",
        headers: {
          Prefer: "return=representation"
        },
        body: JSON.stringify(row)
      }
    );

    if (insertResult.response.ok) {
      return res.status(200).json({
        ok: true,
        message: "Reminder saved successfully",
        data: insertResult.data
      });
    }

    // If the email already exists, update that record instead.
    // PostgreSQL's UNIQUE(email) constraint returns 409 on the insert.
    if (insertResult.response.status === 409) {
      const filter = `email=eq.${encodeURIComponent(normalizedEmail)}`;

      const updateResult = await supabaseRequest(
        url,
        key,
        `cycle_reminders?${filter}`,
        {
          method: "PATCH",
          headers: {
            Prefer: "return=representation"
          },
          body: JSON.stringify(row)
        }
      );

      if (updateResult.response.ok) {
        return res.status(200).json({
          ok: true,
          message: "Reminder updated successfully",
          data: updateResult.data
        });
      }

      return res.status(500).json({
        ok: false,
        error: "Supabase update failed",
        details: updateResult.data || updateResult.text
      });
    }

    return res.status(500).json({
      ok: false,
      error: "Supabase save failed",
      status: insertResult.response.status,
      details: insertResult.data || insertResult.text
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || "Server error"
    });
  }
}
