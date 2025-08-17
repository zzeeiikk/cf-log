# 🚀 cf-log Cloud Version Setup

Diese Anleitung zeigt dir, wie du die Cloud-Version von cf-log mit Supabase einrichtest.

## 📋 Voraussetzungen

- Supabase Account (kostenlos)
- Stripe Account (für Payments, optional für den Start)

## 🔧 Supabase Setup

### 1. Supabase Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com) und erstelle ein kostenloses Konto
2. Erstelle ein neues Projekt
3. Wähle eine Region (am besten nahe deinen Nutzern)
4. Warte bis das Projekt bereit ist

### 2. Database Schema einrichten

1. Gehe zu **SQL Editor** in deinem Supabase Dashboard
2. Kopiere den Inhalt von `supabase/schema.sql`
3. Führe das SQL-Skript aus

### 3. API Keys konfigurieren

1. Gehe zu **Settings > API** in deinem Supabase Dashboard
2. Kopiere die **Project URL** und **anon public** Key
3. Öffne `src/cloud-config.js`
4. Setze die Werte:

```javascript
supabase: {
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key',
},
```

### 4. Auth Einstellungen

1. Gehe zu **Authentication > Settings**
2. Aktiviere **Email Auth**
3. Optional: Aktiviere **Google OAuth** oder **GitHub OAuth**
4. Setze **Site URL** auf deine Domain

## 💳 Stripe Setup (Optional für den Start)

### 1. Stripe Account erstellen

1. Gehe zu [stripe.com](https://stripe.com) und erstelle ein Konto
2. Gehe zu **Developers > API keys**
3. Kopiere den **Publishable key**

### 2. Products & Prices erstellen

1. Gehe zu **Products** in Stripe
2. Erstelle zwei Produkte:
   - **cf-log Pro** (€4,99/Monat)
   - **cf-log Team** (€9,99/Monat)
3. Kopiere die **Price IDs**

### 3. Stripe Keys konfigurieren

In `src/cloud-config.js`:

```javascript
stripe: {
  publishableKey: 'pk_test_...',
  priceIds: {
    pro: 'price_...',
    team: 'price_...',
  }
}
```

## 🌐 Deployment

### Option 1: Vercel (Empfohlen)

1. Installiere Vercel CLI: `npm i -g vercel`
2. Führe `vercel` im Projektordner aus
3. Setze Environment Variables in Vercel Dashboard

### Option 2: Netlify

1. Verbinde dein GitHub Repository mit Netlify
2. Setze Build Command: leer lassen
3. Setze Publish Directory: `.`
4. Setze Environment Variables

### Option 3: GitHub Pages

1. Aktiviere GitHub Pages in deinem Repository
2. Setze Source auf **main** branch
3. Deploye automatisch bei jedem Push

## 🔐 Environment Variables

Setze diese Environment Variables in deinem Hosting-Service:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 📊 Monitoring

### Supabase Dashboard

- **Database**: Überwache Query-Performance
- **Auth**: User-Registrierungen und Logins
- **Storage**: Datei-Uploads (falls verwendet)

### Stripe Dashboard

- **Payments**: Überwache erfolgreiche Zahlungen
- **Customers**: Neue Kunden
- **Subscriptions**: Aktive Abonnements

## 🚀 Nächste Schritte

1. **Testing**: Teste alle Features lokal
2. **Beta Launch**: Starte mit einigen Test-Usern
3. **Feedback**: Sammle Feedback und verbessere
4. **Marketing**: Bewerbe die Cloud-Version
5. **Scaling**: Überwache Performance und skaliere bei Bedarf

## 💡 Tipps

- **Kostenloser Plan**: Supabase ist kostenlos bis 50.000 MAU
- **Backup**: Supabase macht automatisch Backups
- **Security**: Row Level Security ist bereits konfiguriert
- **Performance**: Indexes sind für optimale Performance eingerichtet

## 🆘 Support

Bei Problemen:
1. Überprüfe die Supabase Logs
2. Teste die API-Endpoints
3. Überprüfe die Browser-Konsole
4. Kontaktiere den Supabase Support

---

**Viel Erfolg mit deiner Cloud-Version! 🎉**
