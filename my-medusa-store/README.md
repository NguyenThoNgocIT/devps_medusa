# my-medusa-store (backend)

This README covers local development using Docker Compose, migrating an existing Postgres database into the container Postgres, and seeding demo data.

Prerequisites

- Docker & Docker Compose
- (Optional) `psql`/`pg_dump` on Windows when exporting from host Postgres

Quick start (use the included docker-compose.dev.yml)

1. Copy `.env.example` to `.env` and adjust secrets if desired.

2. Start services:

```powershell
docker compose -f ..\docker-compose.dev.yml up -d --build
```

3. Seed demo data:

```powershell
docker compose -f ..\docker-compose.dev.yml exec medusa yarn seed
```

Migrate existing Windows Postgres into the container Postgres

If you previously created a Postgres DB on Windows and want to copy data into the container DB, follow these steps.

1. On Windows, create a dump using `pg_dump` (plain SQL) or custom format (`-F c`). Example:

```powershell
# Plain SQL
pg_dump -h localhost -p 5432 -U postgres -d medusa-devops -F p -f C:\temp\medusa_dump.sql

# Or custom format
pg_dump -h localhost -p 5432 -U postgres -d medusa-devops -F c -b -v -f C:\temp\medusa_dump.dump
```

2. Run the helper script in repository root (Windows PowerShell):

```powershell
# from repository root (D:\MEDUSA)
./scripts/migrate_to_container.ps1 -DumpPath C:\temp\medusa_dump.sql -Format sql
# or for custom format
./scripts/migrate_to_container.ps1 -DumpPath C:\temp\medusa_dump.dump -Format custom
```

The script copies the dump into the `postgres` container and restores it into the `medusa` database.

Notes

- The compose setup creates a DB `medusa` with user `medusa` and password `medusa`. The `.env` file in this repo is set to use that DB for local development.
- Do NOT commit real secrets to git. Use `.env.example` to document required variables.
<p align="center">
  <a href="https://www.medusajs.com">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/59018053/229103275-b5e482bb-4601-46e6-8142-244f531cebdb.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    <img alt="Medusa logo" src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    </picture>
  </a>
</p>
<h1 align="center">
  Medusa
</h1>

<h4 align="center">
  <a href="https://docs.medusajs.com">Documentation</a> |
  <a href="https://www.medusajs.com">Website</a>
</h4>

<p align="center">
  Building blocks for digital commerce
</p>
<p align="center">
  <a href="https://github.com/medusajs/medusa/blob/master/CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" alt="PRs welcome!" />
  </a>
    <a href="https://www.producthunt.com/posts/medusa"><img src="https://img.shields.io/badge/Product%20Hunt-%231%20Product%20of%20the%20Day-%23DA552E" alt="Product Hunt"></a>
  <a href="https://discord.gg/xpCwq3Kfn8">
    <img src="https://img.shields.io/badge/chat-on%20discord-7289DA.svg" alt="Discord Chat" />
  </a>
  <a href="https://twitter.com/intent/follow?screen_name=medusajs">
    <img src="https://img.shields.io/twitter/follow/medusajs.svg?label=Follow%20@medusajs" alt="Follow @medusajs" />
  </a>
</p>

## Compatibility

This starter is compatible with versions >= 2 of `@medusajs/medusa`.

## Getting Started

Visit the [Quickstart Guide](https://docs.medusajs.com/learn/installation) to set up a server.

Visit the [Docs](https://docs.medusajs.com/learn/installation#get-started) to learn more about our system requirements.

## What is Medusa

Medusa is a set of commerce modules and tools that allow you to build rich, reliable, and performant commerce applications without reinventing core commerce logic. The modules can be customized and used to build advanced ecommerce stores, marketplaces, or any product that needs foundational commerce primitives. All modules are open-source and freely available on npm.

Learn more about [Medusa’s architecture](https://docs.medusajs.com/learn/introduction/architecture) and [commerce modules](https://docs.medusajs.com/learn/fundamentals/modules/commerce-modules) in the Docs.

## Community & Contributions

The community and core team are available in [GitHub Discussions](https://github.com/medusajs/medusa/discussions), where you can ask for support, discuss roadmap, and share ideas.

Join our [Discord server](https://discord.com/invite/medusajs) to meet other community members.

## Other channels

- [GitHub Issues](https://github.com/medusajs/medusa/issues)
- [Twitter](https://twitter.com/medusajs)
- [LinkedIn](https://www.linkedin.com/company/medusajs)
- [Medusa Blog](https://medusajs.com/blog/)
