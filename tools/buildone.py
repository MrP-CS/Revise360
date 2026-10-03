"""Build one lesson from its source module.

  python3 buildone.py specs12b L7            # artwork and scene JSON
  python3 buildone.py specs12b L7 --tasks    # scene JSON only, no render

Use --tasks when only the activities changed. The walls are painted into the
artwork, so a change to a station name, a bullet or the challenge needs a full
build; an activity does not.
"""
import sys, importlib
from kit import export
mod, name = sys.argv[1], sys.argv[2]
images = "--tasks" not in sys.argv
L = getattr(importlib.import_module(mod), name)
print(name, "marks:", export(L, images=images), "(artwork rebuilt)" if images else "(scene JSON only)")
