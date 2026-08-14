# Cycle Planner

## Email provider
This version uses **Brevo Transactional Email API** instead of Resend. It does not require buying a domain to start: you can register and verify a sender email address that you own in Brevo. Domain authentication is recommended for production deliverability, but is not required just to verify a single sender address.

### Vercel Environment Variables
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BREVO_API_KEY`
- `MAIL_FROM` — the exact sender email you verified in Brevo
- `MAIL_FROM_NAME` — e.g. `Cycle Planner`
- `CRON_SECRET`
- `CYCLE_API_BASE` is optional when frontend and API are deployed together.

### Important
Do not put API keys in frontend JavaScript or commit them to GitHub. Keep them in Vercel Environment Variables.

### Test email
The app calls `/api/test-email`. The server sends through Brevo's transactional endpoint. The recipient can be any valid address allowed by your Brevo account, while the `From` address must be the verified sender.

### Automatic reminders
`/api/cron` reads active reminders from Supabase, calculates the user's local date from the saved timezone, sends due reminders through Brevo, and records `last_reminder_key` to prevent duplicate sends.


### Save reminder fix
The save endpoint now normalizes `SUPABASE_URL`, uses the public schema explicitly, and performs a normal insert with an update fallback for an existing email instead of relying on the `on_conflict` query parameter.
