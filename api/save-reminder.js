function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing");
  return { url, key };
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const { url, key } = getSupabase();
    const body = req.body || {};
    const { startDate, duration, cycleLength, reminderDays, email, timezone } = body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!startDate || !normalizedEmail) {
      return res.status(400).json({ ok: false, error: "startDate and email are required" });
    }
    if (!validEmail(normalizedEmail)) {
      return res.status(400).json({ ok: false, error: "صيغة البريد الإلكتروني غير صحيحة" });
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

    const response = await fetch(`${url}/rest/v1/cycle_reminders?on_conflict=email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify(row)
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ ok: false, error: "Supabase save failed", details: text });
    }

    return res.status(200).json({ ok: true, message: "Reminder saved successfully" });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || "Server error" });
  }
}
