"""Create ytmusicapi browser auth from a Chrome/Edge "Copy as cURL" export.

Usage:
    python import_ytmusic_curl.py ytmusic_curl.txt

Paste the copied cURL command into ytmusic_curl.txt locally. Do not share that
file: it contains live Google session cookies.
"""

from __future__ import annotations

import shlex
import sys
from pathlib import Path

import re

from ytmusicapi.auth.browser import setup_browser


REQUIRED_HEADERS = {"authorization", "cookie", "x-goog-authuser"}


def main() -> int:
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("ytmusic_curl.txt")
    output = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("browser.json")

    if not source.exists():
        print(f"Missing input file: {source}")
        print("Create it locally, paste Chrome/Edge 'Copy as cURL' into it, then run again.")
        return 1

    text = source.read_text(encoding="utf-8").strip()
    if not text:
        print(f"{source} is empty.")
        return 1

    headers_raw = extract_headers(text)
    present = {
        line.split(":", 1)[0].strip().lower()
        for line in headers_raw.splitlines()
        if ":" in line
    }
    missing = REQUIRED_HEADERS - present
    if missing:
        print("Could not find required auth headers: " + ", ".join(sorted(missing)))
        print("Use a logged-in music.youtube.com /browse request and copy it as cURL.")
        return 1

    setup_browser(output.as_posix(), headers_raw)
    print(f"Wrote {output.resolve()}")
    print("Restart the backend, or wait a few seconds for the auth file watcher.")
    return 0


def extract_headers(text: str) -> str:
    """Return raw header lines accepted by ytmusicapi's browser setup."""
    if "Invoke-WebRequest" in text or "WebRequestSession" in text:
        return extract_powershell_headers(text)

    if not text.lstrip().startswith("curl"):
        return text

    normalized = text.replace("`", "\\")
    args = shlex.split(normalized, posix=True)
    lines: list[str] = []
    cookie = ""

    i = 0
    while i < len(args):
        arg = args[i]
        value = ""

        if arg in {"-H", "--header"} and i + 1 < len(args):
            value = args[i + 1]
            i += 1
        elif arg.startswith("-H") and len(arg) > 2:
            value = arg[2:]
        elif arg.startswith("--header="):
            value = arg.split("=", 1)[1]
        elif arg in {"-b", "--cookie", "--cookie-jar"} and i + 1 < len(args):
            cookie = args[i + 1]
            i += 1
        elif arg.startswith("-b") and len(arg) > 2:
            cookie = arg[2:]
        elif arg.startswith("--cookie="):
            cookie = arg.split("=", 1)[1]

        if value and ":" in value:
            lines.append(value)
        i += 1

    if cookie and not any(line.lower().startswith("cookie:") for line in lines):
        lines.append(f"cookie: {cookie}")

    return "\n".join(lines)


def extract_powershell_headers(text: str) -> str:
    """Extract headers from Chrome/Edge's PowerShell Invoke-WebRequest export."""
    headers: dict[str, str] = {}

    for key, value in re.findall(r"""["']([^"']+)["']\s*=\s*["']([^"']*)["']""", text):
        headers[key.lower()] = value

    for key, value in re.findall(
        r"""\.Add\(\s*["']([^"']+)["']\s*,\s*["']([^"']*)["']\s*\)""",
        text,
    ):
        headers[key.lower()] = value

    user_agent = re.search(r"""\.UserAgent\s*=\s*["']([^"']+)["']""", text)
    if user_agent and "user-agent" not in headers:
        headers["user-agent"] = user_agent.group(1)

    cookies = re.findall(
        r"""System\.Net\.Cookie\(\s*["']([^"']+)["']\s*,\s*["']([^"']*)["']""",
        text,
    )
    if cookies and "cookie" not in headers:
        headers["cookie"] = "; ".join(f"{name}={value}" for name, value in cookies)

    return "\n".join(f"{key}: {value}" for key, value in headers.items())


if __name__ == "__main__":
    raise SystemExit(main())
