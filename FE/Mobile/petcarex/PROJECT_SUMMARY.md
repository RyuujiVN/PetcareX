# PetCareX Mobile Project Summary

## 📌 Project Overview
PetCareX is a Flutter-based mobile application for pet care management, integrated with a NestJS backend.

## 🛠 Tech Stack
- **Frontend:** Flutter (Dart)
- **Backend:** NestJS (Node.js) — REST API
- **State Management:** `provider` (ChangeNotifier, MultiProvider)
- **Networking:** Custom `ApiClient` (http package) with JWT Bearer injection, 30s timeout, and masked debug logging.
- **Security:** `flutter_secure_storage` for tokens and credentials.
- **Hardware:** `mobile_scanner` (QR), `image_picker`, `permission_handler`.
- **Local Storage:** `shared_preferences` for non-sensitive settings.

## 📡 Networking & Configuration
- **Base URL:** `lib/core/constants/app_constants.dart` — `String.fromEnvironment('BASE_URL', defaultValue: 'http://localhost:3000')`.
- **Device testing:** Use `adb reverse tcp:3000 tcp:3000` then run app (or `flutter run --dart-define=BASE_URL=http://localhost:3000`). Backend must be running on PC port 3000.
- **Android:** `usesCleartextTraffic="true"`, `minSdkVersion` 21.

## ✅ Implemented Features

### 1. Authentication
- **AuthProvider:** Login, logout, Google login, forgot/reset password, check auth status. JSON decode wrapped in try/catch; reset password uses correct `confirmPassword` key.
- **Login:** API + optional admin test bypass (long-press). Remember Me + saved email. Mounted checks after async.
- **Register:** Uses `ApiClient` + `AppConstants.registerEndpoint`; navigates to `MainNavigationWrapper`. JSON error body handled safely.
- **Forgot / Reset password:** Full flow with OTP; Timer in reset page checks `mounted` before setState.

### 2. Home & Navigation
- **MainNavigationWrapper:** Bottom nav (Home, Booking, Chat, Account).
- **Home:** Dashboard, pet list, QR scanner (FAB), booking entry.

### 3. Pet Management
- **Add/Edit pet:** Form, image pick, date picker, species/breed dropdowns. Upload avatar via `ApiClient.postMultipart`. Mounted checks after async; `TextEditingController` disposed.
- **PetRepository:** getMyPets, getSpecies, getBreeds, uploadAvatar, createPet, updatePet. JSON decode in try/catch; uploadAvatar validates `data['file']` type.

### 4. Chat
- **ChatPage:** UI with `TextEditingController` disposed; message list type-safe access.

### 5. Booking
- **BookingPage:** Multi-step UI (pet, clinic, service, doctor, date/time, confirm). **Currently mock-only:** no backend API; success view is placeholder.

## 📁 Project Structure
- `lib/core/`: constants, `ApiClient`, theme, services (e.g. `CameraService`).
- `lib/features/`: auth, home, pet, booking, chat, appointment (notifications).

## 📝 API Reference
- **Auth:** `/auth/login`, `/auth/login/google`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`.
- **User:** `/user`.
- **Pet:** `/pet`, `/pet/species`, `/pet/species/:id/breed`, `/pet/upload`.
- **Headers:** `ApiClient` adds `Authorization: Bearer <token>` and masks tokens in debug logs.

---

## 🔍 Code Quality & Scan Summary (Latest)

### Fixed in Codebase
- Auth: typo `confirmPassword`; jsonDecode try/catch in auth_provider, register, pet_repository.
- Lifecycle: Timer (reset password), date picker (add/edit pet), upload avatar — all use `mounted` checks; ChatPage disposes `TextEditingController`.
- ApiClient: uses `AppConstants.baseUrl`, 30s timeout on all requests, request/response logging with password and token masked.
- Register: uses ApiClient + MainNavigationWrapper; error parsing safe.
- Models: Pet/User/PetSpecies/PetBreed fromJson null-safe where applicable.
- Forgot password / booking summary: safe form validation and null `_selectedTime`.

### Remaining / Known Items
| Area | Item | Severity |
|------|------|----------|
| **Auth** | User-facing messages sometimes include raw exception text (e.g. `TimeoutException`). Consider mapping to friendly strings. | Medium |
| **ApiClient** | Response body (first 200 chars) still logged in debug; may contain token/PII. Request side is masked. | Medium |
| **PetProvider** | Error messages use `e.toString()`; can expose internals. | Medium |
| **Booking** | Flow is UI-only; no real appointment API. High priority when backend is ready. | High |
| **Multipart** | `request.send()` has timeout; `Response.fromStream()` does not. | Low |

### Run After Reboot
1. Start backend on PC (port 3000).
2. `adb reverse tcp:3000 tcp:3000` (full path if needed: `C:\Users\Dell\AppData\Local\Android\Sdk\platform-tools\adb.exe`).
3. Run app from IDE or `flutter run`.
