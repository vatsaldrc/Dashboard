# Botpress Dashboard

Ein Next.js Dashboard für die Visualisierung und Analyse von Botpress- und Chatbot-Analytics-Daten.

## Projektbeschreibung

Dieses Dashboard bietet eine umfassende Übersicht über Botpress- und Chatbot-Analytics mit interaktiven Charts, Visualisierungen und detaillierten Metriken. Die Anwendung unterstützt verschiedene Benutzerrollen (Admin und User) und bietet eine vollständige Authentifizierung über NextAuth.

## Voraussetzungen

- **Node.js** 20.x oder höher
- **MySQL** 8.0 oder höher
- **npm** oder **yarn**
- **Docker** und **Docker Compose** (optional, für Container-basiertes Deployment)

## Installation

### 1. Repository klonen

```bash
git clone <repository-url>
cd botpress.dashboard
```

### 2. Dependencies installieren

```bash
npm install
```

### 3. Umgebungsvariablen konfigurieren

Erstelle eine `.env` Datei im Root-Verzeichnis mit folgenden Variablen:

```env
# Datenbank
DATABASE_URL="mysql://user:password@localhost:3306/database_name"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"

# Admin Login (erforderlich für Admin-Zugriff)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your-secure-password"

# Environment (optional)
NODE_ENV="development"
```

### 4. Prisma Client generieren

```bash
npm run prisma:generate
```

### 5. Datenbank-Migrationen ausführen

```bash
npm run prisma:migrate
```

### 6. Demo-Daten einspielen (optional)

```bash
npm run prisma:seed
```

### 7. Development Server starten

```bash
npm run dev
```

