---
title: misty.env
order: 1
---

# misty.env

## What it's for

`misty.env` holds the few settings that belong to the server itself. The server's address comes from `MISTY_HOSTNAME`: the API answers at `https://MISTY_HOSTNAME/v1`, and the setup container points the Cloudflare Tunnel and DNS at that hostname.

Secrets never go in this file. On first boot the setup container generates one root secret into the stack's `secrets` volume, and derives every key from it, such as database passwords and signing keys ([Secrets](#/self-hosting/set-up-a-server)).

## The account you need

None. The hostname must be on a domain in your Cloudflare account ([cloudflare.env](#/env-files/cloudflare)).

## Values you set

| Variable | What it is | How to get it |
| --- | --- | --- |
| `MISTY_HOSTNAME` | The server's public hostname, such as `misty.example.com`. The API is `https://MISTY_HOSTNAME/v1`, and sign-in links name it in their link to `mistysys.com/setup`. | Pick a hostname on your Cloudflare domain. Write it without `https://` or a path. |
| `MISTY_INSTANCE_NAME` | The name devices show for this server. It defaults to `Misty`. Optional. | Any short name, such as `Home`. |
| `MISTY_ALLOWED_ORIGINS` | The `https://` origins of websites you run against this API, separated by commas. Optional. | Only needed if you run a website against this server. The app is always allowed. |
| `MISTY_ALLOWED_EMAILS` | The emails allowed on this server, separated by commas. When it's set, only those emails can sign up or sign in, and the owner can always sign in. Optional. | Leave it out to let in anyone with an account or an open invitation ([Accounts on your server](#/self-hosting/set-up-a-server)). |

## Get the values

1. Choose the hostname for your server on a domain in your Cloudflare account, such as `misty.example.com`.
2. Write it as `MISTY_HOSTNAME` into `misty.env` in your server's settings folder, `~/.misty/rel/<version>/.env/server/` ([The files](#/self-hosting/set-up-a-server)).
3. Add a name for the server if you want one.

```bash
# ~/.misty/rel/<version>/.env/server/misty.env
MISTY_HOSTNAME=misty.example.com
MISTY_INSTANCE_NAME=Home
```

The file lives in your server's own folder, outside every repository, so it never lands in Git.
