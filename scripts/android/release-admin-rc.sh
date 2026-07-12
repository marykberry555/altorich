#!/usr/bin/env bash
# Admin RC release — generate TWA project (if needed) and produce signed APK/AAB via Gradle.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
exec bash "$ROOT/scripts/android/gradle-release-admin.sh"
