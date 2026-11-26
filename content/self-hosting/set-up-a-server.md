---
title: Set up a server
order: 1
---

# Set up a server

This guide sets up your own Misty server. A server is one Compose file and three env files. A setup container does the rest each time it starts.

## What you need

- An always-on Linux or macOS computer, such as a VPS, with Docker Engine and Compose v2. Two CPU cores and 2 GB of memory are enough for a small team. Agents run on each person's computer, not the server.
- Git, to get the code.
- A domain on Cloudflare.
- A Google Cloud account.

## HTTPS only

The Misty app only connects to servers on an https domain. Plain http, IP addresses, localhost and private addresses won't work.

## The files

All your settings live in three files, one per service, in your server's settings folder. Each file is plain `NAME=value` lines.

That folder is `.env/server/` inside the folder `~/.misty/misty.conf` names, one for the version you run, such as `~/.misty/rel/1.0.0`. Nothing but `misty.conf` and those folders sits in `~/.misty` itself.

```bash
~/.misty/
├── misty.conf          # misty.root = ~/.misty/rel/1.0.0
└── rel/1.0.0/.env/server/
    ├── misty.env
    ├── cloudflare.env
    └── google.env
```

Compose can't read `misty.conf`, so it takes the folder from `MISTY_ENV_DIR`, and won't start without it. Every `docker compose` command on this page needs it, so export it in your shell's profile.

