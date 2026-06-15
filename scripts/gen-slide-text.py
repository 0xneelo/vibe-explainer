#!/usr/bin/env python3
"""Regenerate assets/slide-text.json from the default slide-text registry.

The registry lives in src/core/vibe-slide-text.jsx as a strict-JSON object
between the ST-DEFAULTS markers. Run this after adding/removing keys there to
refresh the published baseline (then commit the result). Editors normally
replace the file via the admin "Slides" panel's Download .json instead.
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "core" / "vibe-slide-text.jsx"
OUT = ROOT / "assets" / "slide-text.json"


def read_defaults():
    m = re.search(r"/\*ST-DEFAULTS-BEGIN\*/(.*?)/\*ST-DEFAULTS-END\*/",
                  SRC.read_text(encoding="utf-8"), re.S)
    if not m:
        sys.exit(f"ERROR: ST-DEFAULTS markers not found in {SRC.relative_to(ROOT)}")
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError as e:
        sys.exit(f"ERROR: defaults block in {SRC.relative_to(ROOT)} is not valid JSON: {e}")


def main():
    texts = read_defaults()
    data = {"format": "vibe-slide-text", "version": 1, "texts": texts}
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)} — {len(texts)} keys")


if __name__ == "__main__":
    main()
