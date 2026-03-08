# OpenSportMap

Discover and share sports courts near you — find places to play, save your favorites, and add new spots to the map.

## Features

- **Find Places** — Browse an interactive map to discover sports courts for tennis, basketball, volleyball, pickleball, and more. Filter by sport and explore nearby venues.
- **Save Places** — Bookmark courts you love and access them quickly from your profile.
- **Add Places** — Contribute to the community by adding new courts with location pinning, sport type, and details.

## Project Structure

```
src/
├── app/                  # Next.js App Router pages & API routes
│   ├── api/              # Geocoding and debug endpoints
│   ├── auth/             # Sign in / sign up / OAuth callback
│   ├── events/           # Event creation and detail pages
│   ├── map/              # Interactive court map
│   ├── matches/          # Match logging
│   ├── places/           # Court detail and edit pages
│   ├── profile/          # User profile and stats
│   └── rankings/         # Leaderboards
├── components/           # Reusable React components
│   ├── auth/             # Auth provider and guards
│   ├── map/              # Leaflet map and clustering
│   └── ui/               # shadcn/ui component library
├── hooks/                # Custom React hooks
└── lib/                  # Business logic and utilities
    ├── elo/              # Elo rating calculator and match service
    ├── supabase/         # Database client and type definitions
    └── utils/            # Helpers for sports, maps, performance
```

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| [Next.js 15](https://nextjs.org) | App framework with App Router |
| [TypeScript](https://www.typescriptlang.org) | Type safety |
| [Tailwind CSS](https://tailwindcss.com) | Styling |
| [shadcn/ui](https://ui.shadcn.com) | UI component library |
| [Leaflet](https://leafletjs.com) / React-Leaflet | Interactive maps |
| [TanStack Query](https://tanstack.com/query) | Server state management |
| [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) | Forms and validation |
| [Lucide React](https://lucide.dev) | Icons |

### Backend
| Technology | Purpose |
|---|---|
| [Supabase](https://supabase.com) | Backend platform |
| PostgreSQL | Database with Row Level Security |
| Supabase Auth | Email and Google OAuth authentication |
| Supabase Realtime | Live data subscriptions |
