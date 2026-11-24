---
title: cloudflare.env
order: 2
---

# cloudflare.env

## What it's for

Every Misty server runs on your own Cloudflare account. A Cloudflare Tunnel publishes the API at `https://MISTY_HOSTNAME` with no open ports. R2 holds the Space drive's files and the nightly backups. Live co-editing runs on your server, in its `misty-collab` service, not on Cloudflare.

You give the setup container one API token. It finds the zone that holds `MISTY_HOSTNAME` among the zones the token can see, and the account from the zone. On every start it creates whatever is missing and finds what it made before by name, so it never makes a second copy. You never run the `misty` CLI.

## The account you need

A Cloudflare account with your domain added as a zone. R2 must be turned on for the account, which asks for a payment method even within the free allowance.

## Values you set

| Variable | What it is | How to get it |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | An account API token with the permissions below. Only the setup container keeps it. | My Profile → API Tokens, or Manage Account → API Tokens. |
| `CLOUDFLARE_ZONE_ID` | The zone `MISTY_HOSTNAME` belongs to, when you'd rather name it than let setup find it. Older servers set it; setup checks it holds the hostname. Optional. | Your domain's Overview page, in the API section on the right. |
| `CLOUDFLARE_ACCOUNT_ID` | The account the zone must belong to. Set it only when the token can see the same domain in more than one account. Optional. | The same API section, below the zone ID. |

## API token permissions

Create an account API token with exactly these permissions, limited to your account and to the one zone your server uses.

| Scope | Permission | Why |
| --- | --- | --- |
| Account | Cloudflare Tunnel: Edit | Creates the tunnel and sets its route. |
| Account | Workers R2 Storage: Edit | Creates the two buckets and sets their CORS, lock and expiry rules. |
| Account | Account API Tokens: Edit | Creates the two bucket-scoped R2 tokens. |
| Zone (your zone) | Zone: Read | Finds the zone that holds your hostname, and its account. |
| Zone (your zone) | DNS: Edit | Points your hostname at the tunnel. |

## What the setup container makes

The tunnel's name comes from `MISTY_HOSTNAME`, with dots as dashes; a hostname longer than 40 characters is shortened. The buckets and tokens have fixed names, so one Cloudflare account holds one Misty server. A DNS record for your hostname that points anywhere else is yours, and setup stops without changing it. If Cloudflare can't be reached on a start whose settings already worked, setup logs a warning and the stack starts on what it recorded.

| Part | Name | What it does |
| --- | --- | --- |
| Tunnel | `misty-<host>` | Publishes the API with no open ports; `cloudflared` in the stack connects it. |
| DNS record | `MISTY_HOSTNAME` | A proxied CNAME to the tunnel. |
| Space drive bucket | `misty-space-drive` | Uploads, attachments, avatars, and images in notes. |
| Backup bucket | `misty-db-backups` | Encrypted nightly database dumps, under a 30-day lock. |
| Two R2 tokens | `misty space drive`, `misty db backups` | One bucket each; the API holds only the space drive one. |

## Get the values

1. Sign in at [dash.cloudflare.com](https://dash.cloudflare.com), add your domain and change its nameservers to the ones Cloudflare shows. Wait until the domain says Active.
2. Open R2 Object Storage and turn it on.
3. Create an account API token with the permissions above, limited to your account and zone. Copy it; Cloudflare shows it once.
4. Write the token into `~/.misty/.env/server/cloudflare.env`.

```bash
# ~/.misty/.env/server/cloudflare.env
CLOUDFLARE_API_TOKEN=<your API token>
```

Keep the file out of Git. Misty's `.gitignore` already ignores everything under `~/.misty/.env/server/`.
