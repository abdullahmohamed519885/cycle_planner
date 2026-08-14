function addDaysUTC(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Number(days));
  return d.toISOString().slice(0, 10);
}

function diffDays(a, b) {
  const A = new Date(`${a}T00:00:00Z`);
  const B = new Date(`${b}T00:00:00Z`);
  return Math.round((B - A) / 86400000);
}

function localDate(timeZone) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());
  }
}

// start_date is the user's LAST cycle start.
// We need the NEXT expected cycle start, then subtract reminder_days.
// If today is exactly the last start date, the next occurrence is one
// full cycle later.
function nextOccurrence(startDate, cycleLength, today) {
  const length = Math.max(1, Number(cycleLength || 28));
  const diff = diffDays(startDate, today);
  if (diff < 0) return startDate;
  const jumps = Math.floor(diff / length) + 1;
  return addDaysUTC(startDate, jumps * length);
}

function jsonError(res, status, error, details) {
  return res.status(status).json({ ok: false, error, ...(details ? { details } : {}) });
}

export default async function handler(req, res) {
  if (req.method !== "GET") return jsonError(res, 405, "Method not allowed");

  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return jsonError(res, 401, "Unauthorized");
  }

  const sbUrl = process.env.SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const brevoKey = process.env.BREVO_API_KEY;
  const from = String(process.env.MAIL_FROM || "").trim();
  const fromName = process.env.MAIL_FROM_NAME || "Cycle Planner";

  if (!sbUrl || !sbKey || !brevoKey || !from) {
    return jsonError(res, 500, "Missing server environment variables", {
      SUPABASE_URL: Boolean(sbUrl),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(sbKey),
      BREVO_API_KEY: Boolean(brevoKey),
      MAIL_FROM: Boolean(from)
    });
  }

  try {
    const response = await fetch(
      `${sbUrl}/rest/v1/cycle_reminders?active=eq.true&select=*`,
      {
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`
        }
      }
    );

    if (!response.ok) throw new Error(`Supabase read failed: ${await response.text()}`);

    const schedules = await response.json();
    let sent = 0;
    let skipped = 0;
    const errors = [];

    for (const s of schedules) {
      try {
        const today = localDate(s.timezone || "UTC");
        const cycleLength = Math.max(1, Number(s.cycle_length || 28));
        const reminderDays = Math.max(0, Number(s.reminder_days || 0));
        const duration = Math.max(1, Number(s.duration_days || 5));

        const nextStart = nextOccurrence(s.start_date, cycleLength, today);
        const reminderDate = addDaysUTC(nextStart, -reminderDays);
        const reminderKey = `${nextStart}:${reminderDays}`;

        // Send when today reaches (or passes) the reminder date.
        // If Cron runs late, the reminder is still sent instead of being lost.
        if (s.last_reminder_key === reminderKey) {
          skipped++;
          continue;
        }

        // The reminder date is still in the future.
        if (diffDays(today, reminderDate) < 0) {
          skipped++;
          continue;
        }

        const endDate = addDaysUTC(nextStart, duration - 1);
        const recipient = String(s.email || "").trim().toLowerCase();
        if (!recipient) throw new Error("Reminder email is empty");

        const providerResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "api-key": brevoKey,
            "content-type": "application/json"
          },
          body: JSON.stringify({
            sender: { email: from, name: fromName },
            to: [{ email: recipient }],
            subject: "تذكير بالموعد القادم — Cycle Planner",
            htmlContent: `
              <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.9;max-width:620px;margin:auto">
                <h2>🔔 تذكير بالموعد القادم</h2>
                <p>الموعد المتوقع للبداية: <strong>${nextStart}</strong></p>
                <p>الأيام المتوقعة: من <strong>${nextStart}</strong> إلى <strong>${endDate}</strong>.</p>
                <p>تم إرسال هذا التذكير تلقائيًا من Cycle Planner بناءً على البيانات التي أدخلتها.</p>
              </div>
            `
          })
        });

        const providerData = await providerResponse.json().catch(() => ({}));
        if (!providerResponse.ok) {
          throw new Error(providerData?.message || providerData?.code || "Brevo email provider error");
        }

        const update = await fetch(
          `${sbUrl}/rest/v1/cycle_reminders?id=eq.${encodeURIComponent(s.id)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              apikey: sbKey,
              Authorization: `Bearer ${sbKey}`,
              Prefer: "return=minimal"
            },
            body: JSON.stringify({ last_reminder_key: reminderKey, updated_at: new Date().toISOString() })
          }
        );

        if (!update.ok) throw new Error(`Supabase update failed: ${await update.text()}`);
        sent++;
      } catch (error) {
        errors.push({ email: s.email, error: error.message || "Reminder error" });
      }
    }

    return res.status(200).json({
      ok: true,
      checked: schedules.length,
      sent,
      skipped,
      errors
    });
  } catch (error) {
    return jsonError(res, 500, error.message || "Cron error");
  }
}
