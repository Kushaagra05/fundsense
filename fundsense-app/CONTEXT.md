# FundSense — Project Context

## What This Is
AI-powered mutual fund analyzer for Indian investors built 
with Next.js 14, Tailwind CSS, TypeScript.

## Tech Stack
- Frontend: Next.js 14 (App Router), Tailwind CSS, TypeScript
- Data: mfapi.in (free Indian mutual fund API, no key needed)
- Hosting: Vercel (not deployed yet)
- Auth: Supabase (email/password + Google OAuth)
- AI: Claude API / OpenAI API (not added yet)

## Pages Built — ALL COMPLETE ✅
- / (home) → Live fund search with dropdown, animated placeholder, stats bar, and live market ticker (Nifty and Sensex) via server API
- /fund/[code] → Fund detail with NAV, 1M/6M/1Y/3Y returns, risk badge
- /compare → Side by side fund comparison with winner highlights and verdict
- /sip → Calculators (SIP + Tax) with personal tax tips and SIP fund search to auto-fill 3Y CAGR returns (falls back to 1Y, supports negative returns, warns on Regular/IDCW, rounds slider value, syncs slider via ref, shows capped-CAGR notice)
- /quiz → Risk profiler quiz with 7 questions, progress indicator, and Hinglish investor profile result
- /quiz → Personalized fund recommendation card + top funds based on risk profile search (Direct Growth, shows NAV); fallbacks only on network failure; fund links open in a new tab
- /portfolio → Portfolio tracker with Simple Mode (amount+date only) 
  and Advanced Mode (units+NAV). Auto fetches historical NAV in Simple Mode.

## Key Features Already Built
- Fund variant badges in search (Direct/Regular/Growth/IDCW)
- Simple Mode portfolio entry — user enters amount + date only, 
  app auto-calculates units from historical NAV
- Live NAV fetching for all portfolio holdings
- Fund detail AI chat widget (FundChatWidget) below Fund Information
- Fund chat widget component for fund Q&A
- Fund chat API route (OpenAI) now returns 4-5 Hinglish bullets covering nature, risk, returns context, suitable investor, and a Bottom line verdict; acknowledges red flags honestly
- Portfolio holdings include a "Should I Exit?" AI verdict per fund
- Watchlist feature: add/remove from fund detail page; uses Supabase `watchlist` table for logged-in users and `localStorage` fallback for guests
- Portfolio page includes a Watchlist section with live NAV, 1Y return, 3Y CAGR, `View Fund` link, remove action, and loading skeletons
- Fund detail, portfolio holdings, and home suggestion chips use skeleton loaders during data fetches
- App layout includes SEO-friendly metadata (title, description, keywords, Open Graph)
- Fund detail pages generate dynamic metadata with fund name and current NAV
- Added a reusable Tooltip component for glossary hints across fund and portfolio pages
- Home page includes a "Why FundSense is Different" section with six feature cards under the search area
 - Home page includes a live market ticker (Yahoo Finance via /api/market-data for Nifty and Sensex), animated search placeholder, and quick stats bar above suggestions
- Home feature cards are clickable and link to fund detail, portfolio, quiz, and SIP pages
- Home feature cards now deep-link to section anchors like fund AI chat, red flags, health score, and holdings
- Fund detail and portfolio pages now auto-scroll to hash targets on load using `window.location.hash` and a delayed `scrollIntoView` for `#ai-chat`, `#red-flag`, `#health-score`, and `#holdings`
 - Fund detail now includes a `Share` button next to the watchlist button. On mobile it uses the native `navigator.share` sheet; on desktop it copies the current fund URL to clipboard and shows a small toast "Link copied!" for 2 seconds.
 - App now includes a site `Footer` component with logo/tagline, navigation links (Compare, Calculators, Risk Quiz, Portfolio, Auth), attribution (Built for Indian investors 🇮🇳, Data from MFAPI.in), and the legal line `© 2026 FundSense. Not a SEBI registered advisor.` The `Footer` is responsive and stacks on mobile.
 - App now includes a site `Footer` component with logo/tagline, navigation links (Compare, Calculators, Risk Quiz, Portfolio, Auth), attribution (Built for Indian investors 🇮🇳, Data from MFAPI.in), and the legal line `© 2026 FundSense. Not a SEBI registered advisor.` The `Footer` is responsive and stacks on mobile.
 - Added custom 404 page at `src/app/not-found.tsx` with a large indigo gradient "404", heading "Page not found", friendly message, and a "Go to Home" button. Keeps the dark `bg-slate-900` theme and centered layout.
 - Auth page now includes a Google OAuth button with callback route at `/auth/callback` that redirects signed-in users to `/portfolio`.

## Important Rules
- Always use "use client" for interactive components
- Dark navy theme: bg-slate-900
- Fund API: https://api.mfapi.in/mf
- All pages except home must set document.body.style.overflow = 'auto' on mount
- Home page uses useEffect to set body overflow hidden/auto based on dropdown
- Never touch globals.css overflow properties
- Use onMouseDown instead of onClick for dropdown items to prevent 
  click outside handler from firing first
- Use separate refs for each search wrapper when multiple exist on same page
- Shared layout rule: use `src/components/Navbar.tsx` on app pages; avoid hardcoded per-page `<nav>` blocks and `body > nav { display: none }` overrides.

- Compare verdict priority: decide winner by this order — 1) If one fund's 1Y is positive and the other's is negative, the positive 1Y fund wins; 2) If both 1Y are same-sign, compare 3Y CAGR (higher wins); 3) If 3Y is tied or unavailable, compare 1M return (higher wins). Show fund name in verdict.

## Deployment Notes (Vercel)
- CLI: npm i -g vercel, then vercel login
- Link project from fundsense-app/ root with vercel
- Prod deploy: vercel --prod
- Required env vars on Vercel: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, OPENAI_API_KEY
- Production URL: https://fundsense-app.vercel.app

## What Needs to Be Done Next
1. Supabase auth (signup/login/logout)
2. Save portfolio to Supabase instead of localStorage
3. Claude/OpenAI API for AI explanations on fund pages
4. Fund Report Card (A-F grading)
5. Deploy to Vercel
6. Connect Namecheap domain
7. Stripe payments for premium features