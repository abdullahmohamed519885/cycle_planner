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

function nextOccurrence(startDate, cycleLength, today) {
  const length = Math.max(1, Number(cycleLength || 28));
  const diff = diffDays(startDate, today);
  if (diff < 0) return startDate;
  const jumps = Math.floor(diff / length) + 1;
  return addDaysUTC(startDate, jumps * length);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatArabicDate(date) {
  const d = new Date(`${date}T00:00:00Z`);
  return new Intl.DateTimeFormat("ar-EG", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(d);
}

function jsonError(res, status, error, details) {
  return res.status(status).json({ ok: false, error, ...(details ? { details } : {}) });
}

function reminderEmailHtml({ nextStart, reminderDate, endDate, cycleLength, reminderDays }) {
  const nextStartAr = escapeHtml(formatArabicDate(nextStart));
  const reminderAr = escapeHtml(formatArabicDate(reminderDate));
  const endAr = escapeHtml(formatArabicDate(endDate));
  const cycle = escapeHtml(cycleLength);
  const days = escapeHtml(reminderDays);
  const assetBase = "https://cycle-planner-swart.vercel.app";

  return `
<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="color-scheme" content="light">
<title>Cycle Planner</title>
</head>
<body style="margin:0;padding:0;background:#f6f5fb;font-family:Arial,'Tahoma',sans-serif;color:#24233b;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">تذكير لطيف من Cycle Planner: دورتك القادمة تقترب.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f5fb;width:100%;">
    <tr><td align="center" style="padding:20px 10px;">
      <table role="presentation" width="620" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:620px;background:#ffffff;border:1px solid #ddd8f0;border-radius:18px;overflow:hidden;">
        <tr>
          <td style="padding:0;background:#f3efff;">
            <img src="${assetBase}/email-header.png" width="620" alt="Cycle Planner" style="display:block;width:100%;max-width:620px;height:auto;border:0;outline:none;text-decoration:none;">
          </td>
        </tr>
        <tr><td style="padding:28px 28px 10px;text-align:center;">
          <div style="font-size:17px;font-weight:700;color:#24233b;line-height:1.7;">مرحبًا 🌸</div>
          <div style="font-size:14px;color:#66647a;line-height:1.9;margin-top:3px;">هذه رسالة تذكير لطيفة من <strong style="color:#5d4bb6;">Cycle Planner</strong> لمساعدتك على تتبع دورتك.</div>
          <div style="font-size:25px;font-weight:800;color:#5d4bb6;line-height:1.5;margin-top:13px;">🔔 تذكير: دورتك القادمة اقتربت</div>
          <div style="font-size:14px;color:#66647a;line-height:1.9;margin-top:5px;">وفقًا للمعلومات التي سجلتها، نتوقع أن تبدأ دورتك القادمة في:</div>
        </td></tr>
        <tr><td style="padding:14px 28px 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf8ff;border:1px solid #ddd4f7;border-radius:15px;">
            <tr>
              <td width="34%" align="center" style="padding:20px 10px;border-left:1px solid #ddd4f7;">
                <div style="width:70px;height:70px;line-height:70px;border-radius:50%;background:#eee8ff;color:#5d4bb6;font-size:34px;margin:auto;">📅</div>
              </td>
              <td align="right" style="padding:20px 18px;">
                <div style="font-size:15px;font-weight:700;color:#24233b;margin-bottom:7px;">تاريخ الدورة القادمة</div>
                <div style="font-size:23px;font-weight:800;color:#5d4bb6;line-height:1.5;">${nextStartAr}</div>
                <div style="font-size:13px;color:#77728e;margin-top:5px;">قبل ${days} أيام من الموعد المتوقع: <strong style="color:#c44b83;">${reminderAr}</strong></div>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:10px 28px 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf8ff;border:1px solid #ddd4f7;border-radius:15px;">
            <tr><td style="padding:17px;text-align:center;">
              <div style="font-size:15px;font-weight:700;color:#24233b;">فترة دورتك المعتادة</div>
              <div style="font-size:15px;color:#77728e;margin-top:5px;">كل ${cycle} يوم تقريبًا</div>
              <div style="font-size:12px;color:#9a96aa;margin-top:4px;">الفترة المتوقعة: ${nextStartAr} — ${endAr}</div>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:18px 28px 26px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef7ff;border:1px solid #c9e2fb;border-radius:14px;">
            <tr><td style="padding:15px 17px;text-align:center;">
              <div style="font-size:14px;font-weight:700;color:#34577a;">💙 نحن نهتم بصحتك وراحتك</div>
              <div style="font-size:12px;line-height:1.8;color:#54708b;margin-top:4px;">إذا كان هناك أي تغيير في دورتك، يمكنك تحديث المعلومات في أي وقت.</div>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:22px 28px;background:#f6f2ff;border-top:1px solid #e4ddf3;text-align:center;">
          <div style="font-size:17px;font-weight:800;color:#5d4bb6;">Cycle Planner</div>
          <div style="font-size:18px;color:#9a83d7;margin:5px 0;">──── ♡ ────</div>
          <div style="font-size:12px;line-height:1.8;color:#8b8799;">هذه رسالة تلقائية، يرجى عدم الرد عليها.</div>
          <div style="font-size:11px;color:#aaa6b4;margin-top:4px;">© ${new Date().getFullYear()} Cycle Planner. جميع الحقوق محفوظة.</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
    const response = await fetch(`${sbUrl}/rest/v1/cycle_reminders?active=eq.true&select=*`, {
      headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` }
    });
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

        if (s.last_reminder_key === reminderKey || diffDays(today, reminderDate) < 0) {
          skipped++;
          continue;
        }

        const endDate = addDaysUTC(nextStart, duration - 1);
        const recipient = String(s.email || "").trim().toLowerCase();
        if (!recipient) throw new Error("Reminder email is empty");

        const providerResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: { accept: "application/json", "api-key": brevoKey, "content-type": "application/json" },
          body: JSON.stringify({
            sender: { email: from, name: fromName },
            to: [{ email: recipient }],
            subject: "تذكير: دورتك القادمة اقتربت — Cycle Planner 🔔",
            htmlContent: reminderEmailHtml({ nextStart, reminderDate, endDate, cycleLength, reminderDays })
          })
        });

        const providerData = await providerResponse.json().catch(() => ({}));
        if (!providerResponse.ok) throw new Error(providerData?.message || providerData?.code || "Brevo email provider error");

        const update = await fetch(`${sbUrl}/rest/v1/cycle_reminders?id=eq.${encodeURIComponent(s.id)}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: sbKey,
            Authorization: `Bearer ${sbKey}`,
            Prefer: "return=minimal"
          },
          body: JSON.stringify({ last_reminder_key: reminderKey, updated_at: new Date().toISOString() })
        });

        if (!update.ok) throw new Error(`Supabase update failed: ${await update.text()}`);
        sent++;
      } catch (error) {
        errors.push({ email: s.email, error: error.message || "Reminder error" });
      }
    }

    return res.status(200).json({ ok: true, checked: schedules.length, sent, skipped, errors });
  } catch (error) {
    return jsonError(res, 500, error.message || "Cron error");
  }
}
