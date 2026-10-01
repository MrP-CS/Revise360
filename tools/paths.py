"""Where everything lives.

The build scripts used to hard-code absolute paths from the machine they were
written on. They now resolve from here instead, so a fresh checkout works.

  R360_SITE    the site being built into   (default: the repo root above tools/)
  R360_OUT     where finished files land   (default: <repo>/build)

Both may be overridden by environment variable.
"""
import os
import pathlib

TOOLS = pathlib.Path(__file__).resolve().parent
REPO = TOOLS.parent

SITE = pathlib.Path(os.environ.get("R360_SITE", REPO))
OUT = pathlib.Path(os.environ.get("R360_OUT", REPO / "build"))
OUT.mkdir(parents=True, exist_ok=True)

# Convenience strings, because most of the scripts concatenate rather than join.
SITE_S = str(SITE).rstrip("/") + "/"
OUT_S = str(OUT).rstrip("/") + "/"

EXPERIENCES = SITE / "experiences"
IMG = EXPERIENCES / "img"
WORKSHEETS = SITE / "worksheets"
ANSWERS = SITE / "answers"
PRESENTATIONS = SITE / "presentations"

# The world-map outline used only by the 1.3 zoom-out scene. Not in the repo
# because of its size; set R360_LAND or drop land.geojson beside this file.
LAND = pathlib.Path(os.environ.get("R360_LAND", TOOLS / "land.geojson"))
