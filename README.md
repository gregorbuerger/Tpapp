# Tanken & Parken v3.5

Mobile-first PWA für GitHub Pages.

Neu in v3.5:
- ausgewählte Parkplätze und Tankstellen werden auf der Karte hervorgehoben
- geschlossene Tankstellen zeigen auf der Karte „Zu“ statt eines Preises
- kompaktere Detailkarte ohne Überlagerung der Ergebnisleiste
- Navigation zu Parkplatz/Tankstelle über Apple Karten oder Google Maps
- zuletzt verwendete Navi-App wird lokal gemerkt und hervorgehoben
- Tankerkönig/MTS-K Live-Daten bleiben über Val Town angebunden
- Cache und Updateanzeige auf v3.5


## v3.5
- Eigener georteter Standort als blauer Punkt mit Genauigkeitskreis.
- Kraftstoffdaten zeigen den Zeitpunkt des letzten Abrufs.
- Kein erfundener Preisänderungs-Zeitstempel; Standard-API liefert diesen nicht.


## v3.5
- Regression behoben: OSM-Parkzustand ist initialisiert, sodass der gemeinsame Renderpfad nicht mehr vor dem Tankerkoenig-Ladevorgang abbricht.
- Parkplatz-Marker oeffnen die kompakte Detailkarte wieder unmittelbar beim Antippen.
- Parken und Tanken bleiben getrennte Provider und koennen im Modus Alles gemeinsam gerendert werden.
