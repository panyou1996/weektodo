# Android Build Instructions

## Prerequisites

- Node.js 20.x
- Java JDK 17
- Android Studio (optional, for local development)

## Local Build

### 1. Install dependencies
```bash
npm install
```

### 2. Build web app
```bash
npm run build
```

### 3. Initialize Capacitor (first time only)
```bash
npx cap add android
```

### 4. Sync Capacitor
```bash
npx cap sync android
```

### 5. Build APK
```bash
cd android
./gradlew assembleRelease
```

The APK will be located at: `android/app/build/outputs/apk/release/app-release.apk`

## Quick Build
```bash
npm run build:android
```

## GitHub Actions Automation

This project includes automated Android builds via GitHub Actions.

### Automatic Builds

- **On every push to main**: Creates a "nightly" pre-release with the latest APK
- **On version tags** (e.g., v2.2.0): Creates an official release with signed APK

### Setting up APK Signing (Optional)

For signed APK releases, add these secrets to your GitHub repository:

1. Go to Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `ANDROID_SIGNING_KEY`: Base64-encoded keystore file
   - `ANDROID_KEY_ALIAS`: Key alias
   - `ANDROID_KEYSTORE_PASSWORD`: Keystore password
   - `ANDROID_KEY_PASSWORD`: Key password

#### Generate keystore:
```bash
keytool -genkey -v -keystore weektodo.keystore -alias weektodo -keyalg RSA -keysize 2048 -validity 10000
```

#### Convert keystore to base64:
```bash
# Linux/Mac
base64 weektodo.keystore | tr -d '\n'

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("weektodo.keystore"))
```

## Opening in Android Studio

```bash
npx cap open android
```

## Testing on Device

After building the APK, install it on your Android device:
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

## Troubleshooting

### Build fails with Gradle errors
- Ensure Java JDK 17 is installed
- Run `./gradlew clean` in the android directory

### APK not working on device
- Check minimum SDK version in `android/app/build.gradle`
- Ensure all required permissions are declared in `AndroidManifest.xml`
