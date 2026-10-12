# HiFiShoppers – Supabase & Netlify அமைப்பு (எளிய தமிழில்)

## பிரச்சனை என்ன?
Admin login பக்கத்தில் **"Supabase is not configured"** என்று வருகிறது என்றால், website *build* ஆன நேரத்தில் இந்த 2 மதிப்புகள் இல்லை என்று அர்த்தம்:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

இவை Netlify-யில் சேர்க்கப்படவில்லை, அல்லது சேர்த்த பிறகு **மீண்டும் deploy செய்யவில்லை**, அல்லது தவறான site-ல் சேர்த்திருக்கலாம். Code-ல் பெயர்கள் சரியாகவே உள்ளன (Vite project என்பதால் `VITE_` என்று தொடங்க வேண்டும்).

> முக்கியம்: Vite, இந்த மதிப்புகளை **build நேரத்தில்** மட்டுமே website-க்குள் வைக்கும். Netlify-யில் மாற்றிய பிறகு புதிய deploy செய்யாவிட்டால் பழைய (காலி) மதிப்புதான் இருக்கும்.

---

## பகுதி 1 – Supabase-ல் இருந்து 2 மதிப்புகளை எடுக்கவும்
1. https://supabase.com/dashboard திறந்து, **உங்கள் HiFiShoppers project**-ஐ தேர்ந்தெடுக்கவும்.
2. இடது பக்கம் கீழே **Project Settings** (⚙️) → **API** (அல்லது **API Keys**) செல்லவும். மேலே உள்ள **Connect** பொத்தானிலும் இவை கிடைக்கும்.
3. **Project URL** – `https://xxxxxxxx.supabase.co` போன்று இருக்கும். இதை copy செய்யவும். (முடிவில் `/rest/v1` சேர்க்க வேண்டாம்.)
4. **Public key** – இவற்றில் ஒன்றை copy செய்யவும்:
   - **Publishable key** (`sb_publishable_...` என்று தொடங்கும்), அல்லது
   - **anon public key** (`eyJ...` என்று தொடங்கும் நீண்ட key; "Legacy API keys" tab-ல் இருக்கும்)
5. ❌ **`service_role` key அல்லது `Secret key` (`sb_secret_...`) ஐ ஒருபோதும் பயன்படுத்த வேண்டாம்.** அது முழு database-ஐயும் திறந்துவிடும். இந்த project அப்படிப்பட்ட key-ஐ தானாகவே நிராகரிக்கும்.

## பகுதி 2 – Supabase database அமைப்பு (ஒரே ஒரு முறை)
1. **SQL Editor** → New query.
2. `supabase/migrations/001_initial_schema.sql` முழுவதையும் paste செய்து **Run**.
3. புதிய query-ல் `supabase/migrations/002_security_and_checkout.sql` paste செய்து **Run**. (இது security, checkout, image storage bucket ஆகியவற்றை சரி செய்யும்.)
4. **Authentication → Users → Add user → Create new user**: உங்கள் admin email + password கொடுத்து, **Auto Confirm User** டிக் செய்யவும்.
5. SQL Editor-ல் இதை Run செய்யவும் (உங்கள் email போடவும்):
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
6. **Authentication → URL Configuration → Site URL** = `https://HiFiShoppers.shop`.
7. **Storage** பகுதியில் `product-images` bucket தானாக உருவாகியிருக்கும் (002 அதை உருவாக்கும்).

## பகுதி 3 – Netlify-ல் சரியான site-ல் மதிப்புகளை சேர்க்கவும்
1. https://app.netlify.com → **HiFiShoppers.shop-ஐ இயக்கும் site**-ஐ திறக்கவும் (பல site இருந்தால் domain சரியானதா என்று பார்க்கவும்).
2. **Site configuration → Environment variables** (அல்லது Project configuration) செல்லவும்.
3. **Add a variable → Add a single variable**:
   - Key: `VITE_SUPABASE_URL` → Value: Project URL
   - Scopes: **எல்லாம்** (குறைந்தது **Builds** இருக்க வேண்டும்)
4. மீண்டும் **Add a variable**:
   - Key: `VITE_SUPABASE_ANON_KEY` → Value: anon அல்லது publishable key
   - Scopes: **Builds** உட்பட
5. பெயர்கள் எழுத்துப்பிழை இல்லாமல், பெரிய எழுத்தில், முன்/பின் space இல்லாமல், மேற்கோள் குறி (" ") இல்லாமல் இருக்க வேண்டும்.
6. **Deploys → Trigger deploy → Clear cache and deploy site** அழுத்தவும். (மிக முக்கியம் – இது இல்லாமல் மாற்றம் தெரியாது.)
7. Deploy log-ல் இந்த வரி வர வேண்டும்:
   `[check-env] Supabase public config found (URL set, key set).`
   இல்லாமல் `WARNING – Supabase will be DISABLED` வந்தால், மதிப்புகள் இன்னும் build-க்கு கிடைக்கவில்லை.
8. (விருப்பம்) Netlify-யில் `REQUIRE_SUPABASE_ENV` = `true` சேர்த்தால், மதிப்புகள் இல்லாத build தோல்வி அடையும் – அமைதியான உடைந்த deploy வராது.

## பகுதி 4 – சோதனை
1. `https://HiFiShoppers.shop/login` திறக்கவும் – சிவப்பு எச்சரிக்கை இல்லாமல் form தெரிய வேண்டும்.
2. Admin email/password கொடுத்து Sign in. `/admin` திறக்க வேண்டும்.
3. ஒரு product சேர்க்கவும் (status = Published), படம் upload செய்யவும் – முகப்புப் பக்கத்தில் தெரிய வேண்டும்.

## பிழை செய்திகள்
| செய்தி | அர்த்தம் / தீர்வு |
|---|---|
| Wrong email or password | Authentication → Users-ல் user இருக்கிறாரா, password சரியா என்று பார்க்கவும் |
| email not confirmed | User-ஐ confirm செய்யவும் (Auto Confirm) |
| Cannot reach Supabase | URL தவறு அல்லது Supabase project pause ஆகியிருக்கலாம் |
| Supabase rejected the API key | Key வேறு project-ஐச் சேர்ந்தது; அதே project-ல் மீண்டும் copy செய்யவும் |
| no admin role | பகுதி 2, படி 5 (role = admin) செய்யவும் |
| Database tables are missing | பகுதி 2, படி 2–3 செய்யவும் |

உள்ளூரில் சோதிக்க: `.env.example` ஐ `.env` ஆக copy செய்து மதிப்புகளை நிரப்பி `npm run dev` இயக்கவும். `.env` ஐ Git-ல் சேர்க்க வேண்டாம்.
