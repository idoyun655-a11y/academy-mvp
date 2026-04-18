# Recovery Status

Last checkpoint: `2026-04-18 23:52:24`

## Autosave rule

- I cannot read the app's exact "remaining usage %" meter directly.
- Instead, when the working context is getting tight, I will automatically leave:
  - a checkpoint note in this file
  - a backup zip in the parent documents folder

## Current stable status

- `public/logo.png` is present and the production build output is healthy.
- `server/localStore.ts` is active, so the app can persist real data locally even when MySQL is not connected.
- `server/db.ts` now supports local-store-backed CRUD for:
  - users
  - students
  - classes
  - class schedules
  - enrollments
  - attendance
  - notices
  - grades
  - exam schedules
  - academy events
  - tuition payments
- `server/portalData.ts` uses the same persisted store, so admin, student, and parent pages stay synchronized.
- `server/auth.ts` seeds the default admin account and no longer depends on legacy test users.
- Default admin credentials:
  - email: `etacademy@gmail.com`
  - password: `etacademy!!`

## Completed in this checkpoint

- `server/routers.ts`
  - cleaned old teacher-management dead code
  - unified teacher password validation with the main password rules
  - translated remaining auth/profile error messages
- `client/src/components/DashboardLayout.tsx`
  - rebuilt the admin shell layout
  - restored logo visibility
  - centered the content area with a proper max width
  - improved the header/sidebar balance so the page no longer feels left-collapsed
  - translated the unauthenticated/logout UI to Korean
- Admin calendar flow is active in the dashboard and uses persisted exam/event data.

## Latest validation

- `npm run check` passed
- `npm run build` passed
- Smoke test passed:
  - default admin login succeeded
  - calendar exam create/list/delete succeeded
  - calendar event create/list/delete succeeded

## Immediate next steps

1. Launch and visually verify on `localhost:3000`.
2. Check admin pages beyond the dashboard:
   - students
   - classes
   - teachers
   - attendance
   - notices
   - grades
   - payments
3. Do one real end-to-end manual flow:
   - sign up a student account
   - add/update data from admin
   - confirm student/parent pages reflect the same data

## Latest backup

- `C:\Users\IDOYU\OneDrive\문서\academy-backup-20260418-235224.zip`
