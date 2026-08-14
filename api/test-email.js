function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function addDaysUTC(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Number(days));
  return d.toISOString().slice(0, 10);
}

function diffDays(a, b) {
  return Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000);
}

function nextOccurrence(startDate, cycleLength, today) {
  const length = Math.max(1, Number(cycleLength || 28));
  const diff = diffDays(startDate, today);
  if (diff < 0) return startDate;
  return addDaysUTC(startDate, (Math.floor(diff / length) + 1) * length);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function formatArabicDate(date) {
  return new Intl.DateTimeFormat("ar-EG", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T00:00:00Z`));
}

function reminderEmailHtml({ nextStart, reminderDate, endDate, cycleLength, reminderDays, isTest = false }) {
  const assetBase = "https://cycle-planner-swart.vercel.app";
  const nextStartAr = escapeHtml(formatArabicDate(nextStart));
  const reminderAr = escapeHtml(formatArabicDate(reminderDate));
  const endAr = escapeHtml(formatArabicDate(endDate));
  const cycle = escapeHtml(cycleLength);
  const days = escapeHtml(reminderDays);
  const title = isTest ? "معاينة: شكل تذكيرك القادم" : "تذكير: دورتك القادمة اقتربت";
  const intro = isTest ? "هذه رسالة اختبار لعرض شكل التذكير الحقيقي الذي سيصلك من Cycle Planner." : "هذه رسالة تذكير لطيفة من Cycle Planner لمساعدتك على تتبع دورتك.";

  return `
<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="color-scheme" content="light"><title>Cycle Planner</title></head>
<body style="margin:0;padding:0;background:#f6f5fb;font-family:Arial,'Tahoma',sans-serif;color:#24233b;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(title)} — Cycle Planner</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f5fb;width:100%;"><tr><td align="center" style="padding:20px 10px;">
<table role="presentation" width="620" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:620px;background:#fff;border:1px solid #ddd8f0;border-radius:18px;overflow:hidden;">
<tr><td style="padding:0;background:#f3efff;"><img src="${assetBase}/email-header.png" width="620" alt="Cycle Planner" style="display:block;width:100%;max-width:620px;height:auto;border:0;outline:none;text-decoration:none;"></td></tr>
<tr><td style="padding:28px 28px 10px;text-align:center;"><div style="font-size:17px;font-weight:700;color:#24233b;line-height:1.7;">مرحبًا 🌸</div><div style="font-size:14px;color:#66647a;line-height:1.9;margin-top:3px;">${intro}</div><div style="font-size:25px;font-weight:800;color:#5d4bb6;line-height:1.5;margin-top:13px;">🔔 ${escapeHtml(title)}</div><div style="font-size:14px;color:#66647a;line-height:1.9;margin-top:5px;">وفقًا للمعلومات التي سجلتها، نتوقع أن تبدأ دورتك القادمة في:</div></td></tr>
<tr><td style="padding:14px 28px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf8ff;border:1px solid #ddd4f7;border-radius:15px;"><tr><td width="34%" align="center" style="padding:20px 10px;border-left:1px solid #ddd4f7;"><div style="width:70px;height:70px;line-height:70px;border-radius:50%;background:#eee8ff;color:#5d4bb6;font-size:34px;margin:auto;">📅</div></td><td align="right" style="padding:20px 18px;"><div style="font-size:15px;font-weight:700;color:#24233b;margin-bottom:7px;">تاريخ الدورة القادمة</div><div style="font-size:23px;font-weight:800;color:#5d4bb6;line-height:1.5;">${nextStartAr}</div><div style="font-size:13px;color:#77728e;margin-top:5px;">قبل ${days} أيام من الموعد المتوقع: <strong style="color:#c44b83;">${reminderAr}</strong></div></td></tr></table></td></tr>
<tr><td style="padding:10px 28px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf8ff;border:1px solid #ddd4f7;border-radius:15px;"><tr><td style="padding:17px;text-align:center;"><div style="font-size:15px;font-weight:700;color:#24233b;">فترة دورتك المعتادة</div><div style="font-size:15px;color:#77728e;margin-top:5px;">كل ${cycle} يوم تقريبًا</div><div style="font-size:12px;color:#9a96aa;margin-top:4px;">الفترة المتوقعة: ${nextStartAr} — ${endAr}</div></td></tr></table></td></tr>
<tr><td style="padding:18px 28px 26px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef7ff;border:1px solid #c9e2fb;border-radius:14px;"><tr><td style="padding:15px 17px;text-align:center;"><div style="font-size:14px;font-weight:700;color:#34577a;">💙 نحن نهتم بصحتك وراحتك</div><div style="font-size:12px;line-height:1.8;color:#54708b;margin-top:4px;">إذا كان هناك أي تغيير في دورتك، يمكنك تحديث المعلومات في أي وقت.</div></td></tr></table></td></tr>
<tr><td style="padding:22px 28px;background:#f6f2ff;border-top:1px solid #e4ddf3;text-align:center;"><div style="font-size:17px;font-weight:800;color:#5d4bb6;">Cycle Planner</div><div style="font-size:18px;color:#9a83d7;margin:5px 0;">──── ♡ ────</div><div style="font-size:12px;line-height:1.8;color:#8b8799;">هذه رسالة تلقائية، يرجى عدم الرد عليها.</div><div style="font-size:11px;color:#aaa6b4;margin-top:4px;">© ${new Date().getFullYear()} Cycle Planner. جميع الحقوق محفوظة.</div></td></tr>
</table></td></tr></table></body></html>`;
}

async function sendBrevoEmail({ apiKey, fromEmail, fromName, toEmail, subject, htmlContent }) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST", headers: { accept: "application/json", "api-key": apiKey, "content-type": "application/json" },
    body: JSON.stringify({ sender: { email: fromEmail, name: fromName }, to: [{ email: toEmail }], subject, htmlContent })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || data?.code || "Brevo email provider error");
  return data;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const body = req.body || {};
  const normalizedEmail = String(body.email || "").trim().toLowerCase();
  if (!normalizedEmail) return res.status(400).json({ ok: false, error: "email is required" });
  if (!validEmail(normalizedEmail)) return res.status(400).json({ ok: false, error: "صيغة البريد الإلكتروني غير صحيحة" });

  const apiKey = process.env.BREVO_API_KEY;
  const from = String(process.env.MAIL_FROM || "").trim();
  const fromName = process.env.MAIL_FROM_NAME || "Cycle Planner";
  if (!apiKey) return res.status(500).json({ ok: false, error: "BREVO_API_KEY is missing" });
  if (!from) return res.status(500).json({ ok: false, error: "MAIL_FROM is missing" });

  try {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: body.timezone || "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const startDate = String(body.startDate || today);
    const cycleLength = Math.max(1, Number(body.cycleLength || 28));
    const reminderDays = Math.max(0, Number(body.reminderDays || 3));
    const durationDays = Math.max(1, Number(body.durationDays || 5));
    const nextStart = nextOccurrence(startDate, cycleLength, today);
    const reminderDate = addDaysUTC(nextStart, -reminderDays);
    const endDate = addDaysUTC(nextStart, durationDays - 1);

    const result = await sendBrevoEmail({
      apiKey, fromEmail: from, fromName, toEmail: normalizedEmail,
      subject: "Cycle Planner — معاينة البريد الاحترافي 🔔",
      htmlContent: reminderEmailHtml({ nextStart, reminderDate, endDate, cycleLength, reminderDays, isTest: true })
    });
    return res.status(200).json({ ok: true, id: result?.messageId || null });
  } catch (error) {
    return res.status(502).json({ ok: false, error: error.message || "Email provider error" });
  }
}
