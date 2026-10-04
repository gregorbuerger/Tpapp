# Tanken & Parken v4.11

## Neu in v4.11
- Updatepfad repariert: UI, Updateanzeige und Service-Worker-Cache verwenden jetzt konsistent v4.11.
- Eigene CSS/JS/Manifest-Dateien werden versionsgebunden geladen, damit iOS/GitHub Pages keine alte App-Datei festhalten.
- Service Worker wird mit `updateViaCache: none` und versionsgebundener URL registriert; alte App-Caches werden beim Aktivieren gelöscht.
- Blaue, verkehrsnahe Parkplatzmarker für Parkplatz, Parkhaus und Tiefgarage.
- Parkplatzadressen wieder prominent in der Detailansicht, sofern OSM sie liefert.
- „In Karten ansehen“ ersetzt die direkte Navigation; Apple Karten und Google Maps öffnen den Ort zur Prüfung.
- Ergebnisliste und Detailkarte schließen sich gegenseitig aus.
- Verbesserter Kunden-/Supermarktfilter: explizit eingeschränkte Parkplätze sowie eindeutig supermarktnahe Parkflächen werden nicht empfohlen.
- Neue Funktion „Problem melden“ für Parkplätze. Meldungen werden in dieser Hobbyversion lokal auf dem Gerät gespeichert und als Warnung am Marker/Detail angezeigt.
- Keine alten manuellen Pilot-Parkplatzdaten.
- Cache und Updateanzeige auf v4.11.


v4.11: Parkplatzfilter auf eindeutige Ausschlusskriterien reduziert; Kartenmitte ist wieder ein echter Suchbezug; Diagnose geladen/ausgeschlossen/angezeigt.
