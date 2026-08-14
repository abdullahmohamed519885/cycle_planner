function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendBrevoEmail({ apiKey, fromEmail, fromName, toEmail, subject, htmlContent }) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: { email: fromEmail, name: fromName },
      to: [{ email: toEmail }],
      subject,
      htmlContent
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || data?.code || "Brevo email provider error");
  }
  return data;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const { email } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return res.status(400).json({ ok: false, error: "email is required" });
  if (!validEmail(normalizedEmail)) return res.status(400).json({ ok: false, error: "صيغة البريد الإلكتروني غير صحيحة" });

  const apiKey = process.env.BREVO_API_KEY;
  const from = String(process.env.MAIL_FROM || "").trim();
  const fromName = process.env.MAIL_FROM_NAME || "Cycle Planner";
  if (!apiKey) return res.status(500).json({ ok: false, error: "BREVO_API_KEY is missing" });
  if (!from) return res.status(500).json({ ok: false, error: "MAIL_FROM is missing" });

  try {
    const result = await sendBrevoEmail({
      apiKey,
      fromEmail: from,
      fromName,
      toEmail: normalizedEmail,
      subject: "Cycle Planner — رسالة اختبار",
      htmlContent: `
        <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8;max-width:620px;margin:auto">
          <h2>تم تشغيل البريد بنجاح ✅</h2>
          <p>هذه رسالة اختبار من Cycle Planner.</p>
          <p>إذا وصلت إليك، فإن اتصال الموقع بخدمة البريد يعمل ويمكن إرسال التذكيرات تلقائيًا.</p>
        </div>
      `
    });

    return res.status(200).json({ ok: true, id: result?.messageId || null });
  } catch (error) {
    return res.status(502).json({ ok: false, error: error.message || "Email provider error" });
  }
}
