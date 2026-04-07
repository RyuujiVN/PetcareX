# PetCareX Web — Project Summary

## Tech Stack
- **Frontend:** React (Vite), Ant Design, react-router-dom, i18next
- **State Management:** React hooks + Context API
- **Networking:** Axios (`services/apiClient.js`), Socket.io Client
- **Backend:** NestJS, TypeORM, PostgreSQL, Socket.io, Bull (job queue)

## Notification System (integrated 2026-04-07)

### BE Notification Mechanism
- **Protocol:** WebSocket via Socket.io
- **Namespace:** `/notification`
- **Authentication:** JWT token passed in `handshake.auth.accessToken`
- **Event (server → client):** `severSendNotification` (note: "sever" is a typo in BE, not "server")
- **Room isolation:** Each user joins a room = their `user.id`; notifications are emitted to that room

### BE Notification Entity
```
id:          UUID (auto-generated)
recipientId: UUID (FK → user.id)
senderId:    UUID | null
senderType:  'USER' | 'CLINIC' | 'SYSTEM'
type:        NotificationEnum (see below)
isRead:      boolean (default: false)
target:      JSONB (flexible payload, varies by type)
createdAt:   Date (auto)
```

### Notification Types (NotificationEnum)
| Type | Status | Recipient | Target Payload |
|------|--------|-----------|----------------|
| `APPOINTMENT_BOOKED` | Active | Clinic Admin + Vet | `{ appointmentDate, appointmentTime, appointmentId, userName }` |
| `AI_DIAGNOSIS` | Active | Pet Owner | `{ appointmentId, aiDiagnosisId, petName }` |
| `APPOINTMENT_CANCELLED` | Defined, not triggered | — | — |
| `APPOINTMENT_REMINDER` | Defined, not triggered | — | — |
| `FOLLOW_UP_REMINDER` | Defined, not triggered | — | — |
| `COMMENT_REPLY` | Defined, not triggered | — | — |

### BE Limitation
- **No REST endpoints** for notifications. Controller and Service are empty stubs.
- Cannot fetch notification history, mark as read on server, or paginate from BE.
- All persistence and read-state management is handled FE-side via localStorage.

### FE Integration Architecture (Hướng A — FE-only)

#### Shared Hook: `hooks/useNotificationSocket.js`
- Creates its own Socket.io connection (not the singleton `notifySocket.js`)
- Accepts `{ storageKey, token, enabled }` params
- Receives `severSendNotification` events, maps raw BE data via `mapBeNotification()`
- Persists notifications + read IDs in localStorage
- Exposes: `notifications`, `readIdSet`, `unreadCount`, `markAsRead()`, `markAllAsRead()`, `connected`
- Handles: auto-reconnect (15 attempts, exponential backoff), cleanup on unmount

#### Layout Integration

| Layout | Hook storageKey | Data Source |
|--------|----------------|-------------|
| **Client Header** (`components/layouts/client/header.jsx`) | N/A (inline socket) | API polling (60s) + WebSocket merged |
| **Clinic Admin** (`layouts/Clinic/AdminClinicLayout.jsx`) | `ws_notif_clinic:{scopeKey}` | WebSocket only |
| **Veterinarian** (`layouts/Vererianrian/AdminVererianrianLayout.jsx`) | `ws_notif_vet:{userId}` | WebSocket only |
| **Super Admin** (`layouts/admin/AdminLayout.jsx`) | `ws_notif_admin:{userId}` | WebSocket only |

#### Client Header (special case)
- Keeps existing `notificationService.js` which polls appointment/forum APIs every 60s
- Additionally connects WebSocket to receive realtime BE notifications (e.g., `AI_DIAGNOSIS`)
- Both sources merge into the same `notificationItems` state
- Read IDs stored in localStorage scoped by `userId`

### Files Changed (2026-04-07)
| Action | File |
|--------|------|
| **Created** | `hooks/useNotificationSocket.js` |
| **Modified** | `layouts/Clinic/AdminClinicLayout.jsx` — removed mock data, integrated hook |
| **Modified** | `layouts/Vererianrian/AdminVererianrianLayout.jsx` — removed mock data, integrated hook |
| **Modified** | `layouts/admin/AdminLayout.jsx` — removed mock data, integrated hook |
| **Modified** | `components/layouts/client/header.jsx` — added WebSocket alongside API polling |
| **Modified** | `components/layouts/client/header.css` — added `ai-diagnosis` icon style |

### Mock Data Removed
- `buildMockClinicNotifications()` from AdminClinicLayout (5 hardcoded items)
- `buildMockVeterinarianNotifications()` from AdminVererianrianLayout (5 hardcoded items)
- `MOCK_ADMIN_NOTIFICATIONS` from AdminLayout (6 hardcoded items)
- Old `notifySocket` import + console.log-only listener from AdminClinicLayout

### Services Directory Convention
All API service files live in `services/` with pattern `{domain}Service.js`.
The `notificationService.js` provides client-side notification aggregation from appointment/forum APIs (not mock — real data). It remains in use for the client header.
