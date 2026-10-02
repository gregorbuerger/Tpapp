# Tanken & Parken – Pilot v2.3

Mobile-first PWA für das Pilotgebiet Ottobeuren–Memmingen.

## v2.3
- Keine Demo-Tankstellen, Demo-Spritpreise oder simulierten Belegungen.
- Sichtbare Versionsnummer v2.3.
- Update-Schaltfläche in der App.
- Service Worker aktualisiert sich beim Start und zusätzlich regelmäßig.
- Neue Service-Worker-Version übernimmt sofort (`skipWaiting`/`clients.claim`).
- Alte App-Caches werden beim Aktivieren gelöscht.
- Navigation/index.html wird network-first und ohne Browsercache geladen, damit GitHub-Pages-Updates nicht an einer alten App-Shell hängen bleiben.
- Parkplatzdaten des Pilotstands bleiben erhalten; fehlende Live-Belegung wird ausdrücklich als solche angezeigt.
