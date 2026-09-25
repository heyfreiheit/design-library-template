# Design Library · Community Template

Deine eigene Designbibliothek: Websites sammeln, Gestaltung verstehen und daraus bessere Briefings für Codex, Claude Code und eigene Projekte erstellen.

**Für Vercel vorbereitet. Mit dauerhaftem Cloud-Speicher, Login und deutscher Oberfläche. Kein eigener Server, kein Docker.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fheyfreiheit%2Fdesign-library-template&project-name=design-library&repository-name=my-design-library)

Der Button kopiert und deployt die Anwendung. Danach verbindest du einmal die Datenbank und den privaten Bildspeicher und legst deinen Zugang an. Das ist kein vollständig konfigurierter Ein-Klick-Dienst.

## Das ist enthalten

- 34 kuratierte Designprofile aus Premium, Gastronomie, Hotellerie, SaaS und Finance; zehn passende Sammlungen.
- Eigene Referenzen hinzufügen, bearbeiten, löschen, suchen und bis zu drei vergleichen.
- Designvokabular, Komposition, Bildrezepte, persönliche Vorlieben und kopierbare KI-Briefings auf Deutsch.
- Komplette Website-Screenshots per Link, Lazy-Loading und Cookie-Banner-Behandlung über Browserless; bevorzugt Ablehnen, danach bei erkennbaren Bannern Akzeptieren.
- PNG-, JPEG- und WebP-Uploads bis 50 MB direkt in deinen privaten Bildspeicher.
- KI-Vorschläge für Titel, Beschreibung und bestehende oder neue Sammlung mit OpenAI oder Anthropic. Du prüfst Vorschläge vor dem Speichern.
- Modellliste aus deinem API-Konto plus manuelle Modell-ID; das Modell muss Bilder und strukturierte Antworten unterstützen.
- Bewegungs- und Interaktionsprofile, Scroll-Clips und vorsichtige KI-Auswertung einer Bildfolge. Hover/Klick und Originalcode werden nicht automatisch ausgelesen.
- Login, Admin-/Mitgliedsrollen, Teamverwaltung, dauerhaft verschlüsselte API-Schlüssel, Light-/Dark-Mode.

**Die 46 ursprünglichen Demo-Referenzen und Website-Screenshots von Chase sind nicht enthalten.** Unsere 34 Profile und Links sind sofort da. Fremde Website-Screenshots werden nicht als frei lizenzierte Bildsammlung verteilt: Du erzeugst eigene Aufnahmen nach der Einrichtung unter **Einstellungen → Fehlende Screenshots erstellen**. Bis dahin zeigen die Profile eine neutrale Vorschau. Quellen, Marken und Website-Designs gehören ihren jeweiligen Rechteinhabern.

## Schnellstart: deine eigene Library

### 1. Vorlage kopieren und deployen

Nutze den Deploy-Button oben oder **Use this template → Create a new repository** auf GitHub. Erstelle deine Kopie vorzugsweise privat. Importiere sie in Vercel als Next.js-Projekt. Der Projektordner ist das Repository-Hauptverzeichnis, Node.js-Version **22.x**. Keine speziellen Build-Befehle nötig.

Beim ersten Aufruf zeigt `/setup`, welche Verbindungen noch fehlen. Die leere App darf bereits deployt sein; bis zur geschützten Einrichtung kann niemand einen Zugang anlegen.

### 2. Dauerhafte Datenbank verbinden

Im Vercel-Projekt unter **Storage / Marketplace** eine eigene **Neon Postgres**-Datenbank erstellen und verbinden. Die gepoolte Verbindungsadresse muss als `DATABASE_URL` verfügbar sein (einschließlich `sslmode=require`). Falls die Integration einen anderen Variablennamen erzeugt, dessen Wert zusätzlich als `DATABASE_URL` setzen. Die Tabellen werden automatisch beim ersten Aufruf angelegt.

### 3. Privaten Bildspeicher verbinden

Unter **Storage → Blob** einen Store mit Zugriff **Private** anlegen und mit dem Projekt verbinden. `BLOB_READ_WRITE_TOKEN` wird für die direkten Browser-Uploads benötigt. Nicht `NEXT_PUBLIC_...` nennen. Die Library liefert Bilder und Videos nur nach Anmeldung aus.

