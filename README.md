# Cycle Planner — Notifications + Email

## 1) قاعدة البيانات
افتح Supabase SQL Editor وشغّل محتوى `supabase.sql`.

## 2) البريد
أنشئ حساب Resend، وثبّت/وثّق الدومين الذي سترسل منه، ثم ضع:
- `RESEND_API_KEY`
- `MAIL_FROM`

في Vercel Environment Variables.

## 3) مفاتيح Supabase
ضع:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

ولا تضع Service Role Key داخل `index.html`.

## 4) Cron
`vercel.json` يشغل `/api/cron` يوميًا الساعة 08:00 UTC.
الـ API يستخدم الـ timezone الذي يرسله المتصفح لكل مستخدم، ويحسب تاريخ التذكير بناءً عليه.

## 5) ربط الموقع بالـ API
بعد نشر المشروع على Vercel، افتح Console مرة واحدة:
```js
localStorage.setItem("CYCLE_API_BASE", "https://YOUR-DOMAIN.vercel.app")
```
ثم من الموقع اضغط:
**حفظ البريد للتذكير**.

## 6) اختبار البريد
اكتب بريدك واضغط:
**إرسال رسالة اختبار**.
إذا وصلت الرسالة، إعداد Resend صحيح.

## 7) إشعار المتصفح
اضغط **تفعيل الإشعارات** واسمح للمتصفح.
ملاحظة: إشعارات الويب لا يمكن الاعتماد عليها وحدها إذا الصفحة مغلقة؛ لذلك البريد عبر Cron هو قناة التذكير الموثوقة في هذه النسخة.

## ملاحظة
الحساب مبني على طول دورة ثابت أدخله المستخدم. النتائج تقديرية وتنظيمية وليست تشخيصًا طبيًا.
