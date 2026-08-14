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
      subject: "Cycle Planner — تم تفعيل البريد بنجاح ✅",
      htmlContent: `
        <div dir="rtl" style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#172033">
          <div style="display:none;max-height:0;overflow:hidden;opacity:0">تم تفعيل البريد الإلكتروني في Cycle Planner بنجاح.</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f7fb">
            <tr><td align="center" style="padding:32px 16px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(23,32,51,.08)">
                <tr><td style="background:#111827;padding:28px 32px;text-align:right">
                  <div style="font-size:22px;font-weight:700;color:#ffffff">Cycle Planner</div>
                  <div style="font-size:13px;color:#cbd5e1;margin-top:6px">اختبار خدمة البريد الإلكتروني</div>
                </td></tr>
                <tr><td style="padding:34px 32px;text-align:right">
                  <div style="font-size:36px;line-height:1;margin-bottom:18px">✅</div>
                  <h1 style="margin:0 0 12px;font-size:26px;line-height:1.4;color:#111827">تم تفعيل البريد بنجاح</h1>
                  <p style="margin:0;font-size:15px;line-height:1.9;color:#475569">هذه رسالة اختبار للتأكد من أن Cycle Planner يستطيع إرسال رسائل البريد الإلكتروني بشكل صحيح.</p>
                  <div style="margin-top:24px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:15px 16px;color:#166534;font-size:14px;line-height:1.8">✓ الاتصال بخدمة البريد يعمل ويمكن استخدامه لإرسال التذكيرات التلقائية.</div>
                </td></tr>
                <tr><td style="padding:18px 32px;background:#f8fafc;border-top:1px solid #eef2f7;text-align:center">
                  <div style="font-size:12px;color:#94a3b8">© ${new Date().getFullYear()} Cycle Planner</div>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </div>
      `
    });

    return res.status(200).json({ ok: true, id: result?.messageId || null });
  } catch (error) {
    return res.status(502).json({ ok: false, error: error.message || "Email provider error" });
  }
}
