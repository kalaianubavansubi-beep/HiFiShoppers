# HiFiShoppers.shop

HiFiShoppers.shop is a premium electronics storefront and admin platform built with React + Vite and Supabase.

## Stack
- Frontend: React + Vite + React Router
- Styling: CSS variables and responsive layouts
- Backend: Supabase Postgres + Auth + Storage
- Hosting: Netlify
- Data source: Supabase database and storage, with demo fallback data

## Requirements
- Node.js 18+ and npm
- Supabase project
- Netlify account

## Local setup
1. Install dependencies:
   npm install
2. Copy environment variables:
   cp .env.example .env
3. Fill in Supabase credentials from your project dashboard.
4. Run the app:
   npm run dev

## Production build
npm run build

## Supabase setup
1. Create a new Supabase project.
2. Apply the migration in `supabase/migrations/001_initial_schema.sql`.
3. Create a public storage bucket named `product-images`.
4. Create auth users for admin accounts via Supabase Auth.
5. Set Row Level Security (RLS) policies with authorized admin roles.

## Admin access
- The storefront enforces admin access through Supabase auth rules.
- Use Supabase Auth and an admin profile row to authorize only approved staff.
- Never expose the Supabase service role key in browser code.

## Deployment
1. Import this repo into Netlify.
2. Set environment variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Configure DNS for HiFiShoppers.shop to Netlify.

## Demo behavior
If Supabase credentials are not configured, the app loads a local demo catalog so the storefront can still render for local UI development. Real product management and secure admin access require a configured Supabase project.

## Database SQL
The reusable migrations are in:
- `supabase/migrations/001_initial_schema.sql`
