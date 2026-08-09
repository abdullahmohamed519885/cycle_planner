function getConfig() {
  const url = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!url || !key) {
    throw new Error("Supabase environment variables are missing");
  }

  return { url, key };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url, key } = getConfig();
    const body = req.body || {};

    const email = String(body.email || "").trim().toLowerCase();
    const startDate = String(body.startDate || "").trim();

    if (!email || !startDate) {
      return res.status(400).json({ error: "email and startDate are required" });
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

    const response = await fetch(
      `${url}/rest/v1/cycle_reminders?on_conflict=email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": key,
          "Prefer": "resolution=merge-duplicates,return=minimal"
        },
        body: JSON.stringify(row)
      }
    );

    const text = await response.text();

    if (!response.ok) {
      let details = text;
      try { details = JSON.parse(text); } catch {}

      console.error("Supabase REST error:", response.status, details);

      return res.status(500).json({
        error: "Supabase save failed",
        status: response.status,
        details
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Save reminder error:", error);
    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}
