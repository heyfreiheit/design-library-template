# Prüfungen

```bash
npm ci
npm test
npm run lint
npm run build
npx playwright install chromium
npm run test:capture
npm run test:e2e
```

Die Browserprüfung startet selbst eine isolierte, leere PGlite-Testdatenbank auf `127.0.0.1:55439` und Next.js auf `127.0.0.1:3187`. Es werden nur ausdrücklich fiktive Testschlüssel verwendet. Keine Verbindung zu Produktionsdaten. Die Testdatenbank ist nach dem Test weg.

Geprüft werden Ersteinrichtung und deren Sperre nach Kontoanlage, Ablehnung falscher Einrichtungsschlüssel, anonymer Zugriffsschutz, die 34 Profile/zehn Sammlungen, Bearbeiten und Neuladen, Vorlieben, Login/Logout, Teamkonto mit Passwortwechsel, Mitgliedsrechte, Löschen mit dauerhaftem Tombstone und Verschlüsselung/Redaktion von Einstellungen. Dazu gibt es Desktop-/Mobile-Screenshots unter `test-results/` (nicht im Repository).

`npm test` prüft außerdem Profilvalidierung, URL-Filter, beide KI-Anbieter mit kontrollierten Antworten, unvollständige Antworten/Fehler, Modelllisten und Eigentümerbindung/Verfall/Einmalverwendung direkter Uploads sowie Passwort- und Schlüssel-Kryptografie.

Die Anbieter-Vertragstests ersetzen keine echten Cloud-Aufrufe. Nach Verbindung eigener Konten einmal manuell prüfen:

- Ein Bild hochladen, speichern und nach Ab-/Anmeldung öffnen; privater Blob Store, keine öffentlichen Bild-URLs.
- Ein kleines Referenzbild mit dem gewählten OpenAI-/Anthropic-Modell analysieren.
- Eine öffentliche Website über Browserless aufnehmen; danach Scroll-Clip prüfen. Recording benötigt die passenden Browserless-Funktionen im eigenen Konto.
- Auf Vercel das Starterpaket mit einem Profil testen, danach bei ausreichendem Kontingent den restlichen Import starten.

Kein Produktiv-Test wird mit fremden API-Schlüsseln oder der privaten heyfreiheit-Library ausgeführt.

`npm run test:capture` prüft an einer eigenen Testwebsite im echten Chromium-Browser das Ablehnen eines Cookie-Banners, vollständige Seitenhöhe und JPEG-Kompression. Die Browserless-Verbindung ist dabei ersetzt; der kostenpflichtige Cloud-Dienst wird nicht aufgerufen.
