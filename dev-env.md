# Local Development Environment

## Multi-App Dev Setup (Web + Admin on One Port)

PathWay runs two separate Next.js applications:

- **apps/web** - Marketing/public site
- **apps/admin** - Admin dashboard

In local development, we use a reverse proxy to serve both apps on port 3000, routing by hostname:

| Hostname | App | Internal Port |
|----------|-----|---------------|
| `http://localhost:3000` | Web (marketing) | 3001 |
| `http://app.localhost:3000` | Admin dashboard | 3002 |

This mirrors the production setup where:
- `nexsteps.dev` → web app
- `app.nexsteps.dev` → admin app

### Prerequisites

**1. Install Caddy**

Install [Caddy](https://caddyserver.com/docs/install) locally:

**macOS (Homebrew):**
```bash
brew install caddy
```

**Linux:**
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

**Windows (Chocolatey):**
```powershell
choco install caddy
```

**2. Configure Environment Variables**

Each app needs a `.env.local` file:

**Admin app:**
```bash
cd apps/admin
cp .env.example .env.local
# Edit .env.local and set your Auth0 credentials and API URL
```

**Web app:**
```bash
cd apps/web
cp .env.example .env.local
# Edit as needed (currently minimal config required)
```

**Key variables for admin app:**
- `NEXT_PUBLIC_API_URL` - URL to the API server (default: `https://localhost:3333`)
- `AUTH0_BASE_URL` - Base URL for admin app (should be `https://app.localhost:3000`)
- Auth0 credentials (get from your Auth0 dashboard)

### Running the Dev Environment

#### Option 1: Run Everything Together

From the repo root:

```bash
pnpm dev:all
```

This starts:
- Web app on port 3001
- Admin app on port 3002
- Caddy proxy on port 3000

#### Option 2: Run Components Separately (Recommended)

Open **four terminal windows** in the repo root:

**Terminal 1 - API Server:**
```bash
pnpm dev:api
```

**Terminal 2 - Web App:**
```bash
pnpm dev:web
```

**Terminal 3 - Admin App:**
```bash
pnpm dev:admin
```

**Terminal 4 - Caddy Proxy:**
```bash
pnpm dev:proxy
```

### Access the Apps

Once all services are running:

- **Marketing site:** [http://localhost:3000](http://localhost:3000)
- **Admin dashboard:** [http://app.localhost:3000](http://app.localhost:3000)

### Troubleshooting

**Port already in use:**
- Check if another process is using ports 3000, 3001, or 3002
- Kill existing processes: `lsof -ti:3000 | xargs kill` (macOS/Linux)

**Caddy not routing correctly:**
- Verify Caddy is running: `caddy version`
- Check Caddy logs in the terminal where you ran `pnpm dev:proxy`
- Ensure both Next.js apps are running on their expected ports

**Browser shows wrong app:**
- Clear browser cache and cookies
- Try in an incognito/private window
- Verify hostname in the address bar (use `localhost` not `127.0.0.1`)

### Available Scripts

From the repo root:

| Script | Description |
|--------|-------------|
| `pnpm dev` | Runs all apps via Turbo (original behavior, no proxy) |
| `pnpm dev:api` | Runs API server (NestJS with nodemon) |
| `pnpm dev:web` | Runs web app only on port 3001 |
| `pnpm dev:admin` | Runs admin app only on port 3002 |
| `pnpm dev:apps` | Runs both web and admin in parallel |
| `pnpm dev:proxy` | Runs Caddy reverse proxy on port 3000 |
| `pnpm dev:all` | Runs apps + proxy together |

### Architecture Notes

- Each Next.js app runs its own dev server on a dedicated port
- Caddy acts as a reverse proxy, routing by HTTP `Host` header
- No code changes required in the apps themselves
- This setup is for **local development only**
- Production uses proper DNS and deployment infrastructure

