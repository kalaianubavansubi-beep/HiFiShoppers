# HiFiShoppers.shop – Audit & Repair Report

Project root: `HiFiShoppers-main/` inside the uploaded ZIP (single level; GitHub-style wrapper folder). Stack: React 18, Vite 6, React Router 6, Supabase JS 2, Vitest, npm. Source project (not a prebuilt site). No `node_modules`, nested ZIPs or secrets were included.

## Verified issues and fixes
| # | Issue | File(s) | Root cause | Fix | Verification |
|---|-------|---------|-----------|-----|--------------|
| 1 | **Build fails** | `src/main.jsx` | Imports `./index.css`, which did not exist in the ZIP (every class used by the UI was unstyled too). | Created `src/index.css` covering the classes in use, responsive. | Import-resolution script: all relative imports now resolve. 7 hook classes have no rule by design. **Real `vite build` not run (no network).** |
| 2 | **Admin authorization by email text** | `ProtectedRoute.jsx`, `AdminPage.jsx` | Anyone could type any email containing "admin"/"manager" into the "demo login" and get a fake admin session. | Removed demo login. Real Supabase `signInWithPassword` on new `/login`; role read from `profiles` table; `/admin` wrapped in `ProtectedRoute`. | Code review + syntax check. Needs live Supabase to test end-to-end. |
| 3 | **Fake admin dashboard** | `AdminPage.jsx` | Hard-coded "128 products / 86% / 42 orders" and bullet lists, no functionality. | Real dashboard: product create/edit/delete, price/stock/status, image upload, categories, order list + status updates. | Syntax check only; needs live Supabase. |
| 4 | **Fake guest user in demo mode** | `StoreContext.jsx` | Set `guest@hifishoppers.shop` as a logged-in user when Supabase was missing. | Removed; user is `null` unless Supabase authenticates. | Syntax check. |
| 5 | **Catalog never read from Supabase** | `StoreContext.jsx`, `demoData.js` | Always rendered demo data even when configured. | `api.fetchProducts/fetchCategories`; demo data only when env vars are absent; load errors are shown, not hidden. | Mapping logic unit-checked in Node. Live query untested. |
| 6 | **Checkout was a stub** | `CartPage.jsx` | "Place order" just cleared the cart; no order created; form `required` never fired (`type="button"`). | Real form submit → `place_order()` RPC, confirmation screen, stock refresh. | Syntax check; SQL not executed (no Postgres here). |
| 7 | **Out-of-stock items could be added, qty 0 rows** | `StoreContext.jsx` | `Math.min(qty, stock)` with stock 0. | Guard in `addToCart`; cart reconciled with live stock/price; +/- buttons disabled at limits. | Logic reviewed; totals unit-checked. |
| 8 | **Infinite-recursion RLS policy** | `001_initial_schema.sql` | `profiles` SELECT policy queries `profiles`. All policies that check admin role inherit the error. | `002`: `is_admin()` SECURITY DEFINER; all admin policies recreated with it. | **SQL not executed.** |
| 9 | **Privilege escalation** | `001` | Users could `update` their own profile row including `role`. | Column-level grant: only `full_name`, `avatar_url` updatable. | Not executed. |
| 10 | **Anyone could insert orders with arbitrary totals / customers couldn't add order_items** | `001` | Open INSERT policy on `orders`; no insert policy on `order_items`. | Removed open policy; `place_order()` (SECURITY DEFINER) prices server-side, locks rows, checks stock, writes items + inventory movements. | Not executed. |
| 11 | No profile row created for new auth users; categories not publicly readable; no storage bucket/policies | `001` | Missing triggers/policies. | `002`: `handle_new_user` trigger + back-fill, public categories read, `product-images` bucket (5 MB, image MIME types only) with admin-only write policies. | Not executed. |
| 12 | Dead controls | `HomePage`, `ProductPage`, `Layout` | Search box, "Buy now", header search/account buttons, category cards did nothing; newsletter button did nothing. | Search → `/products?q=`, category links/filter, Buy now → cart, header links. Newsletter replaced with an honest note (no mailing backend exists). | Syntax check. |
| 13 | Missing `engines`/Node pin | `package.json`, `netlify.toml` | Netlify default Node may not satisfy Vite 6. | `engines >=18.18`, `NODE_VERSION=20`, `.nvmrc`. Added security headers + asset caching. | Config review. |

