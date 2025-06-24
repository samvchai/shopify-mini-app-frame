---
title: Quick Auth
description: Easily authenticate Farcaster users in your mini app
---

# Quick Auth

Quick Auth is a lightweight service built on top of Sign In with Farcaster that makes
it easy to get an authenticated session for a Farcaster user.


## Examples

- [Make authenticated requests](#make-authenticated-requests)
- [Use a session token directly](#use-a-session-token-directly)
- [Validate a session token](#validate-a-session-token)

### Make authenticated requests

In your frontend, use [`sdk.quickAuth.fetch`](/docs/sdk/quick-auth/fetch) to
make an authenticated request. This will automatically get a Quick Auth session
token if one is not already present and add it as Bearer token in the
`Authorization` header:

```tsx twoslash
const BACKEND_ORIGIN = 'https://hono-backend.miniapps.farcaster.xyz';

// ---cut---
import React, { useState, useEffect } from "react";
import { sdk } from "@farcaster/frame-sdk";

export function App() {
  const [user, setUser] = useState<{ fid: number }>();

  useEffect(() => {
    (async () => {
      const res = await sdk.quickAuth.fetch(`${BACKEND_ORIGIN}/me`);
      if (res.ok) {
        setUser(await res.json());
        sdk.actions.ready()
      }
    })()
  }, [])

  // The splash screen will be shown, don't worry about rendering yet.
  if (!user) {
    return null;
  }

  return (
    <div>
      hello, {user.fid}
    </div>
  )
}
```

The token must be [validated on your server](#validate-a-session-token).


### Use a session token directly

In your frontend, use
[`sdk.quickAuth.getToken`](/docs/sdk/quick-auth/get-token) to get a Quick Auth
session token. If there is already a session token in memory that hasn't
expired it will be immediately returned, otherwise a fresh one will be
acquired.

```html 
<div id="user" />

<script type="module">
  import ky from "https://esm.sh/ky";
  import { sdk } from "https://esm.sh/@farcaster/frame-sdk";

  const { token } = await sdk.quickAuth.getToken();
  const user = await ky.get("http://localhost:8787" + "/me", {headers: {Authorization: 'Bearer ' + token }}).json();
  document.getElementById("user").textContent = JSON.stringify(user);
</script>
```

The token must be [validated on your server](#validate-a-session-token).


### Validate a session token

First, install the Quick Auth library into your backend with:

```
npm install @farcaster/quick-auth
```

Then you can use `verifyJwt` to check the JWT and get back the token payload
which has the FID of the user as the `sub` property. 

You can then look up additional information about the user. 

```ts 
import { Errors, createClient } from '@farcaster/quick-auth'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'

const client = createClient()
const app = new Hono<{ Bindings: Cloudflare.Env }>()

// Resolve information about the authenticated Farcaster user. In practice
// you might get this information from your database, Neynar, or Snapchain.
async function resolveUser(fid: number) {
  const primaryAddress = await (async () => {
    const res = await fetch(
      `https://api.farcaster.xyz/fc/primary-address?fid=${fid}&protocol=ethereum`,
    )
    if (res.ok) {
      const { result } = await res.json<{
        result: {
          address: {
            fid: number
            protocol: 'ethereum' | 'solana'
            address: string
          }
        }
      }>()

      return result.address.address
    }
  })()

  return {
    fid,
    primaryAddress,
  }
}

const quickAuthMiddleware = createMiddleware<{
  Bindings: Cloudflare.Env
  Variables: {
    user: {
      fid: number
      primaryAddress?: string
    }
  }
}>(async (c, next) => {
  const authorization = c.req.header('Authorization')
  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing token' })
  }

  try {
    const payload = await client.verifyJwt({
      token: authorization.split(' ')[1] as string,
      domain: c.env.HOSTNAME,
    })

    const user = await resolveUser(payload.sub)
    c.set('user', user)
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      console.info('Invalid token:', e.message)
      throw new HTTPException(401, { message: 'Invalid token' })
    }

    throw e
  }

  await next()
})

app.use(cors())

app.get('/me', quickAuthMiddleware, (c) => {
  return c.json(c.get('user'))
})

export default app
```


## Optimizing performance

To optimize performance, provide a `preconnect` hint to the browser in your
frontend so that it can preemptively initiate a connection with the Quick Auth
Server:

```html
<link rel="preconnect" href="https://auth.farcaster.xyz" />
```

Or if you're using React:

```ts
import { preconnect } from 'react-dom';

function AppRoot() {
  preconnect("https://auth.farcaster.xyz");
}
```

## Quick Auth vs Sign In with Farcaster

[Sign In with
Farcaster](https://github.com/farcasterxyz/protocol/discussions/110) is the
foundational standard that allows Farcaster users to authenticate into
applications.

[Farcaster Quick
Server](https://github.com/farcasterxyz/protocol/discussions/231) is an
optional service built on top of SIWF that is highly performant and easy to
integrate. Developers don't need to worry about securely generating and
consuming nonces or the nuances of verifying a SIWF message—instead they
receive a signed JWT that can be used as a session token to authenticate their
server.

The Auth Server offers exceptional performance in two ways:
- the service is deployed on the edge so nonce generation and verification
  happens close to your users no matter where they are located
- the issued tokens are asymmetrically signed so they can be verified locally
  on your server


## Functions

| Name                                       | Description                         |
|--------------------------------------------|-------------------------------------|
| [getToken](/docs/sdk/quick-auth/get-token) | Gets a signed Quick Auth token      | 
| [fetch](/docs/sdk/quick-auth/fetch)        | Make an authenticated fetch request |


## Properties

| Name                                | Description                             |
|-------------------------------------|-----------------------------------------|
| [token](/docs/sdk/quick-auth/token) | Returns an active token if present      | 


