# FundSense — Project Context

## What This Is
AI-powered mutual fund analyzer for Indian investors built 
with Next.js 14, Tailwind CSS, TypeScript.

## Tech Stack
- Frontend: Next.js 14 (App Router), Tailwind CSS, TypeScript
- Data: mfapi.in (free Indian mutual fund API, no key needed)
- Hosting: Vercel (not deployed yet)
- Auth: Supabase (not added yet)
- AI: Claude API (not added yet)

## Pages Built So Far
- / (home) → Live fund search with dropdown
- /fund/[code] → Fund detail with NAV, returns, risk badge
- /compare → Side by side fund comparison with verdict
- /sip → SIP Calculator (not migrated yet)
- /quiz → Risk profiler quiz (not migrated yet)
- /portfolio → Portfolio tracker (not migrated yet)

## Current Issue
Scrollbar not working correctly across pages — need 
document.body.style.overflow managed per page

## Important Rules
- Always use "use client" for interactive components
- Dark navy theme: bg-slate-900
- Fund API: https://api.mfapi.in/mf
- All pages must set document.body.style.overflow = 'auto' 
  on mount except home page which sets it to 'hidden'
- Never touch globals.css overflow properties
- Reference old HTML files in /Project folder for logic

## What Needs to Be Done Next
1. Fix compare page winner logic (equal returns = no winner)
2. Migrate /sip page from Project/sip.html
3. Migrate /quiz page from Project/quiz.html  
4. Migrate /portfolio page from Project/portfolio.html
5. Add Supabase auth
6. Add Claude API for AI explanations
7. Add Stripe payments
8. Deploy to Vercel