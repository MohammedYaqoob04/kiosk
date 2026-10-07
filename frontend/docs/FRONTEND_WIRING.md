# Connecting the kiosk frontend (src/api/http.ts) to this API

Base URL = `${VITE_API_URL}/api/v1`. Send `Authorization: Bearer <accessToken>`. Errors are `{code, message}`.
Set `VITE_USE_MOCK=false`. Staff are identified by staff ID (for example STAFF-AI-104), not `demo-counsellor`.

| Kiosk (mock / http.ts today) | This API | Change needed |
|---|---|---|
| (login is local in auth.tsx) | `POST /auth/login` `{username,password,portal}` -> `{accessToken,user}` | add; keep the token in auth-session |
| (none) | `POST /auth/logout` | call on logout (kills the token) |
| `/password` `{current,next}` | `POST /auth/change-password` -> `{changed,accessToken}` | new path; REPLACE the stored token with `accessToken` |
| `/profile /dashboard /fees /results` | same paths | none |
| `/timetable?date=` | same | none |
| `/assignments/options` | same | none |
| `POST /assignments/front-page` `{subjectCode,no}` | same, but returns a **PDF** | read as a blob and open/print it |
| `/staff/leave-queue?counsellorId=` | `GET /leave/queue` | drop counsellorId (server uses the login) |
| `/staff/students?counsellorId=` | `GET /staff/students?q=&below_min=` | drop counsellorId |
| `/staff/leave-history?...&filter=` | `GET /leave/history?filter=ALL\|APPROVED\|REJECTED` | new path |
| `POST /staff/leave-requests/{id}` | `POST /leave/{id}/decision` `{decision,remark}` | new path |
| leaveStore.submitRequest | `POST /leave` as **multipart/form-data** | fields: kind, category, fromDate, toDate, reason (LEAVE) or eventName, organizer, venue + file `letter` (OD) |
| listForStudent | `GET /leave/mine` | |
| reassignCounsellor | `POST /leave/{id}/reassign` `{counsellorId: "STAFF-ID"}` | HOD only |
| staffData assign/unassign | `POST /hod/assign`, `/hod/assign-section`, `DELETE /hod/assign/{regNo}` | |
| HOD dashboard / students / reports | `GET /hod/overview`, `/hod/students`, `/hod/counsellors`, `/hod/reports/leave.csv`, `/hod/reports/attendance-shortage.csv` | CSV needs fetch + token, then save as a blob |
| noticeStore | `POST /notices` (multipart: title, body, category, audience, expiresAt, pinned, files), `GET /notices/inbox`, `/unread-count`, `POST /notices/{id}/read`, `GET /notices/sent`, `POST /notices/{id}/withdraw`, `POST /notices/{id}/pin` | audience strings unchanged |
| auditLog | `GET /audit?action=&from=&to=` | server writes it; remove client-side appendAudit |

Letters and notice attachments are protected: `fetch(url, {headers:{Authorization}})` -> blob -> `URL.createObjectURL`
(a plain `<a href>` or `<img src>` cannot send the token). Leave records now use the kiosk's `Request` shape
(status has 5 values; `counsellorDecision`/`hodDecision` = `{by, byId, at, remark}`; `letter` = `{name,type,size,url}`).
