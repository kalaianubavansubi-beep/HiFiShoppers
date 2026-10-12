# HiFiShoppers.shop

Premium electronics storefront + admin panel. React 18 + Vite 6 + React Router 6 + Supabase (Postgres, Auth, Storage), hosted on Netlify.

Project root = the folder containing `package.json` (this folder). Package manager: **npm**.

## Local setup
```bash
npm install                # also creates package-lock.json on first run – commit it
cp .env.example .env       # then fill in the two public Supabase values
npm run dev                # http://localhost:5173
npm test                   # vitest
npm run build              # outputs ./dist
npm run preview            # serve the production build locally
```
Node 18.18+ (Node 20 recommended; see `.nvmrc`).

Without Supabase variables the site runs in **demo mode**: a read-only sample catalog is shown, admin sign-in and checkout are disabled (nothing is faked).

## Supabase setup (required for admin, orders, uploads)
1. Create a project. Copy *Project URL* and *anon public key* into `.env` (and Netlify, below). Never use the `service_role` key in this app.
2. SQL Editor → run, in order:
   1. `supabase/migrations/001_initial_schema.sql`
   2. `supabase/migrations/002_security_and_checkout.sql` (fixes RLS recursion / privilege escalation, adds `place_order()` checkout function, storage bucket + policies)
3. Authentication → Users → *Add user* (email + password) for each admin.
4. Promote the first admin (SQL Editor):
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
5. Add categories and products from `/admin` (or SQL). Products are only visible to customers when `status = 'published'`.
6. Authentication → Providers → Email: decide whether public sign-ups stay enabled. Sign-ups only create `customer` profiles; they cannot reach admin data.

## Netlify deployment
1. Import the Git repo (or drag-drop this folder's contents). Base directory: *(empty)*.
2. Build command `npm run build`, publish directory `dist` (already set in `netlify.toml`, along with the SPA redirect and Node 20).
3. Site configuration → Environment variables (scope must include **Builds**): `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (a `sb_publishable_…` key may be supplied as `VITE_SUPABASE_PUBLISHABLE_KEY` instead). Vite inlines them at build time, so after any change use **Deploys → Trigger deploy → Clear cache and deploy site**. The build log must show `[check-env] Supabase public config found`; set `REQUIRE_SUPABASE_ENV=true` to make a missing value fail the build. Step-by-step Tamil guide: `docs/SETUP_TAMIL.md`.
4. Domain management → add `HiFiShoppers.shop`; point DNS as Netlify instructs.
5. Supabase → Authentication → URL Configuration: set Site URL to `https://HiFiShoppers.shop`.

## How security works
- The browser only holds the public anon key. All protection is Row Level Security in Postgres: customers can read published products/categories; only users with `profiles.role in ('admin','manager')` can write products, categories, orders and storage objects.
- The UI route guard (`ProtectedRoute`) is a convenience; it is not the security boundary.
- Orders are created only by the `place_order()` database function, which recomputes prices, shipping and stock server-side.
