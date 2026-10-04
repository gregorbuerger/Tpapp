# Tanken & Parken v4.2

Mobile-first PWA für GitHub Pages.

## Neu in v4.2
- Alle alten, manuell im App-Code hinterlegten Pilot-Parkplätze aus Ottobeuren und Memmingen wurden vollständig entfernt.
- Es gibt keine interne `PLACES`-Liste und keine alten manuellen Parkplatz-Koordinaten mehr.
- Parkplatzsuche basiert jetzt ausschließlich auf den dynamisch geladenen OSM/Overpass-Daten.
- Der Relevanzfilter bleibt bestehen: Parkhäuser, Tiefgaragen, P+R und größere öffentliche Parkplätze haben Vorrang; sinnvolle benannte/ausreichend große öffentliche Parkplätze dienen als Fallback.
- Straßenparkreihen sowie private, Kunden-, Mitarbeiter- und Bewohnerparkplätze bleiben ausgeschlossen.
- Fehlende Adressen werden nicht erfunden. Navigation nutzt die Koordinaten der jeweiligen Datenquelle.
- Tankerkönig-Livepreise bleiben unverändert erhalten.
- Cache und Updateanzeige auf v4.2 aktualisiert.
