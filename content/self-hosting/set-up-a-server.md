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

All your settings live in three files in `~/.misty/.env/server/`, one per service. Each file is plain `NAME=value` lines.

```bash
~/.misty/.env/server/
├── misty.env
├── cloudflare.env
└── google.env
```

| File | What it's for | Page |
| --- | --- | --- |
| `misty.env` | The server's own settings: its hostname, its name, the websites allowed to call it and who may sign in. | [Set up misty.env](#/env-files/misty) |
| `cloudflare.env` | Publishes the server over HTTPS, stores files and backups in R2 and runs Misty's Worker. | [Set up cloudflare.env](#/env-files/cloudflare) |
| `google.env` | Lets people sign in to your server with their Google account. | [Set up google.env](#/env-files/google) |

> The repository has no example env files. Write each file yourself, using the pages above.

## Email (optional)

Without email, Misty gives you links to send to people yourself. With email, the server sends sign-in links, space invitations and email confirmations for you.

1. In Mailjet, verify the address you'll send from, with its SPF and DKIM records.
2. Create `~/.misty/.env/server/mailjet.env` with `MAILJET_API_KEY`, `MAILJET_SECRET_KEY` and `MAILJET_FROM_EMAIL`. You can also set `MAILJET_FROM_NAME`.
3. Restart the API with `docker compose up -d api`.

## Voice and video calls (optional)

Calls in direct messages and a Space's voice channels run through LiveKit on your server. They are end-to-end encrypted between people's computers, so neither your server nor LiveKit can hear or see them, and nothing of a call is kept. A call holds at most 8 people.

1. Add `MISTY_CALLS=1` to `~/.misty/.env/server/misty.env`.
2. Open these ports on the server to the internet: UDP `3478` and `50000-50100`, and TCP `7881`. Calls carry their sound and video straight to the server, not through Cloudflare.
3. Start the stack with calls: `docker compose --profile calls up -d`.

Setup derives LiveKit's key from the root secret and publishes LiveKit's signalling through your tunnel, at a sibling of your hostname: `misty-calls.example.com` beside `misty.example.com`. The app shows call buttons once the server answers that calls are on.

## Install

1. Clone misty-server and create `~/.misty/.env/server/`, readable only by you.
2. Write the three env files. Each file's page lists its values.
3. Start the stack. The first start builds the images and takes a few minutes.
4. Check the setup container's log. When the tunnel connects, `https://MISTY_HOSTNAME/health` answers.
5. Open the Misty app, select **Use my own server** and enter your address. Then create the first account, which owns the server. See [Connect to a server](#/getting-started/connect).

```bash
git clone https://github.com/misty-org/misty-server.git
cd misty-server
mkdir -p -m 700 ~/.misty/.env/server
# write the three files under ~/.misty/.env/server/
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
| `api` | Always | Accounts, spaces, chat, files and the apps each space adds. |
| `cloudflared` | Always | Publishes the API at `https://MISTY_HOSTNAME` through the Tunnel. |
| `backups` | Always | Encrypted database backups to R2 every night at 03:00 UTC. |
| `alerts` | Always | Records an alert when the API fails its health check, fails 5% of requests, runs low on disk or misses a backup. The console and the owner's app show it. Nothing is emailed. |
| `console` | Always, on `127.0.0.1:7070` only | The operator console. |

A Cloudflare Worker also runs on your Cloudflare account. The setup container deploys it for you. See [cloudflare.env](#/env-files/cloudflare).

## The setup container

On the first start, the setup container:

- Generates one root secret into the stack's `secrets` volume.
- Finds your Cloudflare zone and account from `MISTY_HOSTNAME`.
- Creates the Cloudflare Tunnel, the DNS record, two R2 buckets and their credentials.
- Deploys the Worker.

Later starts find the same resources by name and never replace the root secret. Rotating a key never touches data. Your data is only removed if you run `docker compose down --volumes` and delete the R2 buckets.

## Secrets

The server has one secret of its own, `MISTY_SERVER_SECRET`, in the `secrets` volume. Setup derives every key from it: database passwords, signing keys, collaboration keys, the operator and metrics tokens and the backup key. The API gets only its own share, and the Worker only the values it checks with. None of them are in the env files.

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
| `MISTY_AUTH_SIGNING_KEY`, `MISTY_OPERATOR_TOKEN`, `JOURNAL_COLLAB_CONTROL_SECRET`, `JOURNAL_COLLAB_PROJECTION_SECRET` | The old value stays valid in its `*_PREVIOUS` slot until you retire it. |
| `JOURNAL_COLLAB_TICKET_PRIVATE_KEY` | The old public key stays valid until you retire it. |
| `DB_MIGRATION_PASSWORD` | The next start moves the database onto the new password. Retire the old one after that. |
| `DB_PASSWORD`, `MISTY_METRICS_TOKEN` | Nothing: the next start applies the new value everywhere. |

Keys that protect stored data can't be rotated. These are the Space link key (`SPACE_LINK_ENCRYPTION_KEY`), the collaboration room salt (`JOURNAL_COLLAB_ROOM_SALT`) and the backup key (`MISTY_BACKUP_AGE_IDENTITY`).

To give a service you run beside the server its operator token, run `docker compose run --rm setup operator-token`, or mount the `secrets` volume and read `operator/token`. To keep a copy of the backup key, run `docker compose run --rm setup backup-key`.

## Servers set up before the root secret

A server set up before the root secret keeps each key on its own. It keeps working after an upgrade, and nobody is signed out. To move its keys onto the root secret:

```bash
docker compose run --rm setup adopt-root
docker compose up -d --force-recreate
```

Each moved key keeps its old value valid in its `*_PREVIOUS` slot. Retire each one once old sessions have expired. The three keys that protect stored data stay as they are. To move them too, add `--discard-data`, which makes shared links and older backups unreadable. Only use it on a server with no data you need.

`CLOUDFLARE_ZONE_ID` and `CLOUDFLARE_ACCOUNT_ID` can stay in `cloudflare.env`. `MISTY_SERVER_VERSION` in `misty.env` is no longer read, because published images report their own commit. When you build on the server, run `MISTY_SERVER_VERSION=$(git rev-parse HEAD) docker compose up -d --build`.

## Accounts on your server

- The first account created on a new server owns it.
- After that, people can sign up only with an open space invitation, or when you create their account in the console.
- To allow only certain people, set `MISTY_ALLOWED_EMAILS` in misty.env to a comma-separated list. The owner can always sign in.
- People sign in with an email and password stored on your server, or with Google through your own `google.env`.

To let someone in, or back in after a forgotten password:

1. Open the operator console and choose their account.
2. Copy its sign-in link and send it to them. With email set up, the server sends it for you.

The console runs on the server at `127.0.0.1:7070`. Its sign-in link is in `docker compose logs console`. To open it from another computer, forward the port: `ssh -L 7070:127.0.0.1:7070 you@server`.
