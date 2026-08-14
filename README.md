# Cycle Planner — Notifications + Email

هذه النسخة تستخدم: **Vercel Serverless Functions + Supabase + Resend + Vercel Cron**.

## 1) قاعدة البيانات
افتح Supabase SQL Editor وشغّل `supabase.sql`.

## 2) متغيرات Vercel
أضف في Project Settings → Environment Variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `MAIL_FROM`
- `CRON_SECRET`

لا تضع `SUPABASE_SERVICE_ROLE_KEY` أو `RESEND_API_KEY` داخل `index.html`.

## 3) Resend
وثّق Domain الإرسال داخل Resend ثم استخدم عنوانًا من نفس الـ Domain في `MAIL_FROM`، مثل:

`Cycle Planner <reminder@example.com>`

## 4) ربط الواجهة
إذا كانت الواجهة والـ API منشورين معًا على Vercel، لا تحتاج إلى ضبط `CYCLE_API_BASE`؛ التطبيق يستخدم نفس الـ origin تلقائيًا.

إذا كانت الواجهة على استضافة مختلفة، نفّذ مرة واحدة في Console:

```js
localStorage.setItem("CYCLE_API_BASE", "https://YOUR-DOMAIN.vercel.app")
```

## 5) اختبار البريد
اكتب بريدك واضغط **إرسال رسالة اختبار**.

إذا وصلت الرسالة، فـ Resend و`MAIL_FROM` يعملان.

## 6) اختبار الحفظ
اضغط **حفظ وحساب المواعيد** أو **حفظ البريد للتذكير**.
سيتم حفظ الإعدادات في Supabase مع الـ timezone المحلي للمتصفح.

## 7) Cron
Vercel يشغّل `/api/cron` يوميًا الساعة 08:00 UTC.
الـ Cron يحسب التاريخ المحلي لكل مستخدم حسب الـ timezone المحفوظ.

تم تعديل منطق حساب الموعد بحيث إذا كان اليوم نفسه موعد الدورة لا يتم القفز مباشرة إلى الدورة التالية. كما أن النظام لا يفقد التذكير إذا تأخر تشغيل Cron؛ طالما أن تاريخ التذكير وصل ولم يُرسل لنفس الدورة، سيتم إرساله في أول تشغيل لاحق.

## 8) منع التكرار
يتم تخزين `last_reminder_key` لكل سجل، ولا يتم إرسال نفس التذكير مرة أخرى بعد نجاحه.

## 9) إشعارات المتصفح
إشعارات المتصفح تحتاج إذن المستخدم، ولا يمكن الاعتماد عليها وحدها إذا الصفحة مغلقة. البريد من Cron هو قناة التذكير الخلفية.

## ملاحظة
الحساب مبني على طول دورة ثابت يدخله المستخدم. النتائج تقديرية وتنظيمية وليست تشخيصًا طبيًا.
