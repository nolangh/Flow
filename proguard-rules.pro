# ProGuard / R8 rules for Honeydo
# Applied during release builds via expo-build-properties.
# R8 uses these to decide what to keep, shrink, and obfuscate.

# ─── React Native core ────────────────────────────────────────────────────────
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-dontwarn com.facebook.react.**
-dontwarn com.facebook.hermes.**

# ─── Expo modules ─────────────────────────────────────────────────────────────
-keep class expo.modules.** { *; }
-dontwarn expo.modules.**

# ─── Sentry ───────────────────────────────────────────────────────────────────
# Keep Sentry classes so crash reports have correct stack frames
-keep class io.sentry.** { *; }
-dontwarn io.sentry.**
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
# Keep original source file names in stack traces (Sentry maps these)
-renamesourcefileattribute SourceFile

# ─── OkHttp (used by Supabase and Sentry HTTP transport) ──────────────────────
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# ─── MMKV (react-native-mmkv) ─────────────────────────────────────────────────
-keep class com.tencent.mmkv.** { *; }
-dontwarn com.tencent.mmkv.**

# ─── Reanimated ───────────────────────────────────────────────────────────────
-keep class com.swmansion.reanimated.** { *; }
-dontwarn com.swmansion.reanimated.**

# ─── Gesture Handler ──────────────────────────────────────────────────────────
-keep class com.swmansion.gesturehandler.** { *; }
-dontwarn com.swmansion.gesturehandler.**

# ─── Notifications ────────────────────────────────────────────────────────────
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# ─── App models — prevent obfuscation of data classes ─────────────────────────
# These are serialised to/from JSON (Supabase responses).
# Without this rule, R8 renames fields and breaks JSON parsing.
-keep class com.honeydo.app.** { *; }

# ─── Keep BuildConfig for FLAG_SECURE check in plugins/withAndroidFlagSecure ──
-keep class com.honeydo.app.BuildConfig { *; }

# ─── Kotlin ───────────────────────────────────────────────────────────────────
-keep class kotlin.** { *; }
-keep class kotlinx.** { *; }
-dontwarn kotlin.**
-dontwarn kotlinx.**

# ─── Serialisation / Reflection ───────────────────────────────────────────────
# Prevent stripping of classes accessed via reflection
-keepattributes Signature
-keepattributes Exceptions
-keepattributes InnerClasses
-keepattributes EnclosingMethod
