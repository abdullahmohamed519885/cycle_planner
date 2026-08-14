import { Resend } from "resend";

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!apiKey) return res.status(500).json({ ok: false, error: "RESEND_API_KEY is missing" });
  if (!from) return res.status(500).json({ ok: false, error: "MAIL_FROM is missing" });

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to: [normalizedEmail],
      subject: "Cycle Planner — رسالة اختبار",
      html: `
        <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8;max-width:620px;margin:auto">
          <h2>تم تشغيل البريد بنجاح ✅</h2>
          <p>هذه رسالة اختبار من Cycle Planner.</p>
          <p>إذا وصلت إليك، فإن اتصال الموقع بخدمة البريد يعمل ويمكن إرسال التذكيرات تلقائيًا.</p>
        </div>
      `
    });

    if (result.error) {
      return res.status(502).json({ ok: false, error: result.error.message || "Email provider error" });
    }

    return res.status(200).json({ ok: true, id: result.data?.id || null });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || "Email error" });
  }
}
