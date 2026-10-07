---
description: Add one API endpoint safely
---
1. Ask which role may call it and what data scope applies (own / assigned / department).
2. Add the rule to app/services if it is more than a query; keep the router thin.
3. Add the route with `require_roles(...)`; derive the user from the token; return 404 for out-of-scope rows.
4. Return camelCase JSON. Errors via HTTPException({code, message}).
5. Add tests: success, wrong role (403), no token (401), out-of-scope (404), bad input (422).
6. Run `python -m pytest -q`, then `python -m scripts.export_openapi`. Report files changed.
