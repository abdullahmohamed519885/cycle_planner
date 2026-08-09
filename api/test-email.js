import { Resend } from "resend";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "email is required" });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.MAIL_FROM;
    if (!from) return res.status(500).json({ error: "MAIL_FROM is missing" });

    const result = await resend.emails.send({
      from,
      to: [email],
      subject: "Cycle Planner — رسالة اختبار",
      html: `
        <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8">
          <h2>تم تشغيل البريد بنجاح ✅</h2>
          <p>هذه رسالة اختبار من Cycle Planner.</p>
          <p>إذا وصلت إليك، فإعداد Resend يعمل ويمكننا إرسال التذكيرات تلقائيًا.</p>
        </div>
      `
    });

    if (result.error) {
      return res.status(500).json({ error: result.error.message || "Email provider error" });
    }

    return res.status(200).json({ ok: true, id: result.data?.id || null });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Email error" });
  }
}
