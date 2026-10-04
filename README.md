# Tanken & Parken v4.3

Mobile-first PWA für GitHub Pages.

## Neu in v4.3
- Alle alten, manuell im App-Code hinterlegten Pilot-Parkplätze aus Ottobeuren und Memmingen wurden vollständig entfernt.
- Es gibt keine interne `PLACES`-Liste und keine alten manuellen Parkplatz-Koordinaten mehr.
- Parkplatzsuche basiert jetzt ausschließlich auf den dynamisch geladenen OSM/Overpass-Daten.
- Der Relevanzfilter bleibt bestehen: Parkhäuser, Tiefgaragen, P+R und größere öffentliche Parkplätze haben Vorrang; sinnvolle benannte/ausreichend große öffentliche Parkplätze dienen als Fallback.
- Straßenparkreihen sowie private, Kunden-, Mitarbeiter- und Bewohnerparkplätze bleiben ausgeschlossen.
- Fehlende Adressen werden nicht erfunden. Navigation nutzt die Koordinaten der jeweiligen Datenquelle.
- Tankerkönig-Livepreise bleiben unverändert erhalten.
- Cache und Updateanzeige auf v4.3 aktualisiert.


## v4.3
- Kein Groessen-/Relevanz-Ausschluss mehr fuer oeffentliche OSM-Parkplaetze im 1-km-Radius.
- Parkhaus, Tiefgarage, P+R und groessere/benannte Parkplaetze werden nur hoeher sortiert.
- Privat-, Kunden-, Mitarbeiter- und Bewohnerparkplaetze bleiben ausgeschlossen.
- Strassenrand-/Parkstreifen bleiben fuer die Zielparkplatzsuche ausgeschlossen.