| File | What it's for | Page |
| --- | --- | --- |
| `misty.env` | The server's own settings: its hostname, its name, the websites allowed to call it and who may sign in. | [Set up misty.env](#/env-files/misty) |
| `cloudflare.env` | Publishes the server over HTTPS and stores files and backups in R2. | [Set up cloudflare.env](#/env-files/cloudflare) |
| `google.env` | Lets people sign in to your server with their Google account. | [Set up google.env](#/env-files/google) |

> The repository has no example env files. Write each file yourself, using the pages above.

## Email (optional)

Without email, Misty gives you links to send to people yourself. With email, the server sends sign-in links, space invitations and email confirmations for you.

1. In Mailjet, verify the address you'll send from, with its SPF and DKIM records.
2. Create `mailjet.env` in your settings folder with `MAILJET_API_KEY`, `MAILJET_SECRET_KEY` and `MAILJET_FROM_EMAIL`. You can also set `MAILJET_FROM_NAME`.
3. Restart the API with `docker compose up -d api`.

## Voice and video calls (optional)

Calls in direct messages and a Space's voice channels run through LiveKit on your server. They are end-to-end encrypted between people's computers, so neither your server nor LiveKit can hear or see them, and nothing of a call is kept. A call holds at most 8 people.

1. Add `MISTY_CALLS=1` to `misty.env` in your settings folder.
2. Open these ports on the server to the internet: UDP `3478` and `50000-50100`, and TCP `7881`. Calls carry their sound and video straight to the server, not through Cloudflare.
3. Start the stack with calls: `docker compose --profile calls up -d`.

Setup derives LiveKit's key from the root secret, and the API forwards calls signalling from `https://MISTY_HOSTNAME/v1/calls`, so calls need no hostname of their own. The app shows call buttons once the server answers that calls are on.

## Install

1. Clone misty-server, create your settings folder, readable only by you, and name its root in `~/.misty/misty.conf`.
2. Write the three env files. Each file's page lists its values.
3. Start the stack. The first start builds the images and takes a few minutes.
4. Check the setup container's log. When the tunnel connects, `https://MISTY_HOSTNAME/health` answers.
5. Open the Misty app, select **Use my own server** and enter your address. Then create the first account, which owns the server. See [Connect to a server](#/getting-started/connect).

```bash
git clone https://github.com/misty-org/misty-server.git
cd misty-server
root=~/.misty/rel/1.0.0   # the version you run
mkdir -p -m 700 "$root/.env/server"
[ -e ~/.misty/misty.conf ] || printf '[metadata]\nmisty.manifest = v1\nmisty.root = %s\n' "$root" > ~/.misty/misty.conf
export MISTY_ENV_DIR="$root/.env/server"
# write the three files in $MISTY_ENV_DIR
docker compose up -d --build
docker compose ps
docker compose logs setup
```

## What runs

| Service | Runs | What it does |
| --- | --- | --- |
| `setup` | Once per start | Generates the root secret, checks it against your data, provisions Cloudflare. |
| `postgres` | Always | The database (PostgreSQL with pgvector). |
| `migrate` | Once per start | Applies database migrations. |
| `api` | Always | Accounts, spaces, chat, files and the apps each space adds, and live co-editing: the rooms at `/v1/collab` where people and agents edit apps' documents and files together. |
| `cloudflared` | Always | Publishes the API at `https://MISTY_HOSTNAME` through the Tunnel. |
| `backups` | Always | Encrypted database backups to R2 every night at 03:00 UTC. |
| `alerts` | Always | Records an alert when the API fails its health check, fails 5% of requests, runs low on disk or misses a backup. The owner's app shows it. Nothing is emailed. |

The tunnel sends your hostname to the API and nothing else: the rooms and calls signalling are paths on it, so live co-editing and calls need nothing more on Cloudflare.

## The setup container

On the first start, the setup container:

- Generates one root secret into the stack's `secrets` volume.
- Finds your Cloudflare zone and account from `MISTY_HOSTNAME`.
- Creates the Cloudflare Tunnel, the DNS record, two R2 buckets and their credentials.

Later starts find the same resources by name and never replace the root secret. Rotating a key never touches data. Your data is only removed if you run `docker compose down --volumes` and delete the R2 buckets.

## Secrets

The server has one secret of its own, `MISTY_SERVER_SECRET`, in the `secrets` volume. Setup derives every key from it: database passwords, signing keys, the operator and metrics tokens and the backup key. The API gets only its own share. None of them are in the env files.

If you lose the volume but keep the database, setup stops with `secrets lost`. New keys would sign everyone out and make encrypted data unreadable.

Keep an encrypted copy somewhere other than the server, such as a password manager:

```bash
docker compose run --rm --no-deps --entrypoint tar setup -C /run/misty/secrets -czf - . > misty-secrets.tgz
```

Each key has a version. To rotate one, move it to its next version, restart, and retire the old version once old sessions have expired:

```bash
docker compose run --rm setup rotate MISTY_AUTH_SIGNING_KEY
docker compose up -d --force-recreate
docker compose run --rm setup retire MISTY_AUTH_SIGNING_KEY
```

| Rotates | With |
| --- | --- |
| `MISTY_AUTH_SIGNING_KEY`, `MISTY_OPERATOR_TOKEN` | The old value stays valid in its `*_PREVIOUS` slot until you retire it. |
| `DB_MIGRATION_PASSWORD` | The next start moves the database onto the new password. Retire the old one after that. |
| `DB_PASSWORD`, `MISTY_METRICS_TOKEN` | Nothing: the next start applies the new value everywhere. |

Keys that protect stored data can't be rotated. These are the Space link key (`SPACE_LINK_ENCRYPTION_KEY`) and the backup key (`MISTY_BACKUP_AGE_IDENTITY`).

To give a service you run beside the server its operator token, run `docker compose run --rm setup operator-token`, or mount the `secrets` volume and read `operator/token`. To keep a copy of the backup key, run `docker compose run --rm setup backup-key`.

## Servers set up before the root secret

A server set up before the root secret keeps each key on its own. It keeps working after an upgrade, and nobody is signed out. To move its keys onto the root secret:

```bash
docker compose run --rm setup adopt-root
docker compose up -d --force-recreate
```

Each moved key keeps its old value valid in its `*_PREVIOUS` slot. Retire each one once old sessions have expired. The two keys that protect stored data stay as they are. To move them too, add `--discard-data`, which makes shared links and older backups unreadable. Only use it on a server with no data you need.

`CLOUDFLARE_ZONE_ID` and `CLOUDFLARE_ACCOUNT_ID` can stay in `cloudflare.env`. `MISTY_SERVER_VERSION` in `misty.env` is no longer read, because published images report their own commit. When you build on the server, run `MISTY_SERVER_VERSION=$(git rev-parse HEAD) docker compose up -d --build`.

## Accounts on your server

- The first account created on a new server owns it.
- After that, people can sign up only with an open space invitation, or when you create their account with the operator API.
- To allow only certain people, set `MISTY_ALLOWED_EMAILS` in misty.env to a comma-separated list. The owner can always sign in.
- People sign in with an email and password stored on your server, or with Google through your own `google.env`.

To let someone in, or back in after a forgotten password:

1. On the server, find their account and ask for a new sign-in link with the operator API, which listens on `127.0.0.1:8081`:

   ```sh
   token=$(docker compose run --rm setup operator-token)
   curl -s -H "Authorization: Bearer $token" "http://127.0.0.1:8081/operator/v1/accounts?email=ana@example.com"
   curl -s -X POST -H "Authorization: Bearer $token" "http://127.0.0.1:8081/operator/v1/accounts/ACCOUNT_ID/setup-key"
   ```

2. Send them the `setup_link` from the answer. With email set up, the server sends it for you.

To create an account, `POST /operator/v1/accounts` with their email.
