# Implementation status

Last updated: 2026-07-23

## Summary

- Candidate, Recruiter, and Admin application scope is implemented locally.
- Backend integration and unit tests: 84 passing.
- Frontend Admin policy/navigation tests: 3 passing.
- Backend and frontend lint, type-check, and production builds pass.
- Admin production deployment and Render/Vercel end-to-end verification are
  partially implemented.
- The new Admin migration is locally valid but is not marked deployed. The
  configured external Render PostgreSQL host resolves and accepts TCP on
  port 5432, but PostgreSQL/TLS negotiation times out.

## Implemented

### Platform foundation

- The 14 original product tables plus the `Admin` marker/extension table.
- Prisma 7 PostgreSQL adapter and one lazy Prisma Client per process.
- Initial migration plus a separate additive Admin migration. The initial
  migration was not edited.
- Process and database health endpoints.
- Express route/controller/service/repository structure, Zod validation,
  centralized safe errors and 404, Helmet, restricted CORS, request logging,
  and reusable pagination.
- One frontend API client configured only through `VITE_API_URL`.

### Authentication and authorization

- Candidate registration and Candidate/Employee login with Candidate and
  Recruiter kept as separate identity tables.
- Bcrypt password hashing, signed bearer JWTs, safe DTOs, and blocked-user
  checks on every protected request.
- Admin logs in through the existing Employee form. There is no separate
  Admin login route or UI.
- A Recruiter with an `Admin` marker has the single effective role `ADMIN`;
  without the marker the effective role is `RECRUITER`.
- Auth middleware reloads the Recruiter identity and Admin marker on every
  protected request, so promotion is reflected by the next session check.
- `requireCandidate`, `requireEmployee`, and `requireAdmin` express the role
  policies. `requireEmployee` allows both Recruiter and Admin.

### Attribute, Position, Profile, Project, CV, and Likes

- Attribute Library CRUD with pagination, prefix search, category filtering,
  stable sorting, SINGLE_SELECT options, built-in protection, relation-safe
  deletion, and optimistic locking.
- Shared Position CRUD with ordered Attributes, shared Tags, access rules,
  max projects, stable lists, cascades, and optimistic locking.
- Candidate available Position list/detail with server access checks.
- Candidate Profile Attribute operations with one universal value and
  SINGLE_SELECT option validation.
- Candidate Project CRUD with shared Tag reuse and period validation.
- Dynamic CV assembly from Profile, Position, Attributes, Tags, and Projects;
  CV content is not serialized or stored as JSON.
- Candidate own-CV list/create/detail/update/delete.
- Employee CV search/detail and idempotent CV Like/Unlike.
- Existing React layouts, forms, tables, toolbar, search, and detail
  components are retained and connected to the API.

### Admin model

- `Admin.recruiter_id` is both primary key and foreign key to `Recruiter.id`.
- Deleting a Recruiter cascades the Admin marker and existing CV Likes.
- Admin does not duplicate email, password hash, blocked state, or timestamps
  from the Recruiter identity.
- Promotion adds one marker row only. Repeated promotion returns 409.
- Candidate ids cannot be promoted.
- No common User, Role, UserRole, Permission, or AdminPermission model exists.

### Admin Users API and UI

- `GET /api/admin/users` returns a paginated projection of Candidate,
  Recruiter, and Admin identities without password fields.
- Server search, effective-role filter, blocked/active filter, and stable
  ordering.
- Candidate display name comes from an available built-in Profile Attribute
  value and falls back to email.
- The mixed list uses one parameterized repository-only `UNION ALL` with
  explicit columns. User input is never concatenated into SQL.
- Bulk block, unblock, and delete split typed references once and use
  `updateMany`/`deleteMany` in one transaction without per-user queries.
- `/admin/users` reuses `AppLayout`, `SidebarNavigation`, `PageHeader`,
  `DataTable`, `ListToolbar`, debounce, and the shared API client.
- Change Role promotes one selected Recruiter after confirmation. Candidate
  and Admin rows cannot be selected for promotion.

### Admin Candidate management

- One `canManageCandidateProfile` policy allows a Candidate to manage only
  itself and Admin to manage the selected Candidate. Recruiter is denied.
- Admin target routes pass an already-authorized `candidateId` to the existing
  Profile, Profile Attribute, Project, Tag, and CV controllers/services.
- Admin uses the same business validation, Attribute value rules, Project
  period validation, uniqueness constraints, and optimistic locking.
- Admin can open/edit the selected Candidate Profile, add/edit/delete Info
  Attributes, create/edit/delete Projects, create/open/edit/delete CVs, and
  Like/Unlike through the existing Employee endpoints.
- Candidate Profile, Project forms, and Candidate CV components accept an
  explicit target and are reused for both Candidate owner and Admin.
- One permissions object controls:
  `canEditProfile`, `canEditCv`, `canDeleteCv`, and `canLikeCv`.
- Admin reuses the Employee layout and existing Position, Attribute Library,
  CV Search, and Like/Unlike pages. Users is added through navigation
  composition only for effective role Admin.

## Partially implemented