Also checked and fine: SPA redirect (`/* → /index.html`, 200) and `publish = "dist"` match Vite's default output; `.env.example` is placeholders only and is not git-ignored; no `service_role` key or hard-coded secrets anywhere; no `dangerouslySetInnerHTML`; file/import casing consistent; ZIP excludes `node_modules`.

## Check results
**Passed (actually run):**
- All 19 JS/JSX files parse with no syntax errors (TypeScript parser).
- All relative imports resolve; all named/default imports match real exports.
- Utility logic (currency, slug, stock status, DB-row mapping, cart totals/shipping) asserted in Node.

**Could not run (sandbox has no network, so `npm install` timed out):**
- `npm install`, `npm run build`, `npm test` (vitest). Run them locally; expected to pass but **unverified**.
- No ESLint/type-check is configured in the project; none was added without being able to install/verify it.
- Migrations 001/002, RLS behaviour, `place_order()`, storage uploads, admin CRUD, auth flow: need a real Supabase project.
- Responsive layout was written but not visually inspected in a browser.
- `package-lock.json` could not be generated offline (the original ZIP had none). Netlify builds fine without it; run `npm install` and commit the lockfile for reproducible builds.

## Manual configuration still required
1. Supabase project; run `001` then `002`; create admin user(s); `update public.profiles set role='admin' ...`.
2. Netlify env vars `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; redeploy after setting.
3. Netlify custom domain + DNS for HiFiShoppers.shop; Supabase Auth Site URL / redirect URLs.
4. Decide on public email sign-ups in Supabase Auth.
5. Payments: checkout is Cash-on-Delivery only; no payment gateway is integrated.
6. Run `npm audit` after install and review (not possible offline).

## Behaviour changes to be aware of
- `002` drops and recreates policies (no data touched). The old open "insert order" policy is intentionally removed; orders must go through `place_order()`.
- Demo mode is now read-only: no admin login, no checkout.
- Product images are shown from `primary_image` / `image_urls`; the product page shows one image (thumbnail strip previously repeated the same image).

---
## Product photo update

- 51 supplied photos are in `public/images/products/<set>/` as WebP (max 1200 px, orientation fixed, not cropped or retouched). Three videos, a Google-search screenshot and one unrelated clip photo were not used.
- `src/lib/productPhotos.js` holds the 7 photo sets and a slug -> set assignment table. Only **Marshall Ember Mini -> Marshall Willen photos** is assigned (CONFIRM: the photos show the Willen model). The other six sets are ready but unassigned until each product is confirmed; to assign one add a line such as `'your-product-slug': 'c-watch-sport-band',`.
- Works for demo data and live Supabase products (matched by slug); names, prices, SKUs and stock are untouched. For Supabase you can alternatively upload via /admin.
- Product page now has a real gallery with thumbnails and alt text; cards use a consistent 3:4 frame with `object-fit: contain` (no cropping); admin product list shows a thumbnail; photo URLs revalidate daily via `netlify.toml`.
- Still using third-party stock photos: the five other demo products and the homepage hero (Unsplash). Not product photos you supplied; replace once assigned.
- Not verified: `npm run build`, vitest, visual check on mobile/desktop (no network/browser here).

---
## "Supabase is not configured" on /login

**Cause:** not a code bug. `src/lib/supabase.js` (the only `createClient` call) reads `import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, correct for Vite. Vite bakes these in at *build* time, so the message appears when either was empty during the Netlify build (variables not added, wrong site, scope without "Builds", typo, or added without a new deploy). Which of these applies to your site cannot be seen from the project files.

**Code changes:** `supabaseConfig.js` validates the public config (trims quotes/spaces, rejects placeholders, bad URLs, and service_role/sb_secret keys; accepts `VITE_SUPABASE_PUBLISHABLE_KEY` too); the login page lists the exact missing/invalid variable; sign-in errors are translated (wrong password, unconfirmed email, unreachable URL, wrong key); missing profile/role/tables are explained; `scripts/check-env.mjs` runs before every build and logs whether the variables are visible (never their values).

**Verified:** one `createClient` in the project; no service_role/secret in code; every column, RPC parameter and the `product-images` bucket used in `api.js` exists in the SQL migrations; config validation (8 assertions) and the check-env script (missing / strict / valid cases) executed in Node; all files parse; imports resolve.
**Not verified:** real Supabase connection, login, CRUD, upload, RLS (need your project); `npm run build` and vitest (no network here). The fix is only confirmed once your Netlify deploy log shows `[check-env] Supabase public config found` and /login shows no red box.
