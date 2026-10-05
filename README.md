# Tanken & Parken v5.13

## Parkmodul 2.0 – sauberer Schnitt

- Alle alten Parkplatz-Cache-/Report-Schluessel werden beim Start entfernt.
- Es gibt nur noch einen Parkplatz-Zustand: `parkingItems` aus der aktuellen Overpass-Abfrage.
- Ergebnisliste, Diagnose und MapLibre-GeoJSON werden aus genau diesem Zustand erzeugt.
- Keine Migration oder Wiederverwendung alter Parkplatzdaten.
- `amenity=parking` und `amenity=parking_entrance` werden geladen.
- Nur explizites Straßenparken (`street_side`, `lane`, `on_kerb` usw.) wird ausgeschlossen.
- Tankstellenmodul bleibt getrennt und unverändert.
- Service Worker und Assets sind konsistent auf v5.13 versioniert.

- Kleine UI-Aenderung: Nach Auswahl eines Adressvorschlags wird die Vorschlagsliste sofort geleert und geschlossen.

- Parkmodul 2.0: lokale Meldefunktion pro OSM-Objekt hinzugefügt.
- Meldungen bleiben ausschließlich auf dem Gerät und färben den betreffenden Parkplatzmarker orange.
