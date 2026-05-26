# ACE Directories Network

Multi-tenant directory platform powering all ACE directory sites — lawyer directories, job boards, profession directories.

**Stack:** Next.js 14 · Supabase · Railway · Cloudflare · Stripe · Resend

## Sites
| Site | Domain | Tenant Slug | Status |
|------|--------|-------------|--------|
| Aussie Lawyer Directory | aussielawyerdirectory.com.au | `ald` | Building |
| Mornington Peninsula Jobs | morningtonpeninsulajobs.com.au | `mpj` | Live |

## Structure
```
directories-core/      # Shared Next.js app (multi-tenant runtime)
  tenants/             # Per-tenant config, templates, agent prompts
    ald/               # Aussie Lawyer Directory
scrapers/              # Data ingestion scripts per directory type
  ald/                 # Law Society + Google Places scrapers
agents/                # AI agent specs
  lexie/               # ALD AI assistant
docs/                  # Architecture, runbooks, SEO plans
  ald/
railway/               # Railway deployment configs
```

## Quick Start
```bash
# Install
npm install

# Dev (ALD tenant)
TENANT_SLUG=ald npm run dev

# Import ALD listings
cd scrapers/ald && pip install -r requirements.txt
python bulk_loader.py --csv ALD-EXISTING-LISTINGS.csv
```

## Deployment
Each tenant runs as a Railway service with `TENANT_SLUG` env var selecting the config.
