import { Resend } from "resend";

function addDaysUTC(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function diffDays(a, b) {
  const A = new Date(`${a}T00:00:00Z`);
  const B = new Date(`${b}T00:00:00Z`);
  return Math.round((B - A) / 86400000);
}

function localDate(timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZone || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function nextOccurrence(startDate, cycleLength, today) {
  const diff = diffDays(startDate, today);
  if (diff < 0) return startDate;
  const jumps = Math.floor(diff / cycleLength) + 1;
  return addDaysUTC(startDate, jumps * cycleLength);
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const sbUrl = process.env.SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!sbUrl || !sbKey || !resendKey || !from) {
    return res.status(500).json({ error: "Missing server environment variables" });
  }

  try {
    const response = await fetch(
      `${sbUrl}/rest/v1/cycle_reminders?active=eq.true&select=*`,
      {
        headers: {
          "apikey": sbKey,
          "Authorization": `Bearer ${sbKey}`
        }
      }
    );

    if (!response.ok) throw new Error(await response.text());

    const schedules = await response.json();
    const resend = new Resend(resendKey);
    let sent = 0;

    for (const s of schedules) {
      const today = localDate(s.timezone || "UTC");
      const nextStart = nextOccurrence(
        s.start_date,
        Number(s.cycle_length || 28),
        today
      );
      const reminderDate = addDaysUTC(nextStart, -Number(s.reminder_days || 0));
      const reminderKey = `${nextStart}:${s.reminder_days}`;

      if (today !== reminderDate || s.last_reminder_key === reminderKey) continue;

      const duration = Number(s.duration_days || 5);
      const endDate = addDaysUTC(nextStart, duration - 1);

      const result = await resend.emails.send({
        from,
        to: [s.email],
        subject: "تذكير بالموعد القادم — Cycle Planner",
        html: `
          <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.9">
            <h2>🔔 تذكير بالموعد القادم</h2>
            <p>الموعد المتوقع للبداية: <strong>${nextStart}</strong></p>
            <p>الأيام المتوقعة: من <strong>${nextStart}</strong> إلى <strong>${endDate}</strong>.</p>
            <p>هذا تذكير تنظيمي مبني على البيانات التي أدخلتها.</p>
          </div>
        `
      });

      if (result.error) throw new Error(result.error.message || "Resend error");

      await fetch(`${sbUrl}/rest/v1/cycle_reminders?email=eq.${encodeURIComponent(s.email)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": sbKey,
          "Authorization": `Bearer ${sbKey}`
        },
        body: JSON.stringify({ last_reminder_key: reminderKey })
      });

      sent++;
    }

    return res.status(200).json({ ok: true, checked: schedules.length, sent });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Cron error" });
  }
}
