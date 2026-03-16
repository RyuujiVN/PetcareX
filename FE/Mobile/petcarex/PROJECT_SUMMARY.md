# PetCareX Mobile Project Summary

## 📌 Project Overview
PetCareX is a Flutter-based mobile application for pet care management, integrated with a NestJS backend.

## 🛠 Tech Stack
- **Frontend:** Flutter (Dart)
- **Backend:** NestJS (Node.js) — REST API
- **State Management:** `provider` (ChangeNotifier, MultiProvider)
- **Internationalization (i18n):** `flutter_localizations` with `.arb` files. Supports Vietnamese (vi) and English (en).
- **Networking:** Custom `ApiClient` (http package) with JWT Bearer injection and 30s timeout.
- **Logging:** Centralized `AppLogger` for Request/Response tracking with sensitive data masking.
- **Local Storage:** `shared_preferences` for language settings and `flutter_secure_storage` for credentials.

## ✅ Recent Refactoring & "Clean Code" Updates

### 🗑 Removed / Cleaned Up:
- **Redundant State:** Removed multiple `bool _obscureText` variables across Login, Register, and Change Password pages.
- **Hardcoded Strings:** Replaced ~100+ Vietnamese hardcoded strings with `AppLocalizations` keys.
- **Manual Log Statements:** Deleted scattered `print()` statements in `api_client.dart` and various repositories.
- **Synthetic Package:** Removed `synthetic-package: true` from `l10n.yaml` to fix build errors on newer Flutter versions.
- **Duplicate Imports:** Cleaned up unused imports after widget refactoring.

### ➕ Added / Unified:
- **`PasswordTextField` Widget:** Created a reusable widget in `lib/core/widgets/` to unify password input style (bullet dots `•`, spacing, and visibility toggle) across the entire app.
- **`AppLogger` Utility:** Added `lib/core/utils/logger.dart` to centralize API logging with a professional framed UI and automatic masking of passwords/tokens.
- **Persistence:** Integrated `SharedPreferences` into `LanguageProvider` to remember user's language choice across sessions.
- **Missing Features:** Restored **Google Login** button and logic in the Login/Register flow.
- **QR Overlay:** Re-implemented `ScannerOverlayPainter` to provide a professional scanning UI (frame + laser effect).

## 📁 Feature Status

### 1. Authentication
- **Status:** Fully localized & Secured.
- **UI:** Login, Register, Forgot Password, Reset Password, Change Password. All use unified `PasswordTextField`.

### 2. Pet Management
- **Status:** Fully localized.
- **UI:** Home dashboard, Add Pet, Edit Pet. Dynamic Species -> Breed loading implemented.

### 3. Navigation
- **Status:** Unified.
- **UI:** Bottom Navigation Bar labels dynamically switch based on selected language.

### 4. Networking
- **Status:** Enhanced.
- **UI:** `ApiClient` now calls `AppLogger` for all requests. Errors are localized via `AppLocalizations`.

## 📝 Run & Debug
1. **Sync Localizations:** Run `flutter gen-l10n` after any `.arb` file change.
2. **Backend:** Start NestJS on port 3000.
3. **Bridge:** `adb reverse tcp:3000 tcp:3000`.
4. **App:** `flutter run`.
