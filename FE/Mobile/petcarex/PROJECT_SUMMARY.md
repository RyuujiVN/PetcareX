# PetCareX Mobile Project Summary

## 📌 Project Overview
PetCareX is a Flutter-based mobile application for pet care management, integrated with a NestJS backend.

## 🛠 Tech Stack
- **Frontend:** Flutter (Dart)
- **Backend:** NestJS (Node.js) — REST API
- **State Management:** `provider` (ChangeNotifier, MultiProvider)
- **Internationalization (i18n):** `flutter_localizations` with `.arb` files. Supports Vietnamese (vi) and English (en).
- **Networking:** Custom `ApiClient` (http package) with JWT Bearer injection, 30s timeout, and masked debug logging.
- **Security:** `flutter_secure_storage` for tokens and credentials.
- **Hardware:** `mobile_scanner` (QR), `image_picker`, `permission_handler`.
- **Local Storage:** `shared_preferences` for language settings and auth info.

## 📡 Networking & Configuration
- **Base URL:** `lib/core/constants/app_constants.dart` — `String.fromEnvironment('BASE_URL', defaultValue: 'http://localhost:3000')`.
- **Device testing:** Use `adb reverse tcp:3000 tcp:3000` then run app (or `flutter run --dart-define=BASE_URL=http://localhost:3000`). Backend must be running on PC port 3000.
- **Android:** `usesCleartextTraffic="true"`, `minSdkVersion` 21.

## ✅ Implemented Features

### 1. Authentication
- **AuthProvider:** Login, logout, Google login, forgot/reset password, check auth status.
- **Login/Register:** Full UI with multi-language support. Handles validation and error messages from server.
- **Forgot / Reset password:** OTP-based recovery flow.

### 2. Home & Navigation
- **MainNavigationWrapper:** Bottom nav (Home, Booking, Schedule, Community, Profile) - Fully localized labels.
- **Home:** Dashboard with greeting, pet list, QR scanner, and quick actions. Fully localized UI.

### 3. Pet Management
- **Add/Edit pet:** Form with dynamic **Species -> Breed** loading. Supports avatar upload, gender selection, and birthdate picker.
- **PetRepository:** CRUD operations for pets, including specialized endpoints for species and breeds by ID.
- **Data Persistence:** Uses standard ISO 8601 UTC format for dates.

### 4. Internationalization (i18n)
- **LanguageProvider:** Manages `Locale` state and persists user choice using `shared_preferences`.
- **Global Localization:** 100% of UI strings in major pages (Login, Home, Booking, Profile, Pet Mgmt) converted to use `AppLocalizations`.
- **Build Config:** Uses `l10n.yaml` with `output-dir: lib/l10n/generated` for maximum stability on Flutter 3.27+.

### 5. Account & Profile
- **AccountPage:** Menu for personal info, pet info, language switching, and logout.
- **ProfilePage:** View and update user details (fullName, email, phone, address, avatar).

## 📁 Project Structure
- `lib/core/`: constants, `ApiClient`, theme, providers (LanguageProvider), services.
- `lib/features/`: auth, home, pet, booking, chat, appointment, community.
- `lib/l10n/`: `.arb` translation files and generated localization code.

## 📝 API Reference
- **Auth:** `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`.
- **Pet:** `/pet` (POST/GET), `/pet/species` (GET), `/pet/species/:id/breed` (GET), `/pet/upload` (POST).
- **User:** `/user/profile` (GET), `/user/profile` (PATCH).

---

## 🔍 Code Quality & Scan Summary (Latest)

### Fixed in Codebase
- **i18n Errors:** Corrected `import` paths after moving from synthetic to local generated package.
- **Build Errors:** Fixed missing `mobile_scanner` import and `AppLocalizations.locale` getter issues.
- **Data Integrity:** Ensured `breedId` is sent as string/UUID and dates are ISO format.
- **Postgres Mapping:** Models now handle both `id` and `_id` for compatibility.

### Remaining / Known Items
| Area | Item | Severity |
|------|------|----------|
| **Data Translation** | Content returned from DB (e.g. breed names, service names) is still in the stored language. | Medium |
| **Booking** | Flow UI is localized, but appointment creation depends on backend readiness. | High |

### Run After Reboot
1. Start backend on PC (port 3000).
2. `adb reverse tcp:3000 tcp:3000`.
3. Run app: `flutter run`.
