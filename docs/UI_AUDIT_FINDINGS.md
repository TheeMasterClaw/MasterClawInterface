# UI Audit Findings (End-to-End Flow)

Date: 2026-02-14  
Scope: Welcome → Mode Select → Dashboard (Context mode) + dashboard utility panels + mobile viewport.

## Critical Issues

1. **Welcome screen is overcrowded by 13 floating utility buttons before onboarding starts.**
   - This competes with the primary CTA (`Begin`) and distracts from the intended onboarding flow.
   - Severity: High (first-impression + usability impact).

2. **Mobile welcome experience is heavily cluttered by the same 13 floating buttons.**
   - At narrow width, the floating controls crowd and visually dominate the screen.
   - Severity: High (mobile usability and readability).

3. **Task and Calendar panels fail to load data in the default local setup due to relative API paths.**
   - `TaskPanel` uses `fetch('/tasks')` and similar relative calls.
   - `CalendarPanel` uses `fetch('/calendar/upcoming')` and similar relative calls.
   - In Vite dev (port 3000), these requests can hit frontend origin and return HTML, causing JSON parse failures.
   - Severity: High (core panels appear broken).

4. **Context-mode proactive alerts can throw runtime errors when upstream response is not an array.**
   - Dashboard alert logic assumes `events.filter(...)` without validating payload shape.
   - This produced `TypeError: events.filter is not a function` during audit.
   - Severity: Medium-High (context feature degrades and logs noisy errors).

5. **Health Monitor defaults to an unavailable WebSocket endpoint (`ws://localhost:3002/health`) causing repeated connection errors.**
   - This generated continuous connection failure logs in browser console.
   - Severity: Medium (noise + perceived instability).

## Reproduction Notes

- Start backend: `cd backend && npm run dev`
- Start frontend: `cd frontend && npm run dev -- --host 0.0.0.0 --port 3000`
- Open app and progress through full flow:
  1. Welcome page
  2. Mode selection
  3. Enter Context mode dashboard
  4. Open dashboard utility panels
  5. Switch to mobile viewport and revisit welcome page

## Recommended Fix Order

1. Hide non-essential global utility buttons on welcome/mode-select (or collapse under one menu/FAB).
2. Move Task/Calendar API calls to shared `API` config constants (avoid relative fetch URLs).
3. Guard Dashboard alert processing with `Array.isArray(events)` fallback.
4. Gate Health Monitor WS connection behind explicit enablement and graceful unavailable state.
5. Add responsive rules to prevent floating-control overlap on narrow viewports.