- Production application deployment. The previous initial migration was
  deployed, but `20260723190000_add_admin_marker` could not be checked or
  applied. Prisma returns a schema-engine connection error, a direct
  read-only `pg` connection times out during negotiation, and local
  `GET /api/health/database` returns `unavailable`. Render's public status
  reports Oregon PostgreSQL operational, so the blocker is specific to this
  database URL, instance state, or External Access configuration.
- Backend Render and frontend Vercel production URLs are not present in the
  repository or local environment, so remote health and Admin UI flows could
  not be verified.

## Not implemented by design

- Recruiter registration.
- Candidate promotion.
- Admin demotion.
- Separate Admin login or Admin layout.
- Common User/Role/Permission tables.
- Admin dashboard, analytics, audit log, invitations, or permission editor.
- Last-Admin and self-delete protection.
- Automatic first-Admin seed/bootstrap.
- Images, PDF generation, email confirmation, or publication state.

## API endpoints

### Health and authentication

- `GET /api/health`
- `GET /api/health/database`
- `POST /api/auth/candidates/register`
- `POST /api/auth/candidates/login`
- `POST /api/auth/recruiters/login`
- `GET /api/auth/session`

### Attribute, Position, Tag

- `GET /api/attributes`
- `GET /api/attributes/:id`
- `POST /api/attributes`
- `PATCH /api/attributes/:id`
- `DELETE /api/attributes/:id`
- `GET /api/tags`
- `GET /api/positions`
- `GET /api/positions/:id`
- `POST /api/positions`
- `PATCH /api/positions/:id`
- `DELETE /api/positions/:id`
- `GET /api/positions/available`
- `GET /api/positions/available/:id`

### Candidate Profile, Projects, and CV

- `GET /api/profile/me`
- `PATCH /api/profile/me`
- `GET /api/profile/me/available-attributes`
- `POST /api/profile/me/attributes`
- `PATCH /api/profile/me/attributes/:attributeId`
- `DELETE /api/profile/me/attributes/:attributeId`
- `GET /api/profile/me/projects`
- `GET /api/profile/me/projects/:projectId`
- `POST /api/profile/me/projects`
- `PATCH /api/profile/me/projects/:projectId`
- `DELETE /api/profile/me/projects/:projectId`
- `GET /api/cvs`
- `POST /api/cvs`
- `GET /api/cvs/:cvId`
- `PATCH /api/cvs/:cvId/profile-attributes`
- `DELETE /api/cvs/:cvId`

### Employee CV and Likes

- `GET /api/cvs/search`
- `GET /api/cvs/search/:cvId`
- `POST /api/cvs/:cvId/like`
- `DELETE /api/cvs/:cvId/like`

### Admin Users

- `GET /api/admin/users`
- `PATCH /api/admin/users/block`
- `PATCH /api/admin/users/unblock`
- `DELETE /api/admin/users`
- `POST /api/admin/recruiters/:recruiterId/promote`

### Admin Candidate target

- `GET /api/admin/candidates/:candidateId/profile`
- `PATCH /api/admin/candidates/:candidateId/profile`
- `GET /api/admin/candidates/:candidateId/profile/available-attributes`
- `POST /api/admin/candidates/:candidateId/profile/attributes`
- `PATCH /api/admin/candidates/:candidateId/profile/attributes/:attributeId`
- `DELETE /api/admin/candidates/:candidateId/profile/attributes/:attributeId`
- `GET /api/admin/candidates/:candidateId/projects`
- `GET /api/admin/candidates/:candidateId/projects/:projectId`
- `POST /api/admin/candidates/:candidateId/projects`
- `PATCH /api/admin/candidates/:candidateId/projects/:projectId`
- `DELETE /api/admin/candidates/:candidateId/projects/:projectId`
- `GET /api/admin/candidates/:candidateId/cvs`
- `POST /api/admin/candidates/:candidateId/cvs`
- `GET /api/admin/candidates/:candidateId/cvs/:cvId`
- `PATCH /api/admin/candidates/:candidateId/cvs/:cvId/profile-attributes`
- `DELETE /api/admin/candidates/:candidateId/cvs/:cvId`

## Database tables

1. Candidate
2. Recruiter
3. Admin
4. Profile
5. Attribute
6. Attribute_option
7. Profile_attribute
8. Project
9. Tag
10. Project_tag
11. Position
12. Position_attribute
13. Position_tag
14. CV
15. CV_like

## Verification

Backend:

```text
npm run db:validate
npm run db:generate
npm run lint
npm run type-check
npm test
npm run build
```

Frontend:

```text
npm run lint
npm test
npm run build
```

Repository:

```text
git diff --check
```

## Known limitations

- The configured Render PostgreSQL external endpoint accepts TCP but does not
  complete a PostgreSQL connection. Verify that the instance is `Available`,
  refresh the External URL if credentials changed, and check the database
  Networking IP allow list. Prefer Render Pre-Deploy with its Internal
  `DATABASE_URL` for `prisma migrate deploy`.
- A first Admin marker must be provisioned through a controlled operational
  action for an existing Recruiter before Admin-only promotion can be used.
- Production application URLs and credentials are intentionally absent from
  source control.
- User-staged legacy copies under `frontend/src/src` remain untouched and are
  excluded from the active frontend build.
- PGlite test infrastructure can emit a `pg` warning under concurrent test
  files; all tests pass and production code does not use PGlite.
