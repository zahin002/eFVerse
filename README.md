<div align="center">

# eFVerse (FHUB)

**A full-stack companion app for eFootball — player database, card training, squad building, and community analytics, backed by a logic-heavy PostgreSQL layer.**

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-339933?logo=nodedotjs&logoColor=white)](#)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](#)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

</div>

---

> **Note on naming:** this repository is titled *eFVerse*; the running application brands itself internally as **FHUB**. Both refer to the same project.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Overview

eFVerse is a full-stack companion application for the eFootball series. It centralizes player, card, and manager data behind a searchable database, then layers gameplay-specific tools on top:

- Build and simulate **card training/progression** (allocate points across stat categories and see the projected rating).
- Assemble **squads** on formation-based pitch layouts, with position-penalty-aware ratings.
- Track **form and injury history**, **market value trends**, and **community reviews** per player card.
- Browse community-shared **card builds** and react to them.
- Administer the underlying database (players, cards, managers, stats) through a role-gated admin panel.

The project doubles as a demonstration of moving non-trivial business logic (smart search, similarity matching, rating math, valuation modeling, auditing) into the database layer via PostgreSQL functions, procedures, and triggers, rather than reimplementing it in the API layer.

## Features

**Player & Card Database**
- Multi-field smart search (name, league, club, nationality, card type, position, individual stat ranges)
- Detailed card view: base stats, form history, injury history, market value history, community reviews, similar-player suggestions
- Head-to-head player comparison

**Card Training / Progression**
- Allocate progression points into stat categories per configurable training programs
- Save personal builds and browse/react to public community builds
- Manager tactical boosts applied to effective stats (max 2 boosts per manager, enforced at the DB level)

**Squad Builder**
- Interactive formation-based pitch (9 supported formations: 4-3-3, 4-4-2, 4-2-3-1, 3-5-2, 5-3-2, 4-1-4-1, 3-4-3, 4-5-1, 5-2-3)
- Position-penalty-aware "effective rating" when playing a card out of position
- Save, edit, delete, and favorite squads

**Analytics / Leaderboards**
- Top-rated cards, top goal-scorers (by GPG), injury-prone players, consistency leaders, recent hot-form players, top market-value players, most-liked community builds

**Auth & Administration**
- JWT-based authentication via httpOnly cookies, bcrypt-hashed passwords
- Role-gated access (`USER` / `ADMIN`)
- Admin panel for managing players, cards, managers, stats, forms, and injuries

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, Axios, plain CSS-in-JS (no UI framework) |
| Backend | Node.js, Express 5, JWT (`jsonwebtoken`), `bcrypt` / `bcryptjs`, `cookie-parser`, `cors`, `dotenv` |
| Database | PostgreSQL (developed against Supabase), accessed via `pg` (raw SQL / functions / procedures) |
| Dev tooling | `nodemon` (backend), ESLint (frontend) |

## Architecture

```
┌─────────────────┐      HTTP/JSON (cookies)      ┌───────────────────┐        SQL         ┌──────────────────────┐
│  React + Vite    │  <───────────────────────>   │  Express REST API  │ <───────────────> │  PostgreSQL (Supabase)│
│  (frontend/)      │      localhost:5173          │  (backend/)         │   pg connection    │                        │
└─────────────────┘                                └───────────────────┘                    └──────────────────────┘
                                                                                                        │
                                                                                    Functions / Procedures / Triggers:
                                                                                    - smart_search_pro()
                                                                                    - find_similar_players()
                                                                                    - calculate_suggested_stats()
                                                                                    - get_effective_rating()
                                                                                    - update_player_valuation()
                                                                                    - train_player_card_pro() / save_player_build_pro()
                                                                                    - audit-on-delete triggers, boost-limit trigger, etc.
```

A deliberate design decision in this project is that a meaningful share of the domain logic — smart search filtering, similarity scoring, rating/valuation math, and data auditing — is implemented directly in PostgreSQL (see [`SQL CODES/`](./SQL%20CODES)) rather than in the Express layer. Controllers in `backend/src/controllers/` are largely thin wrappers that call these functions/procedures and shape the JSON response.

Authentication uses a JWT stored in an httpOnly cookie (`token`), verified per-request by `authMiddleware.js`. The frontend never touches the raw token; it caches only non-sensitive profile data (`username`, `role`) in `localStorage` for UI purposes and relies on the cookie for actual authorization.

## Project Structure

```
FHUB/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Route handlers — one per domain (auth, player, manager, squad, ...)
│   │   ├── routes/            # Express routers, one per domain
│   │   ├── middleware/
│   │   │   └── authMiddleware.js  # JWT verification
│   │   └── server.js          # App entrypoint, middleware & route wiring
│   ├── .env.example           # Template for backend/.env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Auth screen + main dashboard shell
│   │   ├── AdminPanel.jsx      # Admin CRUD for players/cards/managers/stats
│   │   ├── SmartSearch.jsx     # Multi-field player/card search
│   │   ├── PlayerCardView.jsx  # Card detail: history, reviews, similar players
│   │   ├── ComparePlayers.jsx  # Head-to-head comparison
│   │   ├── ManagerDetailView.jsx
│   │   ├── CardTrainer.jsx     # Progression / training UI
│   │   ├── SquadBuilder.jsx    # Formation-based squad builder
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── SQL CODES/                  # Schema + PL/pgSQL functions, procedures, triggers (run before first use)
│   ├── schema.txt              # Full DDL — tables, constraints, FKs
│   ├── smart_search.txt
│   ├── similar_player_card.txt
│   ├── effective_rating.txt
│   ├── auto_stats_calc.txt
│   ├── market_value_updater.txt
│   ├── train_card.txt
│   ├── player_build_save.txt
│   ├── update_player_status.txt
│   ├── booster_limit_trigger.txt
│   ├── default_form_trigger.txt
│   ├── delete_player_audit.txt
│   ├── manager_audit.txt
│   ├── manager_insert.txt
│   ├── player_card_stats insertion.txt
│   └── logical_stats_enforcing.txt
├── PROJECT_SETUP_GUIDE.txt
├── .gitignore
├── LICENSE
└── README.md
```

## Database Schema

The schema (`SQL CODES/schema.txt`) defines ~20 tables covering:

- **Reference data:** `League`, `Club`, `Nationality`, `Positions`, `StatType`, `FormType`, `InjuryType`, `TrainingProgram`
- **Core entities:** `Player`, `Manager`, `Card`, `PlayerStats`, `ManagerEffect`
- **Time-series / history:** `PlayerForm`, `InjuryRecord`, `PlayerMarketValue`
- **User data:** `"User"`, `Squad`, `SquadPlayer`, `Review`, `Build`, `BuildStats`, `BuildReaction`, `CardAllocation`
- **Rules & audit:** `ProgressionRule`, `PositionPenalty`, `Player_Deleted_Audit`, `Manager_Deleted_Audit`

Key constraints worth noting: overall ratings are bounded `0–100`, card `CurrentOverallRating` must sit between its base and max, manager play-styles are restricted to a fixed set, squad formations are restricted via a `CHECK` constraint, and boosts per manager are capped at 2 via a trigger.

## Getting Started

### Prerequisites

- Node.js 16+
- npm
- A PostgreSQL database (the project was developed against [Supabase](https://supabase.com), but any Postgres 13+ instance should work)

### 1. Set up the database

Using `psql`, the Supabase SQL editor, or your client of choice, run the SQL files in `SQL CODES/` in this order:

1. `schema.txt` — creates all tables, constraints, and foreign keys
2. All remaining `.txt` files — functions, procedures, and triggers (order doesn't matter between these, but they must come after `schema.txt`)

> These files use a `.txt` extension; you can run them as-is with `psql -f`, or rename to `.sql` first for editor syntax highlighting.

### 2. Configure environment variables

```bash
cd backend
cp .env.example .env
```

Fill in `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_KEY`, and `JWT_SECRET` with your own values (see [Environment Variables](#environment-variables)).

### 3. Start the backend

```bash
cd backend
npm install
node src/server.js
# or, for auto-reload during development:
npx nodemon src/server.js
```

The API will be available at `http://localhost:5001`.

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

> Both the backend and frontend must be running simultaneously. The frontend currently calls the backend via a hardcoded `http://localhost:5001` base URL (see [Known Limitations](#known-limitations)).

## Environment Variables

Defined in `backend/.env` (see `backend/.env.example`):

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase API key |
| `JWT_SECRET` | Secret used to sign/verify auth JWTs |
| `PORT` | Port for the Express server (defaults to `5001`) |
| `NODE_ENV` | Set to `production` to enable secure, HTTPS-only auth cookies |

## API Reference

All routes are prefixed with `/api`. Routes marked 🔒 require a valid auth cookie (`verifyToken` middleware).

<details>
<summary><strong>Auth</strong> — <code>/api/auth</code></summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Create a new user |
| POST | `/login` | Authenticate, sets JWT cookie |
| POST 🔒 | `/logout` | Clear auth cookie |
| GET 🔒 | `/profile/:userId` | Fetch a user's profile |

</details>

<details>
<summary><strong>Players & Cards</strong> — <code>/api/players</code></summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/helpers` | Dropdown reference data (leagues, nations, positions, etc.) |
| GET | `/clubs-by-league` | Clubs filtered by league |
| GET | `/list-players` / `/list-cards` | List players / cards |
| GET | `/suggestions` | Autocomplete player suggestions |
| GET | `/smart-search` | Multi-field search |
| GET | `/compare/:cardId1/:cardId2` | Compare two cards |
| GET | `/calculate-stats/:id` | Suggested stat distribution for a card |
| GET | `/view-card/:id` | Full card detail |
| GET | `/history/:playerId` | Market value history |
| GET | `/similar/:cardId` | Similar-player suggestions |
| GET | `/top-rated` / `/top-scorers` / `/injury-prone` / `/consistent` / `/recent-hot-form` / `/top-market-value` | Leaderboards |
| GET | `/list-penalties` | Position penalty table |
| POST 🔒 | `/add-player` / `/add-card` / `/add-stats` | Create records (admin) |
| PUT 🔒 | `/update-status` | Update player form/injury status |
| DELETE 🔒 | `/delete-player/:id` / `/delete-card/:id` | Delete records (admin) |

</details>

<details>
<summary><strong>Managers</strong> — <code>/api/managers</code></summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/list` | List all managers |
| GET | `/stats` | Boostable stat types |
| GET | `/boosts/:id` | Boosts assigned to a manager |
| POST 🔒 | `/add` | Add a manager (admin) |
| POST 🔒 | `/boosts` | Assign manager boosts |
| DELETE 🔒 | `/delete/:id` | Delete a manager (admin) |

</details>

<details>
<summary><strong>Forms & Injuries</strong> — <code>/api/forms</code>, <code>/api/injuries</code></summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/types` | Available form/injury types |
| GET | `/history/:id` | A player's form/injury history |
| POST 🔒 | `/update` | Log a new form/injury entry |

</details>

<details>
<summary><strong>Progression (Card Training)</strong> — <code>/api/progression</code></summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/rules` | Training program rules |
| GET | `/positions` | Position list |
| GET | `/top-liked-builds` | Most-liked public builds |
| GET 🔒 | `/my-build/:id` | Your saved build for a card |
| GET 🔒 | `/builds/:cardId` | Your builds for a card |
| GET 🔒 | `/community-builds/:cardId` | Public builds for a card |
| GET 🔒 | `/managers-with-effects` | Managers with active boosts |
| POST 🔒 | `/train` | Apply training points to a card |
| POST 🔒 | `/save-snapshot` | Save a build snapshot |
| POST 🔒 | `/react` | Like/dislike a community build |

</details>

<details>
<summary><strong>Squads</strong> — <code>/api/squads</code></summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/formations` / `/positions` | Static reference data |
| GET | `/cards` | Cards available for squad-building |
| GET | `/penalties-all` / `/penalties/:cardId/:targetPosition` | Position-penalty lookups |
| POST 🔒 | `/save` | Save a new squad |
| GET 🔒 | `/user/:userId` | List a user's squads |
| GET 🔒 | `/:squadId` | Squad detail |
| PUT 🔒 | `/:squadId` | Update a squad |
| DELETE 🔒 | `/:squadId` | Delete a squad |
| POST 🔒 | `/:squadId/favorite` | Toggle favorite status |

</details>

<details>
<summary><strong>Reviews</strong> — <code>/api/reviews</code></summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/:cardId` | Reviews for a card |
| POST 🔒 | `/add` | Submit a review |

</details>

## Known Limitations

- **Privilege escalation on registration:** `POST /api/auth/register` accepts a client-supplied `role` field and persists it as-is, so any user can register as `ADMIN`. This should be fixed server-side (ignore/validate the field) before relying on role-gating for anything sensitive.
- **Hardcoded API base URL:** most frontend components call `http://localhost:5001` directly rather than reading from an environment variable, making the app harder to deploy to a non-local environment without a find-and-replace.
- **No automated tests.** Both `backend` and `frontend` `package.json` files have placeholder or missing test scripts.
- **No CI/CD** (GitHub Actions, etc.) configured yet.
- **`.env` was present in the working copy.** If this repository has ever been pushed with real credentials committed, rotate `DATABASE_URL`, `SUPABASE_KEY`, and `JWT_SECRET` immediately and scrub them from git history (e.g. with `git filter-repo` or BFG) — adding `.env` to `.gitignore` after the fact does not remove it from prior commits.

## Roadmap

Ideas for future iterations (not yet implemented):

- Centralize the API base URL behind a single config/env value (`VITE_API_URL`) instead of hardcoding it per component
- Fix the registration role-assignment issue and add stronger input validation across controllers
- Add automated tests (unit tests for controllers/SQL functions, integration tests for routes) and a GitHub Actions CI workflow
- Add pagination to list endpoints (`list-cards`, `list-players`) for larger datasets
- Extract shared styling into a design system or component library instead of inline styles
- Add screenshots/demo GIF and a live deployed demo link to this README

## Contributing

Contributions are welcome. If you'd like to help:

1. Fork the repository and create a feature branch
2. Follow the existing code style (controllers/routes pattern on the backend, functional components on the frontend)
3. Open a pull request describing your change and the motivation behind it

If you're planning a larger change, opening an issue first to discuss it is appreciated.

## License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for details.
