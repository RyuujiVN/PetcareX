# Project Summary: PetCareX Mobile

## 1. Project Overview
PetCareX is a mobile application designed for pet care management, connecting pet owners with veterinary services and a supportive community.

## 2. Technical Stack
- **Framework:** Flutter (Dart)
- **Backend:** NestJS (Node.js) - connected via REST API
- **Local Storage:** `flutter_secure_storage` (for sensitive data like tokens), `shared_preferences` (for general settings)
- **Networking:** `http` package
- **Hardware Integration:** `image_picker` and `permission_handler` for camera/gallery access.

## 3. Core Features (Implemented)
### Authentication
- **Login:** 
  - Integrated with Backend API (`/auth/login`).
  - Secure credential storage using `flutter_secure_storage`.
  - "Remember Me" functionality with automatic credential filling and security-enhanced UI (hiding password toggle on auto-fill).
- **Registration:** 
  - Integrated with Backend API (`/auth/register`).
  - Role-based account creation (default: `CUSTOMER`).
  - Terms & Privacy Policy agreement.
- **Password Recovery:** 
  - UI for "Forgot Password" and "Reset Password" screens.

### Home Dashboard
- Personalized greeting and user profile.
- Pet management list (Mimi, LuLu).
- Quick Actions: Booking appointments, AI Chatbot consultation, Clinic locator.
- Appointment Management: Upcoming appointment cards with confirm/cancel actions.
- Community Forum: Latest posts preview with engagement metrics.

### Hardware Services
- **Camera Service:** Centralized service for capturing photos and picking images from the gallery, including automated permission handling.

## 4. Current Configuration
- **API Base URL:** `http://192.168.30.79:3000` (Optimized for physical device testing on local network).
- **Android Configuration:** `usesCleartextTraffic` enabled for HTTP communication; necessary permissions (Camera, Internet, Storage) declared.

## 5. File Structure (Key Directories)
- `lib/core/`: Common themes, constants, networking, and shared services (e.g., `CameraService`).
- `lib/features/auth/`: Authentication logic and presentation (Login, Register, Home within auth context).
- `lib/features/home/`: Home dashboard implementation.
- `lib/main.dart`: Application entry point.