Nutze für Tests/Preview eigene Speicher und eine eigene Datenbank. Verbinde fremde Preview-Deployments nicht mit deinen Produktionsdaten.

### 4. Zwei Geheimnisse erzeugen

In Codex/Claude Code im Projekt ausführen:

```bash
node scripts/setup-secrets.mjs
```

Die beiden ausgegebenen Werte in **Vercel → Settings → Environment Variables** hinterlegen:

- `VAULT_ENCRYPTION_KEY`: verschlüsselt die API-Schlüssel. Sicher aufbewahren und nicht beliebig ändern, sonst werden gespeicherte Schlüssel unlesbar.
- `SETUP_TOKEN`: schützt die einmalige Einrichtung. Nicht ins Repository oder ins YouTube-Video kopieren.

Danach **Redeploy** auslösen. Keine echten Schlüssel in Chat-Nachrichten oder Git-Dateien einfügen. Das Skript erzeugt die Werte lokal; die KI muss sie nicht veröffentlichen.

### 5. Eigenen Zugang anlegen

Deine Vercel-URL öffnen. Unter `/setup` den `SETUP_TOKEN`, deinen Namen, Benutzernamen und ein Passwort mit mindestens zwölf Zeichen eingeben. Damit entsteht dein Administratorkonto; die öffentliche Registrierung ist danach geschlossen. Weitere Nutzer können nur Admins unter **Einstellungen → Team & Zugänge** anlegen.

Jede Installation ist eine gemeinsame private Library für dich und dein eingeladenes Team. Andere Teilnehmer erstellen ihre eigene Installation und eigene Speicher. Dies ist keine Mandantenplattform mit getrennten Libraries innerhalb einer Installation.

### 6. Werkzeuge verbinden

Unter **Einstellungen → KI & Verbindung**:

1. **OpenAI oder Anthropic** auswählen, eigenen API-Schlüssel eingeben.
2. **Verfügbare Modelle laden**, bildfähiges Modell auswählen, KI aktivieren und speichern. Ein ChatGPT-/Claude-Abonnement ersetzt kein API-Guthaben.
3. Optional **Browserless** verbinden: eigener Shared-Fleet-API-Token und passende Region. Für Scroll-Videos muss das Konto Browserless Recording auf der Stealth-Route unterstützen. Ohne Browserless funktionieren Uploads, KI-Auswertung und manuelle Bewegungsprofile weiterhin.
4. **Fehlende Screenshots erstellen** starten. Der Vorgang verarbeitet die 34 Profile nacheinander, überschreibt keine vorhandenen Bilder und lässt sich nach Fehlern erneut starten. Tab geöffnet lassen; das verbraucht Browserless-Kontingent und kann mehrere Minuten dauern.

Die API-Schlüssel werden serverseitig mit AES-256-GCM verschlüsselt in deiner Datenbank gespeichert. Nach dem Speichern werden sie nicht wieder an den Browser ausgeliefert. Screenshots werden nur bei einer Analyse an den ausgewählten KI-Anbieter gesendet.

## Einrichtung mit Codex oder Claude Code

Kopiere den [Einrichtungsprompt](docs/EINRICHTUNGSPROMPT.md) in deinen Coding-Assistenten. Er hilft bei der vorhandenen Vorlage, den Vercel-Verbindungen und den Prüfungen. Das Projekt muss nicht neu programmiert werden.

Die [kurze Ressourcen-Seite für Skool](docs/SKOOL.md) kannst du direkt für dein Video verwenden.

## Kosten und Grenzen

Die Anwendung ist keine Zusage für dauerhaft kostenlosen Betrieb. Vercel, Neon, Blob, Browserless und der KI-Anbieter haben eigene Tarife und Kontingente. Für einen kleinen persönlichen Bestand können kostenlose Kontingente reichen; lange Screenshots und Videos verbrauchen Speicher und Datentransfer. Prüfe die aktuellen Werte vor der Einrichtung:

