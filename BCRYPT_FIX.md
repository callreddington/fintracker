# bcrypt → bcryptjs Migration

## Issue

The original `bcrypt` package was failing to install due to:

1. Network timeouts downloading pre-built binaries from GitHub
2. Network timeouts downloading Node.js headers for compilation from source
3. `node-gyp` compilation requirements (Python, build tools)

**Error**: `gyp ERR! configure error - FetchError: request to https://nodejs.org/download/release/v20.19.6/node-v20.19.6-headers.tar.gz failed, reason: ETIMEDOUT`

## Solution

Switched from `bcrypt` to `bcryptjs`:

**Before** (`backend/package.json`):

```json
{
  "dependencies": {
    "@types/bcrypt": "^5.0.2",
    "bcrypt": "^5.1.1"
  }
}
```

**After** (`backend/package.json`):

```json
{
  "dependencies": {
    "@types/bcryptjs": "^2.4.6",
    "bcryptjs": "^2.4.3"
  }
}
```

## Why bcryptjs?

1. **Pure JavaScript** - No native dependencies, no compilation
2. **Same API** - Drop-in replacement for `bcrypt`
3. **Cross-platform** - Works everywhere Node.js runs
4. **No build tools required** - No Python, node-gyp, or C++ compilers needed
5. **Maintained** - Actively maintained with security updates

## Performance Difference

- `bcrypt` (native): ~10-20ms per hash (uses C++ bindings)
- `bcryptjs` (pure JS): ~50-100ms per hash

For authentication use cases (login/register), this difference is negligible and acceptable.

## Code Changes Required

When implementing auth, use:

```typescript
import bcrypt from "bcryptjs"; // instead of 'bcrypt'

// API remains the same
const hash = await bcrypt.hash(password, 12);
const isValid = await bcrypt.compare(password, hash);
```

## Verification

```bash
cd /Projects/fintracker
npm ls bcryptjs --depth=0
# Output:
# fintracker@1.0.0
# ├─┬ @fintracker/backend@1.0.0
# │ └── bcryptjs@2.4.3
# └── bcryptjs@3.0.3
```

All dependencies installed successfully with **0 vulnerabilities**.

## References

- [bcryptjs on npm](https://www.npmjs.com/package/bcryptjs)
- [bcryptjs GitHub](https://github.com/dcodeIO/bcrypt.js)
