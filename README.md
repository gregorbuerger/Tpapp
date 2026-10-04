# Tanken & Parken v4.16

## Neu in v4.16
- Parkplatz-Auswahlpfad neu geordnet: Reverse-Geocoding/Adressauflösung wird abgeschlossen, bevor die Detailkarte geöffnet wird.
- Parkplatz-Zentrierung läuft danach genau einmal über denselben Auswahl-/Zentrierungspfad, der bei Tankstellen bereits korrekt funktioniert.
- Der funktionierende Tankstellenpfad wurde nicht verändert.
- Parkplatz-Performance und lokaler OSM-Cache aus v4.11 bleiben erhalten.
- Service-Worker-URL, Updateanzeige, UI-Version und Cache konsistent auf v4.16.

## Verhalten
Parkplatz auswählen -> Adresse vervollständigen -> Detailkarte rendern -> freien Kartenbereich messen -> Marker zentrieren.