Die Anwendung ist nun unter [http://localhost:3000](http://localhost:3000) erreichbar.

## Umgebungsvariablen

### Erforderliche Variablen

| Variable | Beschreibung | Beispiel |
|----------|-------------|----------|
| `DATABASE_URL` | MySQL Connection String | `mysql://user:password@localhost:3306/dbname` |
| `NEXTAUTH_SECRET` | Secret Key für NextAuth JWT | Mindestens 32 Zeichen, zufälliger String |
| `ADMIN_EMAIL` | E-Mail-Adresse für Admin-Login | `admin@example.com` |
| `ADMIN_PASSWORD` | Passwort für Admin-Login | Sicheres Passwort |

### Optionale Variablen

| Variable | Beschreibung | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment Mode | `development` |

### NEXTAUTH_SECRET generieren

Für Production sollte ein sicherer Secret generiert werden:

```bash
openssl rand -base64 32
```

Oder online: https://generate-secret.vercel.app/32

## Datenbank Setup

### Prisma Migrations

Die Datenbank-Schema-Änderungen werden über Prisma Migrations verwaltet:

```bash
# Neue Migration erstellen
npm run prisma:migrate

# Migrationen in Production anwenden
npx prisma migrate deploy
```

### Datenbank Schema

Das Schema befindet sich in `prisma/schema.prisma` und enthält:

- **User**: Benutzer mit Rollen (ADMIN, USER)
- **BotpressAnalytics**: Analytics-Daten von Botpress
- **ChatbotAnalytics**: Analytics-Daten von Chatbots

### Seeds (Demo-Daten)

Demo-Daten können mit folgendem Befehl eingespielt werden:

```bash
npm run prisma:seed
```

**Wichtig**: Seeds löschen vorhandene Daten und erstellen neue Demo-Daten.

## Deployment

### Docker / Docker Compose

#### Voraussetzungen

Erstelle eine `.env` Datei mit allen erforderlichen Variablen (siehe oben).

#### Starten

```bash
docker-compose up -d
```

Die Anwendung läuft auf Port 3000 (konfigurierbar über `APP_PORT` in `.env`).

#### Stoppen

```bash
docker-compose down
```

#### Production Build mit Docker

```bash
# Build für Production
docker build --target runner -t botpress-dashboard:latest .

# Container starten
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://user:password@host:3306/dbname" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e ADMIN_EMAIL="admin@example.com" \
  -e ADMIN_PASSWORD="password" \
  botpress-dashboard:latest
```

### Standalone Next.js Build

Die Anwendung ist für Standalone-Build konfiguriert (`next.config.ts`):

```bash
# Build erstellen
npm run build

# Production Server starten
npm start
```

**Wichtig**: Vor dem Build müssen folgende Schritte ausgeführt werden:

1. Prisma Client generieren: `npm run prisma:generate`
2. Datenbank-Migrationen: `npx prisma migrate deploy`
3. Alle ENV-Variablen müssen gesetzt sein

### Production Deployment Checkliste

- [ ] Alle ENV-Variablen sind gesetzt
- [ ] `NEXTAUTH_SECRET` ist ein sicherer, zufälliger String (mind. 32 Zeichen)
- [ ] `DATABASE_URL` zeigt auf die Production-Datenbank
- [ ] `ADMIN_EMAIL` und `ADMIN_PASSWORD` sind gesetzt
- [ ] Prisma Client wurde generiert (`npm run prisma:generate`)
- [ ] Datenbank-Migrationen wurden ausgeführt (`npx prisma migrate deploy`)
- [ ] Next.js Build wurde erfolgreich erstellt (`npm run build`)
- [ ] MySQL-Datenbank ist erreichbar und läuft
- [ ] Port 3000 (oder konfigurierter Port) ist verfügbar

## Wichtige Deployment-Hinweise

### Prisma Client Generation

Der Prisma Client **muss** vor jedem Build generiert werden:

```bash
npm run prisma:generate
```

Im Dockerfile ist dies bereits integriert, bei manuellem Deployment muss dies beachtet werden.

### Datenbank-Migrationen

**Vor dem ersten Start** müssen Migrationen ausgeführt werden:

```bash
# Development
npm run prisma:migrate

# Production
npx prisma migrate deploy
```

### NextAuth Secret

Der `NEXTAUTH_SECRET` **muss** in Production gesetzt sein, sonst funktioniert die Authentifizierung nicht. Verwende einen sicheren, zufälligen String.

### Standalone Output

Die `next.config.ts` ist für Standalone-Output konfiguriert. Dies ermöglicht kleinere Docker-Images und bessere Performance.

### MySQL Connection String Format

Das Format für `DATABASE_URL` ist:

```
mysql://[user]:[password]@[host]:[port]/[database]
```

Beispiele:
- Lokal: `mysql://root:password@localhost:3306/botpress_db`
- Docker: `mysql://botpress_user:password@mysql:3306/botpress_db`
- Remote: `mysql://user:password@db.example.com:3306/botpress_db`

### Admin-Login

Der Admin-Login funktioniert über die ENV-Variablen `ADMIN_EMAIL` und `ADMIN_PASSWORD`. Diese müssen in **allen Umgebungen** (Development und Production) gesetzt sein.

Nach dem ersten Login können weitere Admin-User über die Admin-Oberfläche erstellt werden.

## Troubleshooting

### Problem: "Prisma Client not generated"

**Lösung**: Führe `npm run prisma:generate` aus.

### Problem: "Invalid DATABASE_URL"

**Lösung**: Überprüfe das Format der Connection String. Stelle sicher, dass:
- User, Password, Host, Port und Database korrekt sind
- Die Datenbank existiert
- MySQL-Server läuft und erreichbar ist

### Problem: "NEXTAUTH_SECRET is missing"

**Lösung**: Setze die `NEXTAUTH_SECRET` Umgebungsvariable mit einem sicheren, zufälligen String.

### Problem: "Admin Login funktioniert nicht"

**Lösung**: Überprüfe, ob `ADMIN_EMAIL` und `ADMIN_PASSWORD` korrekt gesetzt sind. Die Werte müssen exakt übereinstimmen (Case-sensitive).

### Problem: "Docker Container startet nicht"

**Lösung**: 
- Überprüfe die Logs: `docker-compose logs`
- Stelle sicher, dass MySQL-Container läuft: `docker-compose ps`
- Überprüfe die `.env` Datei auf korrekte Werte

### Problem: "Migrationen schlagen fehl"

**Lösung**:
- Stelle sicher, dass die Datenbank existiert
- Überprüfe die Datenbank-Berechtigungen
- Führe `npx prisma migrate reset` aus (löscht alle Daten!)

## Scripts

| Befehl | Beschreibung |
|--------|-------------|
| `npm run dev` | Startet Development Server |
| `npm run build` | Erstellt Production Build |
| `npm start` | Startet Production Server |
| `npm run lint` | Führt ESLint aus |
| `npm run prisma:generate` | Generiert Prisma Client |
| `npm run prisma:migrate` | Führt Migrationen aus (Development) |
| `npm run prisma:push` | Push Schema zur Datenbank (ohne Migration) |
| `npm run prisma:studio` | Öffnet Prisma Studio |
| `npm run prisma:seed` | Spielt Demo-Daten ein |

## Technologie-Stack

- **Framework**: Next.js 16
- **React**: 19
- **Datenbank**: MySQL 8.0
- **ORM**: Prisma
- **Authentifizierung**: NextAuth.js
- **Styling**: SCSS Modules
- **Charts**: Recharts
- **Date Picker**: react-datepicker
- **Word Cloud**: react-wordcloud

## Support

Bei Problemen oder Fragen, erstelle ein Issue im Repository oder kontaktiere das Entwicklungsteam.
