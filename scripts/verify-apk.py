"""Verify the installable preview artifact, not just checkout configuration."""
import json, os, subprocess, sys, zipfile
from pathlib import Path
root = Path(__file__).resolve().parents[1]
apk = Path(sys.argv[1]).resolve()
expected_url = json.loads((root / "eas.json").read_text())["build"]["preview"]["env"]["EXPO_PUBLIC_DEVICEOPS_API_URL"]
expected_name = json.loads((root / "app.json").read_text())["expo"]["name"]
sdk = Path(os.environ.get("ANDROID_HOME", "/home/usama/Android/Sdk"))
build_tools = sorted((sdk / "build-tools").iterdir())[-1]
subprocess.run([str(build_tools / "apksigner"), "verify", str(apk)], check=True)
with zipfile.ZipFile(apk) as archive:
    bundle = archive.read("assets/index.android.bundle")
    assert expected_url.encode() in bundle, "APK is missing the configured API URL"
    assert b"http://localhost:3000" not in bundle, "APK still contains the legacy API fallback"
    assert b"Agent Diagnostics" in bundle, "APK is missing the current diagnostic screen"
    assert b"Autonomous Operations & Incident Resolution" in bundle, "APK is missing current branding"
badging = subprocess.check_output([str(build_tools / "aapt"), "dump", "badging", str(apk)], text=True)
assert f"application-label:'{expected_name}'" in badging, "APK launcher label does not match app.json"
print(f"PASS signed APK: {expected_name}, {expected_url}, current diagnostics and branding")
