#!/usr/bin/env python3
"""Exécute du SQL brut sur Supabase via la Management API (projet yqioyfuxviiximembver)."""
import json
import sys
import urllib.request

PROJECT_REF = "yqioyfuxviiximembver"
PAT_PATH = "/workspace/chat-flow-templates-main/.supabase-pat"


def run(sql: str):
    with open(PAT_PATH) as f:
        pat = f.read().strip()
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query",
        data=json.dumps({"query": sql}).encode(),
        headers={
            "Authorization": f"Bearer {pat}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read().decode()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return raw


if __name__ == "__main__":
    sql = sys.stdin.read()
    try:
        result = run(sql)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode()}", file=sys.stderr)
        sys.exit(1)
