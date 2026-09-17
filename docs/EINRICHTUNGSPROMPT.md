# Einrichtung mit Codex oder Claude Code

Öffne zuerst deine eigene Kopie dieses Repositories im Coding-Assistenten. Verbinde deinen eigenen GitHub- und Vercel-Account über die offiziellen Anmeldungen. Dann diesen Prompt verwenden:

> Richte diese Design Library als meine eigene Anwendung auf Vercel ein. Lies zuerst die README und vorhandene Projektanweisungen. Verwende die fertige Anwendung; programmiere sie nicht neu und verwende keinen VPS oder Docker.
>
> Prüfe, ob dieses Repository meine eigene Kopie ist. Arbeite nicht im öffentlichen heyfreiheit-Template. Verbinde das Projekt mit meinem Vercel-Account. Ich brauche eine eigene Neon-Postgres-Datenbank und einen privaten Vercel Blob Store. Nutze niemals Speicher oder Zugangsdaten anderer Teilnehmer. Bevor kostenpflichtige Ressourcen gebucht werden, zeige mir die konkrete Auswahl und Kosten.
>
> Prüfe DATABASE_URL und BLOB_READ_WRITE_TOKEN, erzeuge VAULT_ENCRYPTION_KEY und SETUP_TOKEN lokal mit dem vorhandenen Skript und hinterlege sie als serverseitige Umgebungsvariablen. Zeige Geheimnisse nicht im Chat, committe sie nicht und verwende keine NEXT_PUBLIC-Variablen dafür. Wenn eine Anmeldung oder ein Dashboard-Schritt meine Bedienung erfordert, erkläre genau diesen nächsten Schritt.
>
> Führe Tests und Build aus und deploye meine Kopie. Öffne danach /setup, damit ich meinen Einrichtungsschlüssel und mein eigenes Passwort selbst eingeben kann. Danach hinterlege ich OpenAI oder Anthropic und optional Browserless direkt in der Einstellungsseite.
>
> Prüfe Login, die 34 Startprofile, das Speichern einer eigenen Referenz und die Persistenz nach Neuladen. Prüfe, dass unangemeldete Besucher weder Einstellungen noch Bilder oder Schreibfunktionen aufrufen können. Führe eine kostenpflichtige KI-/Browseraufnahme erst aus, nachdem meine Schlüssel eingerichtet sind und ich den Test angefordert habe. Erstelle keine vermeintlich erfolgreichen Testberichte für ungetestete externe Verbindungen. Gib mir am Ende meine URL, die verbleibenden Schritte und kurze Hinweise zu Kontingenten und Datensicherung.

Kein Coding-Assistent kann die nötigen Anbieter-Accounts oder deren Abrechnung durch ein ChatGPT-/Claude-Abo ersetzen. Wenn keine Cloud-Verbindung verfügbar ist, kann er dieselben Schritte über die Anbieter-CLI oder mit dir im Dashboard durchführen.
