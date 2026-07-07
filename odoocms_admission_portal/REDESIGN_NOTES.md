# Admission Portal Redesign — Signup vs Apply Separation

## What changed and why

The old flow created a **brand-new `res.users` account for every single
application**, because the login was literally set to the application's
reference number (`application.application_no`). That made "sign up once,
apply many times" impossible by design.

### Root cause found
`odoocms.application` already had a `user_id` field, but almost nothing
used it. Instead, ~20 places across the portal controllers re-derived
"the current application" by searching
`odoocms.application` where `application_no == current_user.login`.
That single assumption is what forced 1 signup == 1 application.

### The fix (module: `odoocms_admission_portal`)

1. **Signup is now identity-only** (`controllers/account_registration.py`).
   `/web/admission/signup/` creates a `res.users` + `res.partner` with
   `login = email`, a password the candidate chooses, and basic profile
   info (name, phone, CNIC). It no longer touches `odoocms.application`.
   Program selection was removed from the signup form entirely.

2. **New "Apply for a Program" flow** (`controllers/program_register.py`,
   route `/program/register/` + `/program/register/apply`). This is the
   only place that now creates an `odoocms.application`. It's `user_id`
   is set to the logged-in candidate. If the candidate already has a
   (non-rejected) application for that register, they're resumed instead
   of duplicated.

3. **Shared resolver** (`controllers/portal_common.py` →
   `PortalApplicationMixin`). Since a candidate can now own several
   applications, every step/save/download controller needs to know which
   one it's working on. `_get_current_application()` resolves that from
   (in priority order): an explicit `application_id` in the URL → the
   session's `active_application_id` → the candidate's most recent
   application (keeps old bookmarks/links working). It always re-checks
   `application.user_id == request.env.user` so nobody can view/edit
   someone else's application. All ~20 call sites in
   `controllers/admission_application.py`, `dashboard.py`, and
   `cbt_results.py` were switched to use this helper instead of the
   login-matching hack. The dead, unused duplicate file
   `admission_application-old.py` (not wired into `__init__.py`) was
   removed.

4. **New candidate dashboard** (`/admission/dashboard/`, also aliased
   from the old `/admission/applicant/dashboard` link for backward
   compatibility). Shows:
   - "My Applications" — full history of every application the
     candidate has made, with reference no., program/career, date and
     live status, and a Continue/View button per row.
   - "Apply for a New Program" — any `odoocms.admission.register`
     currently open (`state == 'application'`) that the candidate hasn't
     already applied to.

   Internal/backend users are redirected straight to `/web` if they ever
   hit this route — they never see the portal dashboard, and
   `program_register.py` refuses to create an application for them, so
   admins genuinely cannot "apply" for a program.

5. **Login redirect logic** now branches on `has_group('base.group_user')`:
   staff/admin → normal Odoo backend (unchanged, exactly as before);
   candidates → always `/admission/dashboard/`.

6. **`res.users`** gained `application_ids`/`application_count`
   (`models/res_partner.py`) so the full application history is a normal
   relation off the account, not a login-string match.

### Backend (admin) side
Nothing in `views/backend/*`, the backend `odoocms.application` tree/form
views, or the security/model access for `base.group_user` was touched —
staff keep using exactly the interface they already have.

## Deployment / migration notes (please read before upgrading)

- This is a **behavioural change**, not just a code change — existing
  candidates whose `login` is an old application number will keep working
  (they can still sign in with that old login/password and their
  application still resolves via `user_id`), but they won't automatically
  gain a "one login for every past application" unless their historical
  applications share the same `user_id`. If your production DB has
  multiple past applications for the same real person under different
  logins, those are still separate identities until you deliberately
  merge them (e.g. a one-off data migration script setting `user_id` on
  the older applications to the account you want them consolidated
  under). I did not attempt that merge automatically since it requires
  business rules (matching by CNIC? email? manual review?) that only your
  team can safely decide.
- New signups will pick their own password (min 6 chars) instead of the
  CNIC/email-prefix default — update any onboarding instructions/FAQ
  accordingly.
- `odoocms_admission.mail_template_account_created` still works as-is
  (it just receives `login`/`password` context values); consider updating
  its copy to say "your email is your login" instead of referencing an
  application number.
- Run `-u odoocms_admission_portal` (module upgrade) after deploying;
  no new fields require a data migration (`user_id` and `cnic` already
  existed).
