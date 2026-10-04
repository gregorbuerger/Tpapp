# Tanken & Parken v5.1

## Parkmodul 2.0 – erster Neuaufbau

- Alter Parkplatz-Code, Cache-, Report-, Heuristik- und Clusterpfad nicht weiterverwendet.
- Neue einfache OSM-Pipeline: Ziel -> Overpass -> Normalisierung -> GeoJSON -> MapLibre.
- `amenity=parking` und `amenity=parking_entrance` werden geladen.
- Nur explizites Straßenparken (`street_side`, `lane`, `on_kerb` usw.) wird in dieser Basisversion ausgeschlossen.
- Keine Supermarkt-, Groessen-, Adress- oder Zugangs-Heuristiken. OSM-Zugangsdaten werden stattdessen transparent in den Details angezeigt.
- Parkplatz/Parkhaus/Tiefgarage werden unterschieden.
- Parkbedingungen und Beschilderung vor Ort werden ausdrücklich zur Prüfung empfohlen.
- Tankstellenmodul und Tankerkoenig/Val-Town-Anbindung bleiben erhalten.
