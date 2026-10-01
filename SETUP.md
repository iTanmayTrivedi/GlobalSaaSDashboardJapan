# Local Setup — Run Lynt on your own Supabase

This project ships with two backends:

- **Hosted preview** → uses its configured backend. Do not change its environment settings when configuring a local clone.
- **Your local Mac** → uses *your* personal Supabase project (`drzmcrrbpmsntartowjk`) via a local `.env` you create after cloning.

Because `.env` is gitignored, your local file never affects the hosted preview.

---

## 1. Clone & install

```bash
git clone <your-repo-url>
cd <repo>
npm install
```

## 2. Create your local `.env`

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_PROJECT_ID="drzmcrrbpmsntartowjk"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_CpmtmSJLoef0IH6UQ_7Aqw_8gJ3cjmu"
VITE_SUPABASE_URL="https://drzmcrrbpmsntartowjk.supabase.co"
```

## 3. Create the database schema

1. Open your Supabase dashboard → **SQL Editor** → **New query**
2. Paste the contents of [`supabase/global saas dashboard.sql`](./supabase/global%20saas%20dashboard.sql)
3. Run it. This creates all enums, tables, RLS policies, helper functions, and the `handle_new_user` trigger.

## 4. Configure Auth

In your Supabase dashboard → **Authentication**:

- **Providers → Email**: enable. For local dev you can also enable *Auto-confirm email* so you don't need to click the verification link.
- **Providers → Google** (optional): enable, paste your Google OAuth client ID & secret, and add `http://localhost:8080` + your prod URL to **URL Configuration → Redirect URLs**.
- **URL Configuration → Site URL**: `http://localhost:8080`

## 5. Deploy Edge Functions (for AI features)

The AI tools (chat, translate, keigo checker, etc.) run in 3 edge functions: `ai-chat`, `ai-tools`, `seed-demo-user`.

```bash
npm install -g supabase
supabase login
supabase link --project-ref drzmcrrbpmsntartowjk
supabase functions deploy ai-chat ai-tools seed-demo-user
```

The AI functions call Groq directly. Set your Groq API key as an Edge Function secret in your own Supabase project (never put it in the frontend `.env`):

```bash
supabase secrets set GROQ_API_KEY=<your-key>
```

## 6. Run it

```bash
npm run dev
```

Open http://localhost:8080. Sign up → it auto-creates a `profiles` row via the trigger → click **Create Organization** to bootstrap your tenant.

---

## What works without any of this

**Demo Mode** (mock auth) runs 100% client-side — no Supabase, no edge functions. Useful for showing recruiters the UI before the backend is wired up.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `permission denied for table organizations` | You skipped the GRANT statements in `global saas dashboard.sql`. Re-run the whole file. |
| Sign-up works but no profile created | The `on_auth_user_created` trigger didn't install. Re-run section *Triggers* of `global saas dashboard.sql`. |
| AI tools return 500 | `GROQ_API_KEY` secret not set, or edge functions not deployed. |
| Google login error `Unsupported provider` | Google provider not enabled in Supabase Auth → Providers. |
| `Invalid login credentials` immediately after signup | Email confirmation required — enable *Auto-confirm* or click the email link. |
