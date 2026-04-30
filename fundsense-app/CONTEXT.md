# FundSense — Project Context

## What This Is
AI-powered mutual fund analyzer for Indian investors built 
with Next.js 14, Tailwind CSS, TypeScript.

## Tech Stack
- Frontend: Next.js 14 (App Router), Tailwind CSS, TypeScript
- Data: mfapi.in (free Indian mutual fund API, no key needed)
- Hosting: Vercel (not deployed yet)
- Auth: Supabase (not added yet)
- AI: Claude API / OpenAI API (not added yet)

## Pages Built — ALL COMPLETE ✅
- / (home) → Live fund search with dropdown
- /fund/[code] → Fund detail with NAV, 1M/6M/1Y/3Y returns, risk badge
- /compare → Side by side fund comparison with winner highlights and verdict
- /sip → SIP Calculator with live sliders and year breakdown table
- /quiz → Risk profiler quiz with 5 questions and investor profile result
- /portfolio → Portfolio tracker with Simple Mode (amount+date only) 
  and Advanced Mode (units+NAV). Auto fetches historical NAV in Simple Mode.

## Key Features Already Built
- Fund variant badges in search (Direct/Regular/Growth/IDCW)
- Simple Mode portfolio entry — user enters amount + date only, 
  app auto-calculates units from historical NAV
- Live NAV fetching for all portfolio holdings
- Fund detail AI chat widget (FundChatWidget) below Fund Information
- Fund chat widget component for fund Q&A
- Fund chat API route (OpenAI) with short Hinglish answers and a clear verdict

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

## What Needs to Be Done Next
1. Supabase auth (signup/login/logout)
2. Save portfolio to Supabase instead of localStorage
3. Claude/OpenAI API for AI explanations on fund pages
4. Red Flag Detector on fund detail page
5. Fund Report Card (A-F grading)
6. Deploy to Vercel
7. Connect Namecheap domain
8. Stripe payments for premium features