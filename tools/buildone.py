import sys, importlib
from kit import export
mod, name = sys.argv[1], sys.argv[2]
L = getattr(importlib.import_module(mod), name)
print(name, "marks:", export(L))
