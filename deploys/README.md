# Production Deploy Guide

This folder contains runtime-only deployment files.

## Structure

- `deploy/docker-compose.prod.yml`: single stack for FE + BE + DB (+ Redis)

## On The VM

Create one stack folder on your VM and keep runtime env files there:

- Stack folder (example): `/opt/petcarex`

The CI workflow copies compose file to this folder and updates `.env` with image tags on each deploy.

### Required runtime files

- Stack folder:
  - `.env` (created/updated automatically by pipeline)
  - `.env.app` (application env for NestJS)

If you set `BE_APP_ENV` in GitHub Secrets, the pipeline auto-generates `.env.app` in the stack folder.

Use `STACK_ENV` (GitHub Secret) for extra runtime values appended to `.env`, for example:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `PORT`
- `DB_HOST=db`
- `DB_PORT=5432`
- `DB_NAME=Petcare`
- `DB_USERNAME=postgres`
- `DB_PASSWORD=change_me`
- `REDIS_HOST=redis`
- `REDIS_PORT=6379`

## Manual deploy command (fallback)

In stack folder:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
```
