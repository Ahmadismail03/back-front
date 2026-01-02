# Smart Government Voice Assistant System (Mobile Frontend)

Expo + React Native (TypeScript) frontend scaffold based on the provided SRS. Backend is mocked via an in-memory Axios adapter and can be swapped to real endpoints later.

## Tech
- React Native (Expo)
- TypeScript
- Zustand (state)
- Axios (API)
- React Navigation (stack + tabs)
- i18n (English + Arabic) with RTL/LTR support

## Run

```powershell
Set-Location "c:\Users\babee\smart-gov-app"
npm install
npm run start
```

## App Icon Setup

⚠️ **IMPORTANT**: The app currently uses a placeholder icon. Before deploying to stores, you must create proper app icons following mobile best practices.

**Quick Start**:
1. Read [`ICON_SETUP_INSTRUCTIONS.md`](./ICON_SETUP_INSTRUCTIONS.md) for detailed steps
2. Create `icon.png` (1024×1024, transparent background)
3. Create `adaptive-foreground.png` (1024×1024, transparent, safe zone)
4. Run `npx expo prebuild --clean`

**Or use the automated script** (requires ImageMagick):
```powershell
.\generate-icons.ps1
```

**Files needed**:
- `assets/icon.png` - iOS and general icon (1024×1024)
- `assets/adaptive-foreground.png` - Android adaptive foreground (1024×1024)
- Background color set in `app.json` (currently `#FFFFFF`)

See [`ICON_CHECKLIST.md`](./ICON_CHECKLIST.md) for quality verification.

## Mock backend
Implemented in `src/mocks/mockAdapter.ts` and attached to Axios in `src/core/api/axiosClient.ts`.

Mocked endpoints:
- `GET /services`
- `GET /services/:id`
- `GET /services/:id/slots`
- `POST /auth/otp`
- `POST /auth/verify`
- `POST /appointments` (requires token)
- `GET /appointments` (requires token)

OTP is mocked as `123456`.

## App flow
- Browse services without login.
- Booking requires verification (National ID + phone + OTP).
- Booking flow: date (calendar) → slot → confirm → success (reference number).
- My Appointments: upcoming/past + details; cancel/reschedule are placeholders.
- Settings: English/Arabic switch. RTL/LTR changes show a “Restart required” prompt and use `expo-updates` reload.

## TODO (backend integration)
- Replace the Axios `adapter` in `src/core/api/axiosClient.ts` with real base URL + networking.
- Replace repositories in `src/features/*/api/*Repository.ts` to match real contracts.
- Add real auth token refresh / expiry handling.
