<div align="center">

# eFVerse

**Next-generation companion web application for eFootball — player card catalog, card training simulator, formation squad builder, and community analytics powered by a PostgreSQL domain engine.**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white)](#)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](#)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Database Engine](#database-engine)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [API Reference](#api-reference)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**eFVerse** is a full-stack analytics and tactical companion platform designed for the eFootball community. It delivers an intuitive, fast, and feature-rich interface to inspect card attributes, build custom tactical squads, calculate player progression builds, and analyze community data.

Unlike conventional CRUD applications, eFVerse offloads critical domain logic — including multi-attribute smart searching, similarity matching algorithms, position penalty mathematics, market value trends, and data audit logs — directly to high-performance **PostgreSQL PL/pgSQL stored procedures, functions, and triggers**.

---

## Key Features

### 1. Player Card Catalog & Discovery
- **Multi-Field Smart Search:** Filter players by name, league, club, nationality, position, card type, and custom attribute ranges.
- **Comprehensive Card View:** Inspect base stats, level progression limits, live condition/form history, injury records, market value trends, and similar player recommendations.
- **Head-to-Head Comparison:** Side-by-side radar and statistical comparison between any two player cards.

### 2. Card Progression & Training Simulator
- **Interactive Point Allocation:** Allocate training progression points across stat categories in real time.
- **Live Rating Simulation:** Preview effective card ratings as stats are tuned.
- **Community Builds:** Save personal card builds, publish them to the community, and like or react to shared configurations.
- **Manager Tactical Boosts:** Automatically calculate and apply active manager affinity boosts to in-game stats.

### 3. Tactical Squad Builder
- **Interactive Pitch:** Drag and position cards onto 9 real-world formations (4-3-3, 4-4-2, 4-2-3-1, 3-5-2, 5-3-2, 4-1-4-1, 3-4-3, 4-5-1, 5-2-3).
- **Position Penalty Engine:** Real-time calculation of overall rating adjustments when players are placed outside their primary/secondary positions.
- **Squad Management:** Create, save, update, favorite, and manage custom team rosters.

### 4. Manager Registry
- Comprehensive registry of coaches with tactical proficiencies (Possession Game, Quick Counter, Long Ball Counter, Out Wide, Long Ball).
- Manager tactical boost inspector with automated validation triggers.

### 5. Advanced Analytics & Leaderboards
- **Top Rated Cards:** Ranked list of the highest-rated cards across all series.
- **Lethal Scorers:** Ranked by goals-per-game (GPG) ratio.
- **Form & Reliability:** Tracking players by injury resistance and consistent "A" condition form.
- **Market Trends & Hot Forms:** Recent player value fluctuations and current in-form stars.
- **Community Favorites:** Most-liked builds and tactical setups.

### 6. Authentication & Administration
- **Flexible Auth:** Dual-mode authentication supporting standard JWT sessions and Google OAuth 2.0 (Google Identity Services).
- **Role-Based Access Control (RBAC):** Distinct roles for standard `USER` accounts and administrative `ADMIN` permissions.
- **Admin Management Panel:** Role-gated dashboard for registering and curating players, cards, managers, and stat attributes.

---

## Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19, Vite 7 | Modern React architecture, React Icons, responsive layouts |
| **Styling** | Modern CSS | Glassmorphism UI, Outfit & Space Grotesk typography |
| **Backend** | Node.js, Express 5 | Modular controllers and Express routers |
| **Authentication** | JWT & Google OAuth 2.0 | `jsonwebtoken`, `bcryptjs`, Google Identity Services |
| **Database** | PostgreSQL / Supabase | Raw SQL via `pg` connection pooling |
| **Database Logic** | PL/pgSQL | Functions, stored procedures, check constraints, audit triggers |

---

## System Architecture

```
┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
│         Frontend Client         │                 │       Backend REST API          │
│         (React 19 + Vite 7)     │   HTTP / JSON   │     (Node.js + Express 5)       │
│        http://localhost:5173    │ <─────────────> │     http://localhost:5001       │
└─────────────────────────────────┘                 └─────────────────────────────────┘
                                                                     │
                                                               pg pool query
                                                                     │
                                                                     ▼
                                                    ┌─────────────────────────────────┐
                                                    │       PostgreSQL Database       │
                                                    │   (Supabase / Local Postgres)   │
                                                    │                                 │
                                                    │  • smart_search_pro()           │
                                                    │  • find_similar_players()       │
                                                    │  • calculate_suggested_stats()  │
                                                    │  • get_effective_rating()       │
                                                    │  • update_player_valuation()    │
                                                    │  • train_player_card_pro()      │
                                                    │  • Audit & Boost Triggers       │
                                                    └─────────────────────────────────┘
```

---

## Project Structure

```
eFVerse/
├── backend/
│   ├── db/
│   │   ├── schema.sql                 # Complete database DDL (tables, constraints, FKs)
│   │   ├── procedures_and_triggers.sql# PL/pgSQL functions, procedures, and triggers
│   │   └── seed_cards.sql             # Curated player card seed data
│   ├── src/
│   │   ├── controllers/               # Domain-specific route controllers
│   │   │   ├── authController.js
│   │   │   ├── playerController.js
│   │   │   ├── managerController.js
│   │   │   ├── progressionController.js
│   │   │   ├── squadController.js
│   │   │   └── reviewController.js
│   │   ├── middleware/
│   │   │   └── authMiddleware.js      # JWT token authentication middleware
│   │   ├── routes/                    # API route definitions
│   │   └── server.js                  # Express application entrypoint
│   ├── .env.example                   # Backend environment template
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   ├── images/                    # Badges, stadium backgrounds, and club logos
│   │   └── logo.png                   # Official eFVerse brand logo
│   ├── src/
│   │   ├── AdminPanel.jsx             # Role-gated administration dashboard
│   │   ├── App.jsx                    # Core shell, navigation, and state router
│   │   ├── badgeAssetEngine.js        # Dynamic crest and flag asset resolver
│   │   ├── CardTrainer.jsx            # Interactive progression & training simulator
│   │   ├── ComparePlayers.jsx         # Head-to-head card comparison
│   │   ├── ManagerDetailView.jsx      # Manager profile and tactical affinity
│   │   ├── PlayerCardView.jsx         # High-resolution card stats and reviews
│   │   ├── SmartSearch.jsx            # Multi-dimensional database search engine
│   │   ├── SquadBuilder.jsx           # Formation-based pitch squad builder
│   │   ├── index.css                  # Global design tokens and animations
│   │   └── main.jsx                   # Application mount point with error boundary
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── PROJECT_SETUP_GUIDE.txt            # Quick-reference local deployment instructions
├── LICENSE                            # MIT License
└── README.md
```

---

## Database Engine

The PostgreSQL database architecture is organized into:

- **Reference Tables:** `League`, `Club`, `Nationality`, `Positions`, `StatType`, `FormType`, `InjuryType`, `TrainingProgram`
- **Core Entities:** `Player`, `Manager`, `Card`, `PlayerStats`, `ManagerEffect`
- **Time-Series Records:** `PlayerForm`, `InjuryRecord`, `PlayerMarketValue`
- **User & Social Data:** `"User"`, `Squad`, `SquadPlayer`, `Review`, `Build`, `BuildStats`, `BuildReaction`, `CardAllocation`
- **Rules & Audit Tables:** `ProgressionRule`, `PositionPenalty`, `Player_Deleted_Audit`, `Manager_Deleted_Audit`

### Key Stored Procedures & Functions

| Function / Procedure | Purpose |
|---|---|
| `smart_search_pro(...)` | High-efficiency multi-column filtering and keyword search |
| `find_similar_players(...)` | Attribute-distance similarity algorithm for alternative player suggestions |
| `calculate_suggested_stats(...)` | Algorithmic point distribution recommendations based on position archetype |
| `get_effective_rating(...)` | Position-penalty rating adjustment calculation |
| `update_player_valuation(...)` | Form-weighted market valuation algorithm |
| `train_player_card_pro(...)` | Atomic transaction for point validation and stat increments |

---

## Getting Started

### Prerequisites

- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher)
- **PostgreSQL Database** (v13 or higher, or a hosted [Supabase](https://supabase.com) instance)

---

### Step 1: Database Initialization

1. Open your PostgreSQL terminal (`psql`) or the Supabase SQL Editor.
2. Execute the initialization scripts in sequence:
   ```bash
   # 1. Create tables, constraints, and relationships
   psql -d <your_database> -f backend/db/schema.sql

   # 2. Install PL/pgSQL functions, procedures, and triggers
   psql -d <your_database> -f backend/db/procedures_and_triggers.sql

   # 3. (Optional) Load curated player card seed data
   psql -d <your_database> -f backend/db/seed_cards.sql
   ```

---

### Step 2: Configure Environment Variables

Create your backend configuration file from the template:

```bash
cd backend
cp .env.example .env
```

Populate `.env` with your database credentials and secret keys (see [Environment Configuration](#environment-configuration)).

---

### Step 3: Start the Backend Service

```bash
cd backend
npm install
node src/server.js
```

The Express API server will listen on `http://localhost:5001`.

---

### Step 4: Start the Frontend Application

In a separate terminal window:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Environment Configuration

Defined in `backend/.env`:

| Variable | Description | Default / Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection URI | `postgresql://user:pass@host:5432/dbname` |
| `SUPABASE_URL` | Supabase project URL *(if using Supabase)* | `https://your-project.supabase.co` |
| `SUPABASE_KEY` | Supabase API key *(if using Supabase)* | `eyJhbGciOi...` |
| `JWT_SECRET` | Secret key used to sign and verify JWT authentication tokens | `your_secure_jwt_secret` |
| `PORT` | HTTP port for the Express backend | `5001` |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` |

---

## API Reference

All routes are mounted under the `/api` prefix. Routes marked with 🔒 require authentication (`Bearer` token or auth cookie).

<details>
<summary><strong>Authentication</strong> — <code>/api/auth</code></summary>

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register` | Register a new user account |
| `POST` | `/login` | Authenticate and issue session token |
| `POST` | `/google` | Authenticate via Google OAuth credential token |
| `POST` 🔒 | `/logout` | Invalidate and clear current session |
| `GET` 🔒 | `/profile/:userId` | Retrieve user profile information |

</details>

<details>
<summary><strong>Players & Cards</strong> — <code>/api/players</code></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/list-cards` | Retrieve all configured player cards (supports filter and sort query params) |
| `GET` | `/list-players` | Retrieve all registered players |
| `GET` | `/view-card/:id` | Full player card detail including stats, history, and reviews |
| `GET` | `/smart-search` | Multi-field search endpoint |
| `GET` | `/compare/:cardId1/:cardId2` | Head-to-head comparison data for two cards |
| `GET` | `/similar/:cardId` | Similar player recommendations |
| `GET` | `/helpers` | Reference data (leagues, nations, positions) |
| `GET` | `/clubs` | All Konami registered clubs with crest URLs |
| `GET` | `/top-rated` | Leaderboard: Highest rated cards |
| `GET` | `/top-scorers` | Leaderboard: Top scorers by GPG |
| `GET` | `/injury-prone` | Leaderboard: Players with high injury occurrence |
| `GET` | `/consistent` | Leaderboard: Players with consistent condition |
| `GET` | `/recent-hot-form` | Leaderboard: Players in active peak form |
| `GET` | `/top-market-value` | Leaderboard: Highest estimated market value |
| `POST` 🔒 | `/add-player` | Create a player registry entry (admin) |
| `POST` 🔒 | `/add-card` | Create a new card registry entry (admin) |
| `POST` 🔒 | `/add-stats` | Associate stat records with a card (admin) |
| `DELETE` 🔒 | `/delete-card/:id` | Remove a card entry (admin) |

</details>

<details>
<summary><strong>Squad Management</strong> — <code>/api/squads</code></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/formations` | List of supported pitch tactical formations |
| `GET` | `/cards` | Card pool available for squad drafting |
| `GET` | `/penalties-all` | Matrix of position penalty rules |
| `GET` 🔒 | `/user/:userId` | Retrieve squads belonging to a user |
| `GET` 🔒 | `/:squadId` | Retrieve individual squad details and roster |
| `POST` 🔒 | `/save` | Save a new squad lineup |
| `PUT` 🔒 | `/:squadId` | Update an existing squad lineup |
| `DELETE` 🔒 | `/:squadId` | Delete a saved squad |
| `POST` 🔒 | `/:squadId/favorite` | Toggle favorite status on a squad |

</details>

<details>
<summary><strong>Progression & Training</strong> — <code>/api/progression</code></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/rules` | Training programs and rule specifications |
| `GET` | `/top-liked-builds` | Highest community-rated progression builds |
| `GET` 🔒 | `/my-build/:id` | User's saved build for a specific card |
| `GET` 🔒 | `/community-builds/:cardId` | Public builds published by the community |
| `POST` 🔒 | `/train` | Save progression allocation and update stats |
| `POST` 🔒 | `/save-snapshot` | Publish a public build snapshot |
| `POST` 🔒 | `/react` | Like or react to a community build |

</details>

<details>
<summary><strong>Managers</strong> — <code>/api/managers</code></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/list` | List all managers with playstyles and photo URLs |
| `GET` | `/stats` | List boostable stat categories |
| `GET` | `/boosts/:id` | Tactical boosts associated with a manager |
| `POST` 🔒 | `/add` | Register a new manager (admin) |
| `POST` 🔒 | `/boosts` | Assign tactical stat boost effects (admin) |
| `DELETE` 🔒 | `/delete/:id` | Remove a manager record (admin) |

</details>

<details>
<summary><strong>Reviews</strong> — <code>/api/reviews</code></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/:cardId` | Retrieve all community reviews for a card |
| `POST` 🔒 | `/add` | Submit a card review and rating |

</details>

---

## Roadmap

- [ ] Automated continuous integration (CI) test workflows via GitHub Actions.
- [ ] End-to-end integration tests for core progression algorithms and rating math.
- [ ] Server-side pagination for extensive player rosters.
- [ ] Mobile responsive layout enhancements for the pitch squad builder.
- [ ] Social build export with direct card link sharing.

---

## Contributing

Contributions are welcomed. To propose a change:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/new-feature`).
3. Commit your changes with descriptive messages (`git commit -m 'Add new feature'`).
4. Push to your branch (`git push origin feature/new-feature`).
5. Open a Pull Request detailing your enhancements.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for complete details.
