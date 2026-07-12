#!/usr/bin/env bash
# Sign and assemble Admin TWA via Gradle (no Bubblewrap password prompts).
# Expects ANDROID_KEYSTORE_PASSWORD, JAVA_HOME, ANDROID_HOME.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ADMIN="$ROOT/android/admin"
KEYSTORE="$ROOT/android/signing-key.jks"
ALIAS="altorich-admin"
PASS_FILE="$ROOT/android/.keystore-password"
OUTPUT="$ROOT/android/output/admin"
PUBLIC_DL="$ROOT/public/downloads"
META_FILE="$PUBLIC_DL/admin-release.json"

export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home}"
export PATH="$JAVA_HOME/bin:${PATH:-}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"

if [[ -n "${ANDROID_KEYSTORE_PASSWORD:-}" ]]; then
  PASS="$ANDROID_KEYSTORE_PASSWORD"
elif [[ -f "$PASS_FILE" ]]; then
  PASS="$(tr -d '\n' < "$PASS_FILE")"
else
  echo "ERROR: missing keystore password" >&2
  exit 1
fi

if [[ ! -d "$ADMIN/app" ]]; then
  echo "==> Generating Android project"
  node "$ROOT/scripts/android/generate-admin-twa.mjs"
fi

# Inject signing config into app/build.gradle if missing
GRADLE_APP="$ADMIN/app/build.gradle"
if ! grep -q "signingConfigs" "$GRADLE_APP"; then
  echo "==> Injecting Gradle signingConfigs"
  python3 - <<'PY'
from pathlib import Path
path = Path("/Users/stanlex/Documents/AltoWealth/android/admin/app/build.gradle")
text = path.read_text()
needle = "    buildTypes {\n        release {\n            minifyEnabled true\n        }\n    }"
replacement = """    signingConfigs {
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_FILE") ?: "../signing-key.jks")
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS") ?: "altorich-admin"
            keyPassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
        }
    }
    buildTypes {
        release {
            minifyEnabled true
            signingConfig signingConfigs.release
        }
    }"""
if needle not in text:
    raise SystemExit("Could not locate buildTypes block to inject signingConfigs")
path.write_text(text.replace(needle, replacement, 1))
print("signingConfigs injected")
PY
fi

# Ensure local.properties has sdk.dir
printf 'sdk.dir=%s\n' "$ANDROID_HOME" > "$ADMIN/local.properties"

export ANDROID_KEYSTORE_PASSWORD="$PASS"
export ANDROID_KEYSTORE_FILE="$KEYSTORE"
export ANDROID_KEY_ALIAS="$ALIAS"

cd "$ADMIN"
chmod +x ./gradlew

echo "==> Gradle assembleRelease + bundleRelease"
./gradlew --no-daemon assembleRelease bundleRelease

APK_SRC="$(find "$ADMIN/app/build/outputs/apk" -name '*.apk' | head -1)"
AAB_SRC="$(find "$ADMIN/app/build/outputs/bundle" -name '*.aab' | head -1 || true)"

if [[ -z "${APK_SRC:-}" || ! -f "$APK_SRC" ]]; then
  echo "ERROR: APK not produced" >&2
  find "$ADMIN/app/build/outputs" -type f | head -50 || true
  exit 1
fi

mkdir -p "$OUTPUT" "$PUBLIC_DL"
cp "$APK_SRC" "$OUTPUT/altorich-admin-release.apk"
cp "$APK_SRC" "$PUBLIC_DL/altorich-admin-release.apk"
echo "APK: $PUBLIC_DL/altorich-admin-release.apk ($(wc -c < "$PUBLIC_DL/altorich-admin-release.apk" | tr -d ' ') bytes)"

if [[ -n "${AAB_SRC:-}" && -f "$AAB_SRC" ]]; then
  cp "$AAB_SRC" "$OUTPUT/altorich-admin-release.aab"
  cp "$AAB_SRC" "$PUBLIC_DL/altorich-admin-release.aab"
  echo "AAB: $PUBLIC_DL/altorich-admin-release.aab ($(wc -c < "$PUBLIC_DL/altorich-admin-release.aab" | tr -d ' ') bytes)"
fi

SHA256="$(keytool -list -v -keystore "$KEYSTORE" -alias "$ALIAS" -storepass "$PASS" 2>/dev/null \
  | awk -F' ' '/SHA256:/{print $2; exit}')"

# Refresh assetlinks
node <<EOF
const fs = require("fs");
const path = "$ROOT/public/.well-known/assetlinks.json";
const sha = "$SHA256";
fs.writeFileSync(path, JSON.stringify([
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "com.altorich.app",
      sha256_cert_fingerprints: [
        "REPLACE_WITH_RELEASE_KEY_SHA256_FINGERPRINT",
        "REPLACE_WITH_DEBUG_KEY_SHA256_FINGERPRINT"
      ]
    }
  },
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "com.altorich.admin",
      sha256_cert_fingerprints: [sha]
    }
  }
], null, 2) + "\\n");
EOF

APK_SIZE="$(wc -c < "$PUBLIC_DL/altorich-admin-release.apk" | tr -d ' ')"
AAB_SIZE="0"
[[ -f "$PUBLIC_DL/altorich-admin-release.aab" ]] && AAB_SIZE="$(wc -c < "$PUBLIC_DL/altorich-admin-release.aab" | tr -d ' ')"
VERSION_NAME="$(node -e "const m=require('$ADMIN/twa-manifest.json');console.log(m.appVersionName||m.appVersion||'1.0.0')")"
VERSION_CODE="$(node -e "const m=require('$ADMIN/twa-manifest.json');console.log(m.appVersionCode||1)")"
RELEASE_DATE="$(date -u +%Y-%m-%d)"
BUILD_ID="$(cat "$ROOT/.next/BUILD_ID" 2>/dev/null || echo rc1-local)"

node <<EOF
const fs = require("fs");
const meta = {
  packageId: "com.altorich.admin",
  name: "Alto Rich Admin",
  versionName: "$VERSION_NAME",
  versionCode: Number("$VERSION_CODE"),
  buildNumber: Number("$VERSION_CODE"),
  releaseDate: "$RELEASE_DATE",
  buildId: "$BUILD_ID",
  minSdkVersion: 21,
  minAndroid: "5.0 (API 21)",
  apkFile: "/downloads/altorich-admin-release.apk",
  aabFile: $([ -f "$PUBLIC_DL/altorich-admin-release.aab" ] && echo '"/downloads/altorich-admin-release.aab"' || echo 'null'),
  apkBytes: Number("$APK_SIZE"),
  aabBytes: Number("$AAB_SIZE"),
  sha256CertFingerprint: "$SHA256",
  updatedAt: new Date().toISOString()
};
fs.writeFileSync("$META_FILE", JSON.stringify(meta, null, 2) + "\\n");
console.log(JSON.stringify(meta, null, 2));
EOF

echo "==> Signed Admin APK/AAB published"
echo "SHA256: $SHA256"
