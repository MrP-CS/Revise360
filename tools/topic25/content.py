"""Original OCR J277 Topic 2.5 content. See curriculum audit in README.md."""
import json
from pathlib import Path
C=["#40c4ff","#aa6eeb","#ff785a","#ffa028","#50dc96","#f05aaa"]
LESSONS=json.loads((Path(__file__).with_name("content.json")).read_text())
