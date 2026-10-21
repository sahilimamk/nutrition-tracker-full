# Building the Android APK yourself

This folder is a complete Android Studio (Gradle) project. The app itself is
the `web/` site bundled under `app/src/main/assets/www/` and shown in a
native WebView — all diary data stays in the WebView's localStorage on the
device, exactly like the web version.

## Build the APKcd /home/knigha/Desktop/MiniProj/nutrition-tracker-full

git init
git add .
git commit -m "Initial nutrition tracker commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_PRIVATE_REPO.git
git push -u origin main

1. Install **Android Studio** (any recent version, free from developer.android.com).
2. Open Android Studio → **Open** → select this `android/` folder.
3. Let it sync Gradle (first run downloads the Android Gradle Plugin and SDK
   pieces — needs internet, takes a few minutes).
4. Menu: **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
5. Find the APK at:
   `app/build/outputs/apk/debug/app-debug.apk` (unsigned debug build), or switch
   the Build Variant to `release` for `app-release.apk`.

Debug APKs install directly on your phone (allow "install unknown apps").
For sharing with others, build `release` and sign it (below).

## Sign a release APK (for sharing / updating)

Android Studio can do this with a GUI:

1. **Build → Generate Signed App Bundle / APK → APK**.
2. Create a **new keystore** (first time only) — remember the passwords.
   **Keep this keystore file safe: every future update MUST be signed with the
   same key, or phones will refuse to install it over the old version.**
3. Build → you'll get a signed `app-release.apk`.

## Shipping updates

1. Edit the web app in `web/` (top level of this project), then copy the
   changed files into `app/src/main/assets/www/` (or re-copy the whole folder).
2. In `app/build.gradle`, bump `versionCode` by 1
   (e.g. `1` → `2`). `versionName` is the human label (`"1.0"` → `"1.1"`).
3. Build + sign with the **same keystore**.
4. Users install the new APK over the old one — their diary data carries over
   (WebView localStorage is preserved on update).

## Project layout

```
android/
├── settings.gradle / build.gradle      # Gradle config
└── app/
    ├── build.gradle                    # namespace, SDK versions, versionCode ← bump here
    └── src/main/
        ├── AndroidManifest.xml         # INTERNET + CAMERA permissions, launcher activity
        ├── java/com/sahil/nutritiontracker/MainActivity.java
        │                               # WebView: JS + DOM storage on, camera permission
        │                               # granted to the page, runtime CAMERA request,
        │                               # back button = WebView history
        ├── res/                        # launcher icons, splash screen, theme
        └── assets/www/                 # ← the web app (copy of web/)
```

## Notes / gotchas

- **Min SDK 21 (Android 5.0)+**, target/compile SDK 34.
- The barcode scanner needs the CAMERA permission: the app asks at launch,
  and the WebView forwards page camera requests via
  `WebChromeClient.onPermissionRequest`.
- Android 5.0–5.1 devices can install and use the app, but camera prompts are
   only shown on Android 6.0+ where runtime permissions exist.
- `MainActivity` deliberately uses **named nested classes only** — the `d8`
  dexer in build-tools 34 crashes on anonymous inner classes compiled by
  newer javac. Don't "simplify" them back into anonymous classes.
- Food search needs internet (Open Food Facts API). Everything else works offline.
