# Client Management Page Design

## Overview

Add a standalone client management page (`/clients`) with full CRUD: list with search/filter, create/edit modal, and detail drawer with notes.

## Route

- Path: `/clients`
- i18n key: `menu.clients` (already defined in locales)

## File Structure

```
src/pages/clients/
  index.tsx               # List page (ProTable + CRUD)
  components/
    ClientForm.tsx         # Create/Edit modal form
    ClientDrawer.tsx       # Detail drawer (basic info + notes + appointments)
```

## List Page (index.tsx)

ProTable columns:
- Name (firstName + lastName, or name fallback)
- Email (copyable)
- Phone (mobilePhone)
- Status (active switch, inline toggle via PATCH)
- Appointments (appointmentCount, sortable)
- Balance (currentAccountBalance, formatted as $X.XX)
- Created At (dateTime, sortable)

Search/filter: name (partial), email (exact), active status.

Toolbar: "New Client" button.

Actions column: Edit, Delete (Popconfirm — soft note: backend has no DELETE, will hide delete for now).

Click row: open detail drawer.

## Create/Edit Form (ClientForm.tsx)

Modal with Form (layout vertical).

Fields:
- firstName (string, optional)
- lastName (string, optional)
- email (email validated, optional)
- mobilePhone (string, optional)
- dob (DatePicker, optional)
- pronoun (string, optional)

Edit mode pre-fills from `initialValues`. Create mode resets form.

API calls:
- Create: `POST /api/v1/clients` (`createClient`)
- Update: `PATCH /api/v1/clients/:id` (`updateClient`)

## Detail Drawer (ClientDrawer.tsx)

Sections:

1. **Basic Info** — Descriptions with: name, email, phone, dob, pronoun, status, card on file, balance, external ID, scheduling alert, created/updated at.

2. **Notes** — List of notes from `client.notes`. Add note input + submit. Delete note button per note.
   - API: `POST /api/v1/clients/:id/notes`, `DELETE /api/v1/clients/:id/notes/:noteId`

3. **Appointments** — Load via `getAppointments({ clientId, limit: 10 })`, show recent appointments list with date, service, state.

## API Additions (api.ts)

```ts
createClient(data: { firstName?, lastName?, email?, mobilePhone?, dob?, pronoun? })
updateClient(id, data: { firstName?, lastName?, email?, mobilePhone?, dob?, pronoun? })
createClientNote(id, data: { text: string })
deleteClientNote(id, noteId)
```

## Out of Scope

- Marketing/reminder settings editing
- Client deletion (backend has no DELETE endpoint)
- Client merge
- Custom fields editing
