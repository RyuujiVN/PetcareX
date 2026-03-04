# PetCareX Mobile Project Summary

## 📌 Project Overview
PetCareX is a Flutter-based mobile application for pet care management, integrated with a NestJS backend.

## 🛠 Tech Stack
- **Frontend:** Flutter (Dart)
- **Backend:** NestJS (Node.js) - connected via REST API
- **State Management:** `provider` (using `ChangeNotifier` and `MultiProvider` for global state).
- **Networking:** Custom `ApiClient` (using `http` package) with automated JWT Bearer token injection and logging.
- **Security:** `flutter_secure_storage` (Keystore/Keychain) for sensitive data like tokens and credentials.
- **Hardware Integration:**
  - `mobile_scanner`: QR/Barcode scanning with custom transparent overlay.
  - `image_picker`: Image selection from gallery.
  - `permission_handler`: Runtime permission management for Camera and Storage.
- **Local Storage:** `shared_preferences` for non-sensitive settings.

## 📡 Networking & Configuration
- **Base URL:** Centralized in `lib/core/constants/app_constants.dart`.
- **Current Base URL:** `http://localhost:3000` (Optimized for `adb reverse` testing).
- **Corporate Network Solution:** Use `adb reverse tcp:3000 tcp:3000` and set URL to `http://localhost:3000`.
- **Android Configuration:** `android:usesCleartextTraffic="true"` enabled; `minSdkVersion` raised to **21**.

## ✅ Implemented Features

### 1. Authentication & State Management
- **Auth Provider (`auth_provider.dart`):** Centralized logic for login, logout, and auth status checks.
- **User Model (`user_model.dart`):** Structured data model for user information.
- **Login Screen:**
  - Integrated with `AuthProvider` and Backend API (`/auth/login`).
  - Secure "Remember Me" with encrypted storage.
  - UI Security: Auto-hides password toggle during auto-fill.
- **Registration Screen:**
  - Payload: `{ fullName, email, password, role: "CUSTOMER" }`.
- **Password Recovery:** Placeholder UI for Forgot/Reset password flows.

### 2. Home Dashboard (`home_page.dart`)
- **Dashboard UI:** personalized greeting, pet list, and quick action tiles.
- **QR Scanner:** FAB integration with transparent overlay and scan animations.
- **Navigation:** Refactored to separate features (`home`, `pet`, `booking`).

### 3. AI Chatbot (`chat_page.dart`)
- Mobile-optimized chat interface with real-time timestamp simulation.
- Side-by-side message alignment (User vs AI).

### 4. Pet Management (`add_pet_page.dart`)
- Form with image picking, date picker for birthdate, and validation.

## 📁 Project Structure (Clean Architecture)
- `lib/core/`: Constants, network clients, and shared services (`CameraService`).
- `lib/features/`:
  - `auth/`: Data models and providers for authentication.
  - `home/`: Main dashboard logic.
  - `pet/`: Pet-related forms and logic.
  - `booking/`: Appointment scheduling.
  - `chat/`: AI assistant feature.
  - `appointment/`: Notification and schedule screens.

## 📝 API Reference
- **Endpoints:** `/auth/login`, `/auth/register`, `/user`.
- **Security:** All protected routes automatically include the `Authorization: Bearer <token>` header via `ApiClient`.
