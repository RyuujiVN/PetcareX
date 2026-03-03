# PetCareX Mobile Project Summary

## 📌 Project Overview
PetCareX is a Flutter-based mobile application for pet care management, integrated with a NestJS backend.

## 🛠 Tech Stack
- **Frontend:** Flutter (Dart)
- **Backend:** NestJS (Node.js)
- **Authentication:** Custom JWT-based Auth (via `/auth/login` and `/auth/register`)
- **Security:** `flutter_secure_storage` (Keystore/Keychain)
- **Hardware:** `image_picker` + `permission_handler` (Camera & Gallery)
- **Local Settings:** `shared_preferences`

## 📡 Networking & Connection (Crucial)
- **Base URL:** `http://192.168.30.79:3000` (Manual IP for Physical Device testing)
- **Local Testing:** `http://10.0.2.2:3000` (For Android Emulator)
- **Corporate Network Solution:** Use `adb reverse tcp:3000 tcp:3000` and set URL to `http://localhost:3000` if IP connection is blocked.
- **Android Config:** `android:usesCleartextTraffic="true"` enabled in `AndroidManifest.xml`.

## ✅ Implemented Features

### 1. Authentication (Auth Feature)
- **Login (`login_page.dart`):**
  - Integrated with `/auth/login`.
  - Secure "Remember Me": Stores credentials in Secure Storage.
  - UI Security: Auto-hides password eye icon during auto-fill.
  - Validation: Email/Password presence check.
- **Register (`register_page.dart`):**
  - Integrated with `/auth/register`.
  - Payload: `{ fullName, email, password, role: "CUSTOMER" }`.
  - Compact UI: Optimized spacing to avoid scrolling on small screens.
- **Forgot Password:** UI placeholder screens completed.

### 2. Dashboard (`home_page.dart`)
- **Header:** Brand logo, search, and notification badge.
- **User Section:** Circular avatar with edit button, personalized greeting.
- **Pet Management:** Horizontal list of pets with selection states.
- **Quick Actions:** Tiles for Appointment Booking, AI Chatbot, and Clinic Locator.
- **Appointments:** Detailed card for upcoming medical tasks (Confirm/Cancel).
- **Forum:** Community post preview with engagement stats.

### 3. Core Services
- **CameraService (`camera_service.dart`):** Unified handler for picking images from camera/gallery with runtime permission requests.

## 📁 Project Structure
- `lib/core/`: Common themes (`app_colors.dart`, `app_text_styles.dart`), widgets, and services.
- `lib/features/auth/presentation/`: All auth-related screens + `home_page.dart` (current navigation).
- `lib/features/home/presentation/`: Main dashboard components.

## 📝 API Reference (Backend)
- **Login Response:** Returns `accessToken` and `userInfo` object.
- **Registration Request:** Requires `fullName`, `email`, `password`, and `role`.