- [Vercel Hobby](https://vercel.com/docs/plans/hobby): ausschließlich persönliche, nicht kommerzielle Nutzung; geschäftliche Nutzung benötigt einen passenden Tarif.
- [Vercel Blob](https://vercel.com/docs/vercel-blob/usage-and-pricing), [Neon](https://neon.com/pricing), [Browserless](https://www.browserless.io/pricing).
- [OpenAI API](https://openai.com/api/pricing/), [Anthropic API](https://platform.claude.com/docs/en/about-claude/pricing).

Die Library benötigt keinen ständig laufenden Chromium-Prozess auf Vercel. Browserless führt die Website-Aufnahmen isoliert außerhalb deiner Anwendung aus. Geschützte Seiten, CAPTCHAs, unendliches Scrollen und einzelne Cookie-Dialoge können automatische Aufnahmen verhindern. In solchen Fällen einen eigenen Screenshot hochladen. Aufnahmen sind auf 60.000 Pixel Seitenhöhe begrenzt und werden als JPEG bis 3 MB komprimiert. Scroll-Clips sind Desktop-Stichproben, keine vollständige Interaktionsprüfung.

Der Browserless-Timeout in der Verbindungs-URL beträgt für Screenshots und Scroll-Clips 110.000 ms. Ältere Kopien verwenden 150.000 ms, was bei Konten mit einem Zwei-Minuten-Limit bereits beim Verbindungsaufbau abgelehnt werden kann. Aktualisiere in diesem Fall deine Kopie: in `lib/capture-server.ts` den `timeout`-Wert auf `110000` setzen, Tests ausführen und neu deployen. Änderungen am Template werden nicht automatisch in bestehende Kopien übernommen. Die kürzere Sitzungsdauer ersetzt keine nötige Recording-Berechtigung und garantiert keine Aufnahme jeder Website.

Dauerhafter Cloud-Speicher bedeutet: Daten bleiben über Browserwechsel und App-Deployments erhalten. Er ersetzt kein Backup. Sichere Datenbank, Blob-Dateien und den Verschlüsselungsschlüssel; lösche beim Redeploy keine verbundenen Speicher.

## Lokal entwickeln

Node.js 22.13+ innerhalb der 22er-Version installieren, `.env.example` nach `.env.local` kopieren und eigene Testverbindungen eintragen:

```bash
npm ci
npm run dev
```

Dann `http://localhost:3000` öffnen. Entwicklungs- und Produktionsdaten getrennt halten.

```bash
npm test
npm run lint
npm run build
```

Browser-Integrationstests: siehe [TESTING.md](docs/TESTING.md). Tests gegen KI/Blob benutzen kontrollierte Testantworten; reale Anbieter benötigen eigene Zugangsdaten und müssen nach Einrichtung mit einer Referenz geprüft werden.

## Technischer Aufbau

Next.js auf Vercel; Postgres (empfohlen Neon) für Nutzer, Profile und verschlüsselte Einstellungen; privater Vercel Blob Store für Bilder/Videos; Browserless für Browseraufnahmen. Es gibt keine VPS-Adressen, Docker-Abhängigkeiten, vorgegebenen Administratorkonten oder produktiven Zugangsdaten in dieser Vorlage.

Die ausführlichen Profile in `data/gallery.json` bilden den Startbestand. Eigene Änderungen und Löschungen liegen in Postgres; gelöschte Startreferenzen erscheinen nach einem Neustart nicht erneut. Neue Versionen dieser Vorlage werden nicht automatisch in deine Projektkopie übernommen. Vor Updates sichern, Änderungen prüfen und testen.

## Herkunft und Lizenz

Aufgebaut auf [Taste Vault von Chase / Chase AI](https://github.com/cth9191/taste-vault), weiterentwickelt von heyfreiheit. Die MIT-Hinweise sind in [UPSTREAM-LICENSE](UPSTREAM-LICENSE) erhalten; eigener Code steht ebenfalls unter [MIT](LICENSE). Vorhandene Hinweise für eingebundene Bibliotheken bleiben erhalten.

Die Code-Lizenz überträgt keine Rechte an den analysierten Websites, Marken oder Screenshots. Die kuratierten Links und redaktionellen Einordnungen sind Inspiration für eigene Arbeiten, keine Lizenz zum Kopieren fremder Websites.
