# Astrobook Admin

Standalone admin console for Astrobook — manage users, verify astrologers, moderate posts.

## Stack
- Vite + React 19 + TypeScript
- Tailwind CSS v4
- React Router

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:
- `VITE_API_BASE_URL` — Astrobook server URL with `/api/v1` prefix (e.g. `http://localhost:3000/api/v1` for local dev)
- `VITE_IMAGEKIT_PUBLIC_KEY` / `VITE_IMAGEKIT_URL_ENDPOINT` — same values as the server's `IMAGEKIT_PUBLIC_KEY` / `IMAGEKIT_URL_ENDPOINT` (safe to expose client-side; only the private key stays on the server)

```bash
npm run dev      # local dev, http://localhost:5173
npm run build    # production build → dist/
```

## Login — email + password

Admin login is separate from the app's phone-OTP flow. It's plain email + password, checked against a `passwordHash` column that only admin accounts have.

**There is no self-serve signup.** To create your first admin (or any admin), run this from the `server` folder:

```bash
cd ../server
npx tsx src/scripts/create-admin.ts admin@astrobook.com "YourStrongPassword123!" "Your Name"
```

Running it again for the same email updates the password (and promotes the account to admin if it wasn't already). Password must be at least 8 characters.

## Server-side changes this depends on

This panel talks to a new `/admin/*` module added to the `server` project, plus one new auth route:
- `POST /auth/admin-login` — email + password login for admins
- `GET /admin/stats`
- `GET/PATCH /admin/users`, `/admin/users/:id/ban`, `/admin/users/:id/role`, `DELETE /admin/users/:id`
- `GET /admin/astrologers`, `/admin/astrologers/:id`, `PATCH .../documents`, `PATCH .../verification`
- `GET /admin/posts`, `DELETE /admin/posts/:id`
- `GET /admin/upload-token` — ImageKit signed token for document uploads

Run the new migrations on the server before using this panel:
```bash
cd ../server
npm run db:migrate
```
These migrations add: astrologer verification fields + document URLs, `isBanned`/`banReason` on users, and `passwordHash` for admin login. They also backfill an `astrologer_profiles` row for any existing astrologer that doesn't have one yet (older ones created before this change didn't get a profile row).

## Deploying

Same shape as any static Vite app — `npm run build` then serve `dist/` behind Nginx (or Vercel/Netlify) on its own subdomain, e.g. `admin.yourdomain.com`. Make sure the server's `CORS_ORIGIN` includes this panel's domain.
