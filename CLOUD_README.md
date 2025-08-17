# ☁️ cf-log Cloud Version

Die Cloud-Version von cf-log bietet zusätzliche Features wie automatische Synchronisation, erweiterte Statistiken und Multi-Device-Support.

## ✨ Cloud Features

### 🔐 Benutzer-Management
- **Registrierung & Login** mit E-Mail/Passwort
- **Automatische Profilerstellung** bei Registrierung
- **Sichere Authentifizierung** über Supabase Auth

### ☁️ Cloud-Speicherung
- **Automatische Synchronisation** zwischen Geräten
- **Realtime-Updates** (Pro-Plan)
- **Automatische Backups** in der Cloud
- **Offline-First** Ansatz mit lokaler Speicherung

### 📊 Erweiterte Features
- **Usage Tracking** und Limits
- **Subscription Management**
- **CSV-Export** (Pro-Plan)
- **Erweiterte Statistiken** (Pro-Plan)

## 🚀 Schnellstart

### 1. Supabase Projekt einrichten

1. Gehe zu [supabase.com](https://supabase.com) und erstelle ein kostenloses Konto
2. Erstelle ein neues Projekt
3. Führe das SQL-Schema aus (`supabase/schema.sql`)
4. Kopiere die API-Keys

### 2. Konfiguration

Öffne `src/cloud-config.js` und setze deine Supabase-Keys:

```javascript
supabase: {
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key',
},
```

### 3. Cloud-Modus aktivieren

```javascript
// Cloud-Modus aktivieren
await window.cloudStorage.enableCloudMode(
  'https://your-project.supabase.co',
  'your-anon-key'
);
```

## 💰 Pricing Plans

### 🆓 Kostenlos
- 100 Trainings pro Monat
- 10MB Speicherplatz
- Basis-Statistiken
- JSON-Export
- 1 Profil

### 💎 Pro (€4,99/Monat)
- Unbegrenzte Trainings
- 100MB Speicherplatz
- Erweiterte Statistiken
- CSV-Export
- Realtime-Synchronisation
- Automatische Backups

### 👥 Team (€9,99/Monat)
- Bis zu 5 Benutzer
- 500MB Speicherplatz
- Team-Statistiken
- Admin-Dashboard
- Alle Pro-Features

## 🔧 Technische Details

### Architektur
```
Frontend (Vanilla JS) → Supabase Client → Supabase Backend
                                    ↓
                              PostgreSQL Database
                                    ↓
                              Row Level Security
```

### Datenstruktur
- **User Profiles**: Benutzer-Informationen und Einstellungen
- **Training Data**: Trainingsdaten im JSON-Format
- **Subscriptions**: Abonnement-Status und Limits
- **Usage Tracking**: Monatliche Nutzungsstatistiken

### Sicherheit
- **Row Level Security**: Jeder User sieht nur seine eigenen Daten
- **JWT Authentication**: Sichere Token-basierte Authentifizierung
- **HTTPS**: Alle Verbindungen sind verschlüsselt
- **GDPR-konform**: Deutsche Datenschutz-Compliance

## 📱 Verwendung

### Registrierung
1. Klicke auf "Anmelden" im Header
2. Wähle "Registrieren"
3. Gib E-Mail, Passwort und Namen ein
4. Bestätige deine E-Mail-Adresse

### Cloud-Speicherung
- Nach der Anmeldung werden deine Daten automatisch in der Cloud gespeichert
- Änderungen werden sofort synchronisiert
- Bei Offline-Nutzung werden Daten lokal gespeichert und später synchronisiert

### Abonnement verwalten
1. Klicke auf deinen Namen im Header
2. Wähle "Abonnement"
3. Wähle einen Plan aus
4. Bezahle über Stripe

## 🔄 Migration von lokaler Speicherung

### Von GitHub Gists
1. Melde dich in der Cloud-Version an
2. Gehe zu Einstellungen → Daten importieren
3. Wähle deine GitHub Gists aus
4. Daten werden automatisch in die Cloud migriert

### Von WebDAV
1. Exportiere deine Daten als JSON
2. Importiere sie in die Cloud-Version
3. Daten werden automatisch synchronisiert

## 🛠️ Entwicklung

### Lokale Entwicklung
1. Klone das Repository
2. Erstelle ein Supabase-Projekt für Entwicklung
3. Setze die Development-Keys in `cloud-config.js`
4. Starte einen lokalen Server

### Testing
```bash
# Teste Cloud-Features
npm run test:cloud

# Teste Auth-Flow
npm run test:auth

# Teste Storage-Integration
npm run test:storage
```

## 📊 Monitoring

### Supabase Dashboard
- **Database**: Query-Performance und Nutzung
- **Auth**: Registrierungen und Logins
- **Storage**: Datei-Uploads und Speicherplatz

### Stripe Dashboard
- **Payments**: Erfolgreiche Zahlungen
- **Customers**: Neue Kunden
- **Subscriptions**: Aktive Abonnements

## 🆘 Support

### Häufige Probleme

**"Supabase Client konnte nicht initialisiert werden"**
- Überprüfe die API-Keys in `cloud-config.js`
- Stelle sicher, dass das Supabase-Projekt aktiv ist

**"Nutzungslimits überschritten"**
- Upgrade auf einen höheren Plan
- Lösche alte Trainingsdaten
- Kontaktiere den Support

**"Realtime Sync funktioniert nicht"**
- Überprüfe deinen Abonnement-Status
- Stelle sicher, dass du im Pro-Plan bist
- Überprüfe die Internetverbindung

### Support kontaktieren
- **E-Mail**: support@cf-log.com
- **GitHub Issues**: Für Bug-Reports
- **Discord**: Für Community-Support

## 🔮 Roadmap

### Q1 2024
- [ ] Team-Features
- [ ] Mobile App
- [ ] API für Third-Party-Integrationen

### Q2 2024
- [ ] KI-gestützte Trainingsempfehlungen
- [ ] Social Features
- [ ] Erweiterte Analytics

### Q3 2024
- [ ] Wearable-Integration
- [ ] Personal Trainer Features
- [ ] Enterprise-Pläne

---

**Viel Spaß mit der Cloud-Version! ☁️💪**
