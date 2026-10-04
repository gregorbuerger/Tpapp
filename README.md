# Tanken & Parken v4.0

Mobile-first PWA für GitHub Pages.

## Neu in v4.0
- Auswahl eines Treffers aus der Ergebnisliste minimiert die Liste automatisch, bevor die kompakte Detailkarte geöffnet wird.
- OSM-Parkplätze werden stärker nach Relevanz gefiltert: Parkhäuser, Tiefgaragen, P+R und größere öffentliche Parkplätze werden bevorzugt.
- Straßenparkreihen, Parkbuchten und ähnliche `street_side`/`lane`-Einträge werden nicht mehr als Zielparkplätze angezeigt.
- Wenn im 1-km-Radius relevante große Parkmöglichkeiten vorhanden sind, werden kleine OSM-Parkflächen ausgeblendet.
- Gibt es keine größeren Anlagen, bleibt ein begrenzter Fallback auf sinnvoll benannte bzw. ausreichend große öffentliche Parkplätze erhalten.
- Private, Kunden-, Mitarbeiter- und reine Bewohnerparkplätze bleiben weiterhin ausgeschlossen.
- Tankerkönig-Livepreise, Navigation, Standortanzeige und die verifizierten Zusatzdaten bleiben erhalten.
- Cache und Updateanzeige auf v4.0 aktualisiert.


## v4.0
- Parkplatzmarker nur noch bei belastbarer Adresse (Straße + Hausnummer).
- Vollständige Adressen in Parkplatz- und Tankstellendetails.
- Parkplatztyp-Marker konsistent: Parkplatz / Parkhaus / Tiefgarage.
- Tiefgarage Luitpoldstraße: offizielle Adresse Luitpoldstraße 9; Position wird beim Start anhand der Adresse aufgelöst.
