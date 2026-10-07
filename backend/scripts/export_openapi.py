"""Write docs/openapi.json (the full API description) from the running code."""
import json
from pathlib import Path

from app.main import app

if __name__ == "__main__":
    Path("docs").mkdir(exist_ok=True)
    Path("docs/openapi.json").write_text(json.dumps(app.openapi(), indent=2))
    print("Wrote docs/openapi.json")
