---
title: google.env
order: 3
---

# google.env

## What it's for

People can sign in to your server with Google instead of an email and password. Google only confirms who they are: the server keeps an ordinary Misty account for them and never stores their Google tokens. An existing account is never linked to a Google sign-in just because the email address matches.

## The account you need

A Google Cloud project with an OAuth client. It's free.

## Values you set

| Variable | What it is | How to get it |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | Your OAuth client's ID. | Google Auth Platform → Clients, after you create a Web application client. |
| `GOOGLE_CLIENT_SECRET` | Your OAuth client's secret. It stays on the server. | Shown when you create the client, and on the client's page. |

## The redirect URI

Add `https://MISTY_HOSTNAME/v1/auth/google/callback` as an authorized redirect URI on the OAuth client. For `MISTY_HOSTNAME=misty.example.com`, it's `https://misty.example.com/v1/auth/google/callback`. A missing `/v1` or a trailing slash makes Google refuse the sign-in.

## Get the values

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a project for your server.
2. Open Google Auth Platform → Branding. Give the app a name, a support email and your domain as an authorized domain.
3. Under Audience, choose External. While the app is in testing, only the test users you add can sign in; publish it to let anyone sign in.
4. Under Data Access, add the `openid`, `email` and `profile` scopes.
5. Under Clients, create a client of type Web application. Add your redirect URI under Authorized redirect URIs.
6. Copy the client ID and client secret into `google.env` in your server's settings folder, `~/.misty/rel/<version>/.env/server/` ([The files](#/self-hosting/set-up-a-server)).

```bash
# ~/.misty/rel/<version>/.env/server/google.env
GOOGLE_CLIENT_ID=<your client ID>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your client secret>
```

The file lives in your server's own folder, outside every repository, so it never lands in Git.
