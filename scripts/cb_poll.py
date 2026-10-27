#!/usr/bin/env python3
"""CodeBuddy CLI login token poller.

Polls https://www.codebuddy.ai/v2/plugin/auth/token?state=<uuid> until a token
is issued. On capture: writes the raw token to /home/z/.secrets with 0600.
NEVER prints the token value — only masked status lines.

Usage: cb_poll.py <state-uuid> <max-seconds>
Exit codes: 0 = token captured, 2 = still pending at timeout, 1 = unknown status.
"""
import json
import os
import sys
import time
import urllib.request

STATE = sys.argv[1] if len(sys.argv) > 1 else ""
MAX_SECONDS = int(sys.argv[2]) if len(sys.argv) > 2 else 150
URL = f"https://www.codebuddy.ai/v2/plugin/auth/token?state={STATE}"
SECRETS = "/home/z/.secrets"
PENDING_CODE = 11217  # "login ing..."

def find_token(obj):
    """Recursively find a token-like string value."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            kl = k.lower()
            if isinstance(v, str) and len(v) > 100 and ("token" in kl or "key" in kl or "access" in kl):
                return k, v
            got = find_token(v)
            if got:
                return got
    elif isinstance(obj, list):
        for item in obj:
            got = find_token(item)
            if got:
                return got
    return None

def masked(obj):
    if isinstance(obj, dict):
        return {k: masked(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [masked(x) for x in obj]
    if isinstance(obj, str) and len(obj) > 40:
        return obj[:10] + "..MASKED(len=" + str(len(obj)) + ")"
    return obj

deadline = time.time() + MAX_SECONDS
attempt = 0
while time.time() < deadline:
    attempt += 1
    try:
        req = urllib.request.Request(URL, headers={"User-Agent": "codebuddy-cli/2.177.0"})
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8", errors="replace"))
    except Exception as exc:
        print(f"[{attempt}] poll error: {exc}", flush=True)
        time.sleep(12)
        continue
    code = data.get("code")
    if code == PENDING_CODE:
        print(f"[{attempt}] pending: code={code} msg={data.get('msg')!r}", flush=True)
        time.sleep(12)
        continue
    hit = find_token(data)
    if hit:
        field, token = hit
        with open(SECRETS, "w") as fh:
            fh.write(token + "\n")
        os.chmod(SECRETS, 0o600)
        print(f"TOKEN CAPTURED field={field} len={len(token)} -> {SECRETS} (0600)", flush=True)
        sys.exit(0)
    print(f"[{attempt}] non-pending status: {json.dumps(masked(data))[:600]}", flush=True)
    sys.exit(1)

print(f"POLL TIMEOUT after {attempt} attempts / {MAX_SECONDS}s — state still pending", flush=True)
sys.exit(2)
