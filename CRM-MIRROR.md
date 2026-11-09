# Sending submissions to the rebuilt CRM

Every form on this site forwards to the legacy PHP CRM. It now also sends a
**copy** to the rebuilt CRM, through `lib/mirrorToNewCrm.js`.

A mirror rather than a switch: the old CRM keeps receiving everything exactly
as before, so a rejected payload or an unreachable host during the changeover
costs nothing. The worst case is a missing copy, never a lost founder.

## Turning it on

Two variables. With `NEW_CRM_URL` unset the mirror does nothing at all and the
site behaves exactly as it does today.

```
NEW_CRM_URL=https://crm-next.example.com      # no trailing slash
NEW_CRM_INGEST_TOKEN=<the new CRM's CRM_INGEST_TOKEN>
```

Use a **different** token from `EXTERNAL_API_TOKEN`, so retiring the old CRM's
secret does not break both at once.

## What goes where

| Form | Sender | New CRM route |
|---|---|---|
| Form B (startup) | `lib/sendFormBToCRM.js` | `/api/ingest/startup-application` |
| Business (distress) | `lib/Senddistressformtocrm.js` | `/api/ingest/distress-application` |
| Executive | `lib/sendExecutiveToCRM.js` | `/api/ingest/executive-application` |
| Introducer | `lib/sendMediatorToCRM.js` | `/api/ingest/introducer` |
| Contact / pitch | `services/externalPitchService.js` | `/api/ingest/website-lead` |

The payload is the same object already sent to the legacy CRM — no second
shape to keep in step.

## Watching it

Every attempt logs one line:

```
[new-crm] startup accepted
[new-crm] startup rejected: HTTP 422 documents.description: Invalid input
[new-crm] startup could not be reached: fetch failed
```

A `rejected` line means the payload reached the CRM and it said no — that is
the line to act on. `expected JSON ... got <!DOCTYPE` means `NEW_CRM_URL`
points at a page rather than the API.

Nothing here is recorded against the Mongo document; the legacy
`externalApiStatus` fields still describe the legacy forward only.

## The contact form endpoint

`externalPitchService.js` used to have `/website_lead_ingest.php` hardcoded,
unlike the other four which read a full URL. It now prefers
`EXTERNAL_API_URL_LEAD` when set and falls back to the old path, so the legacy
destination can be moved without another code change.

## A note on the database connection

`lib/mongodb.js` used to cache the connection *promise* without clearing it on
failure, so one failed connect meant every later request awaited the same
rejection — the site stayed broken until someone restarted it, even once the
database was back. It now clears the cache on failure and the next request
retries.

## Cutting over

When the new CRM has run alongside long enough to trust, delete the legacy
`fetch` from each sender and keep the mirror. Do not remove the mirror and
repoint the legacy call — the mirror is the one with the endpoint map.
