# Supabase Auth — Production Setup (Advora AI)

Configure these in the [Supabase Dashboard](https://supabase.com/dashboard) before launch.

## URL Configuration

**Authentication → URL Configuration**

| Setting | Value |
|---------|--------|
| **Site URL** | `https://useadvora.com` |
| **Redirect URLs** | Add all of the following |

```
https://useadvora.com/auth/callback
https://useadvora.com/auth/callback?next=*
https://useadvora.com/reset-password
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback?next=*
http://localhost:3000/reset-password
```

Never set Site URL to `localhost` in production.

## Environment variables (Netlify / hosting)

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=https://useadvora.com
```

## Email provider

Supabase built-in email is rate-limited (~4/hour on free tier). For production:

1. **Authentication → Email → SMTP Settings**
2. Configure custom SMTP (Resend, SendGrid, AWS SES, etc.)
3. Set sender: `Advora AI <support@useadvora.com>`

## Email templates

### Magic Link / OTP (`Authentication → Email Templates → Magic Link`)

For **6-digit OTP login**, the template body must include:

```html
<p>Your Advora AI login code is:</p>
<h2>{{ .Token }}</h2>
<p>This code expires in a few minutes.</p>
```

Do not rely on `{{ .ConfirmationURL }}` alone for OTP login.

### Reset Password (`Authentication → Email Templates → Reset Password`)

Ensure the reset link uses Supabase's confirmation URL (PKCE). Users land on:

`https://useadvora.com/auth/callback?next=/reset-password`

Then redirect to `/reset-password` to set a new password.

### Confirm signup

Verification links should use:

`https://useadvora.com/auth/callback?next=/dashboard`

## Auth providers

- **Email** — enabled
- **Confirm email** — enabled (required for OTP login eligibility)
- **Secure email change** — recommended

## Database

Apply migration `supabase/migrations/20250706_otp_login_eligibility.sql` so the
`email_login_eligibility` RPC exists for OTP login.

## Debugging

All auth API routes emit structured JSON logs:

```json
{"scope":"auth","action":"otp_send","level":"info","message":"...","email":"...","ts":"..."}
```

Search server logs for `"scope":"auth"` to trace OTP, password reset, signup, and callback flows.
