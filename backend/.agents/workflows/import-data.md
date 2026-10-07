---
description: Import a new student sheet
---
1. Put the file in private_data/ (never commit it).
2. `python -m scripts.import_students private_data/<file>.xlsx --dry-run`; fix every listed row in the sheet.
3. Run again without --dry-run. Report created/updated counts and any warnings. Do not print student data.
