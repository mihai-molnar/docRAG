# Plan: Supabase Auth + Free Tier Prompt Limit

## Context
Inkling needs user authentication (Phase 1) to support paid plans via Stripe (Phase 2). Users must sign in to use the app. Free tier gets 5 prompts total, enforced server-side. Email + password auth only.

## Prerequisites (manual, before coding)
1. Create a Supabase project at supabase.com
2. In SQL editor, run the schema below
3. In Auth settings: disable email confirmations (for simpler Phase 1 flow), disable OAuth providers, disable magic link
4. Copy the project URL + anon key

**SQL schema:**
```sql
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  prompt_count int not null default 0,
  prompt_limit int not null default 5,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own prompt_count"
  on public.profiles for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atomic prompt increment (prevents tampering/races)
create or replace function public.increment_prompt_count()
returns json as $$
declare
  current_count int;
  current_limit int;
begin
  select prompt_count, prompt_limit into current_count, current_limit
  from public.profiles where id = auth.uid();

  if current_count >= current_limit then
    return json_build_object('allowed', false, 'prompt_count', current_count, 'prompt_limit', current_limit);
  end if;

  update public.profiles set prompt_count = prompt_count + 1 where id = auth.uid();
  return json_build_object('allowed', true, 'prompt_count', current_count + 1, 'prompt_limit', current_limit);
end;
$$ language plpgsql security definer;
```

## Implementation Steps

### Step 1 — Install dependency & env config
- `npm install @supabase/supabase-js`
- Create `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Vite exposes `VITE_`-prefixed vars as `import.meta.env.*` automatically)
- `.env` is already gitignored

### Step 2 — Supabase client service
**New file:** `src/services/supabase.ts`
- Create singleton `supabase` client via `createClient(url, anonKey)`
- Reads from `import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
- Session storage: uses WebView `localStorage` by default (works in Tauri, persists across restarts)

### Step 3 — Auth types
**New file:** `src/types/auth.ts`
- `PromptCheckResult` interface: `{ allowed: boolean, prompt_count: number, prompt_limit: number }`

### Step 4 — Zustand store additions
**Modify:** `src/store/appStore.ts`
- Add auth fields: `user: User | null`, `session: Session | null`, `authLoading: boolean`, `promptCount: number`, `promptLimit: number`
- Add setters for each
- `authLoading` defaults to `true` (prevents flash of auth screen before session check completes)

### Step 5 — Auth hook
**New file:** `src/hooks/useAuth.ts`
- `useEffect` on mount: call `supabase.auth.getSession()` to check existing session, then `onAuthStateChange` listener for sign-in/out/token-refresh events
- On auth state change: update Zustand user/session, fetch profile (prompt_count/prompt_limit) from Supabase
- Expose: `signUp(email, password)`, `signIn(email, password)`, `signOut()`, `user`, `authLoading`, `promptCount`, `promptLimit`, `promptsRemaining`

### Step 6 — CSP update
**Modify:** `src-tauri/tauri.conf.json`
- Add `https://*.supabase.co` to `connect-src` directive (covers auth, REST, and realtime endpoints)

### Step 7 — Auth UI
**New files:** `src/components/auth/AuthScreen.tsx`, `src/components/auth/AuthForm.tsx`
- `AuthScreen`: full-screen centered card with Inkling branding + toggle between sign-in/sign-up
- `AuthForm`: email + password fields (+ confirm password on sign-up), submit button, error/success display
- Styling matches existing dark zinc palette + indigo accents

### Step 8 — App gating
**Modify:** `src/App.tsx`
- Call `useAuth()` to get `user` and `authLoading`
- If `authLoading`: show minimal loading screen (prevents flash)
- If no `user`: render `<AuthScreen />`
- If `user`: render `<AppLayout />` (existing behavior)

### Step 9 — Prompt limit service
**New file:** `src/services/promptLimit.ts`
- `checkAndIncrementPrompt()`: calls `supabase.rpc("increment_prompt_count")`, updates Zustand promptCount/promptLimit via `useAppStore.getState()`, returns `PromptCheckResult`
- Follows existing pattern of calling `useAppStore.getState()` from service code (same as `useChat.ts`)

### Step 10 — Enforce prompt limit in chat
**Modify:** `src/hooks/useChat.ts`
- At the top of `sendMessage()`, before embedding/API calls: call `checkAndIncrementPrompt()`
- If `!allowed`: add user message + assistant message saying "You've used all 5 free prompts. Upgrade to a paid plan for unlimited access." then return early

### Step 11 — Prompt counter in chat UI
**Modify:** `src/components/chat/ChatView.tsx`
- Read `promptCount`/`promptLimit` from store
- When `promptsRemaining <= 3`: show amber warning badge above ChatInput ("X free prompts remaining")
- When `promptsRemaining <= 0`: show message + disable ChatInput
- Pass `disabled={streaming || promptsRemaining <= 0}` to `ChatInput`

### Step 12 — User info in sidebar
**Modify:** `src/components/layout/Sidebar.tsx`
- Add user email (truncated), prompt count display, and sign-out button (LogOut icon) above the existing index stats footer section

### Step 13 — Update docs
**Modify:** `CLAUDE.md` — add auth files to project structure, note Supabase env vars and CSP
**Modify:** `TODO.md` — mark auth as completed, note Phase 2

## Files Summary

| New files | Purpose |
|---|---|
| `.env` | Supabase URL + anon key |
| `src/services/supabase.ts` | Supabase client singleton |
| `src/services/promptLimit.ts` | Atomic prompt increment via RPC |
| `src/types/auth.ts` | PromptCheckResult type |
| `src/hooks/useAuth.ts` | Auth hook (session, sign in/up/out, profile) |
| `src/components/auth/AuthScreen.tsx` | Full-screen auth gate |
| `src/components/auth/AuthForm.tsx` | Sign-in/sign-up form |

| Modified files | Changes |
|---|---|
| `src/store/appStore.ts` | Add auth state fields |
| `src/App.tsx` | Auth gating (AuthScreen vs AppLayout) |
| `src/hooks/useChat.ts` | Prompt limit check before sendMessage |
| `src/components/chat/ChatView.tsx` | Prompt counter badge, disable input at limit |
| `src/components/layout/Sidebar.tsx` | User email, prompts remaining, sign-out |
| `src-tauri/tauri.conf.json` | CSP connect-src add `https://*.supabase.co` |
| `CLAUDE.md` | Updated project structure + notes |
| `TODO.md` | Mark auth completed |

## Verification
1. `npx tsc --noEmit` — type check passes
2. `npx tauri dev` — app launches, shows auth screen
3. Sign up with email + password — profile created in Supabase, user signed in, app loads
4. Sign out — returns to auth screen
5. Sign in again — session restored
6. Restart app — session persisted via localStorage, auto-signed-in
7. Send 5 messages — prompt counter decrements, limit message shown on 6th attempt, input disabled
8. Check Supabase `profiles` table — `prompt_count` = 5

## Phase 2 Notes (Stripe — future)
- `prompt_limit` column is already separate from `prompt_count` — upgrading a user is a single row update
- Stripe Checkout opened in system browser (not WebView) via Tauri opener
- Supabase Edge Functions handle Stripe webhooks to update `profiles`
- App polls or uses Supabase Realtime to detect subscription changes
