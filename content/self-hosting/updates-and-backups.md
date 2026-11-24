---
title: Updates and backups
order: 2
---

# Updates and backups

This page covers keeping your server up to date, backing it up and restoring it.

## Update your server

Pull the new version and start the stack again. Database migrations run automatically.

```bash
cd misty-server
git pull
docker compose up -d --build
```

Update the Misty app on each computer too. A much older app may not work with a newer server.

## Back up your server

The server backs up its database every night at 03:00 UTC. You don't need to set anything up.

- Each backup is encrypted with the server's backup key, using [age](https://age-encryption.org).
- Backups go to the `misty-<host>-backups` bucket in R2. Nothing on the server can delete them for 30 days.
- Files in spaces live in a separate R2 bucket. They aren't part of the database backup.

Back up now, list backups, copy the backup key:

```bash
docker compose exec backups misty-setup backup --now
docker compose exec backups misty-setup backups
docker compose run --rm --no-deps backups backup-key
```

> Keep a copy of the backup key somewhere other than the server, with your copy of the secrets. Without the key, no backup can be read.

## Restore a backup

Restore the newest backup, or use a name from the list instead of `latest`:

```bash
docker compose stop api
docker compose exec backups misty-setup restore latest
docker compose up -d
```

Practise a restore on a spare server, so you know it works before you need it.

## Stop or remove your server

- `docker compose down` stops the server. All data and secrets are kept.
- `docker compose down --volumes` deletes the database and the secrets. This can't be undone.
- The tunnel and R2 buckets stay in your Cloudflare account until you delete them there. A server set up before Misty moved live co-editing off Cloudflare also left a Worker there, named `misty-<host>-collab`, which you can delete.

## Change the server's code

Misty is licensed under the [GNU AGPL-3.0-or-later](https://mistysys.com/license). Running Misty unchanged, or changing it only for yourself, needs nothing extra.

If you change the server and let other people use it:

- Offer those people the source code of your version, under the same license. A link on your sign-in page works.
- Give your version its own name and logo. You can say it's based on Misty.
- Keep the author attribution in the About screen. See [License](https://mistysys.com/license).

Every service on these pages is required. Removing one, such as Cloudflare, means changing the code, and that version is yours to maintain.
