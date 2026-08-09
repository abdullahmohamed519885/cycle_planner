function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing");
  return { url, key };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { url, key } = getSupabase();
    const body = req.body || {};
    const { startDate, duration, cycleLength, reminderDays, email, timezone } = body;

    if (!startDate || !email) {
      return res.status(400).json({ error: "startDate and email are required" });
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

    const response = await fetch(`${url}/rest/v1/cycle_reminders?on_conflict=email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Prefer": "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(row)
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: "Supabase save failed", details: text });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Server error" });
  }
}
