---
name: Always deploy after building
description: Push to production after finishing work - don't wait to be asked
type: feedback
---

Always push to production (git push origin main) after finishing building. Don't wait for user to ask.

**Why:** User wants changes live immediately, not sitting in local only.
**How to apply:** After committing, always push to origin/main so Vercel auto-deploys.
