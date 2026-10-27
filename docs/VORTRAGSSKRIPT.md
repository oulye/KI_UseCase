# Vortragsskript: KI UseCase Evaluator

Zu den Folien in [KI_UseCase_Evaluator.pptx](KI_UseCase_Evaluator.pptx) (14 Folien, Sprechernotizen sind dort ebenfalls hinterlegt).
**Dauer:** ca. 14 Minuten reiner Vortrag inkl. Live-Demo (Vorgabe 10–15 Min.). Fragen kommen danach.
**Aufteilung:** vier Sprechende (Person 1–4). Wer welchen Teil übernimmt, könnt ihr tauschen, die Zeiten bleiben.
Stellen mit **[TEAM]** sind persönliche Erfahrungen, die nur ihr selbst erzählen könnt.

## Zeitplan

| Folie | Thema | Sprecher | Zeit | Bewertungsbereich |
|---|---|---|---|---|
| 1 | Titel | 1 | 0:20 | – |
| 2 | Problem und Ziel | 1 | 1:00 | Problemanalyse 20 % |
| 3 | Kriterienkatalog | 1 | 1:15 | Problemanalyse / KI-Kriterien 20 % |
| 4 | Von den Kriterien zur Empfehlung | 2 | 1:00 | Problemanalyse 20 % |
| 5 | NoSQL-Datenmodell | 2 | 1:30 | **Datenmodell 25 %** |
| 6 | Beispieldatensatz | 2 | 0:40 | Datenmodell |
| 7 | Live-Demo | 3 | 2:00 | Funktionalität 15 % |
| 8 | Aggregation Pipelines | 3 | 1:15 | **Abfragen/Aggregationen/Indizes 25 %** |
| 9 | Indexierungsstrategie | 3 | 1:00 | Abfragen/Indizes 25 % |
| 10 | Tests | 4 | 0:50 | Funktionalität und Tests 15 % |
| 11 | Was die Auswertungen zeigen | 4 | 1:30 | Begründung 15 % |
| 12 | Antwort auf die Leitfrage | 4 | 0:45 | Begründung 15 % |
| 13 | Reflexion | 4 (alle) | 1:15 | Reflexion 15 % |
| 14 | Fragen | alle | 0:15 | – |
| | **Summe** | | **ca. 14:15** | |

Wenn die Zeit knapp wird: Folie 6 auf 20 Sekunden kürzen, in der Demo Schritt 4 (Vergleich) weglassen, Folie 9 auf drei Indizes reduzieren.

## Die fünf Botschaften, die hängen bleiben sollen

1. **Kein «KI ist immer besser».** Die Anwendung zeigt, wann KI sich lohnt und wann nicht (Regeln, manuell, Assistenz, noch unklar).
2. **Transparent statt Black Box.** Die Bewertung ist regelbasiert, deterministisch und erklärt sich selbst. KI formuliert höchstens den Begründungstext.
3. **Das Datenmodell ist bewusst gewählt:** eingebettet statt Joins, `null` = «unbekannt», Bewertung mitgespeichert (Computed Pattern).
4. **Die Datenbank rechnet:** 13 Aggregationen, 6 Indizes, per `explain` belegt, 41 Tests.
5. **Antwort auf die Leitfrage:** KI lohnt sich bei Regelschwäche, Daten, Volumen und tragbarem Fehlerrisiko, sonst nicht.

---

## Folie 1: Titel (Person 1, 0:20)

**Sagen:** «Guten Tag, wir stellen den KI UseCase Evaluator vor. Er beantwortet eine Frage, die sich jede Firma stellt: Wann bringt KI wirklich Nutzen? Die fünf Farben hier unten sind die fünf möglichen Empfehlungen der Anwendung, sie begleiten uns durch die ganze Präsentation.»
**Zeigen:** Die fünf Farb-Badges kurz benennen.
**Übergang:** «Beginnen wir mit dem Problem.»

## Folie 2: Problem und Ziel (Person 1, 1:00)

**Sagen:**
- Firmen sammeln viele KI-Ideen: Support-Anfragen klassifizieren, Berichte zusammenfassen, Sensordaten überwachen, Maschinenausfälle vorhersagen und so weiter. Aber nicht jede Idee lohnt sich.
- Drei typische Fehler: KI einsetzen, wo einfache Regeln günstiger und zuverlässiger wären; automatisieren, obwohl der Fall kaum vorkommt; und KI allein entscheiden lassen, obwohl ein Fehler teuer ist.
- **Leitfrage:** Unter welchen Bedingungen erzeugt KI einen grösseren Nutzen als eine klassische, regelbasierte oder manuelle Lösung?
- **Ziel:** Eine Anwendung, die Use Cases erfasst, nach transparenten Kriterien bewertet, eine begründete Empfehlung gibt und über alle Fälle auswertbar macht, was KI-Fälle gemeinsam haben.

**Besonders betonen:** Die Leitfrage vorlesen und sagen, dass wir sie am Ende (Folie 12) beantworten.
**Übergang:** «Dafür braucht es Kriterien.»

## Folie 3: Kriterienkatalog (Person 1, 1:15)

**Sagen:**
- Sieben Kriterien, jedes beantwortet eine Frage. Der **KI-Bedarf** (25 %): Lassen sich Regeln nicht sauber formulieren? Das hängt an Regelkomplexität, Variabilität der Eingaben und Datenstruktur. Die **Datenreife** (20 %): Gibt es genug Daten in brauchbarer Qualität? Die **Fehlertoleranz** (15 %): Wie schlimm ist ein falsches Ergebnis? Je 10 % haben Fallvolumen, Erklärbarkeit und Datenschutz, Wirtschaftlichkeit und technische Umsetzbarkeit.
- Daraus entsteht der **KI-Nutzwert von 0 bis 100**: die gewichtete Summe, skaliert mit dem KI-Bedarf. Das ist wichtig: Wenn Regeln eine Aufgabe ohnehin abdecken, ist der *zusätzliche* Nutzen von KI klein, auch wenn Volumen und Daten stimmen.

**Besonders betonen:**
- Jeder Teilscore ist in der App sichtbar, nichts ist versteckt.
- Ehrlich sein: Die Gewichte sind Annahmen des Teams. Transparent ist nicht gleich objektiv. Das greifen wir in Test und Reflexion wieder auf.

**Übergang:** «Wie wird daraus eine Empfehlung?» (Person 2 übernimmt.)

## Folie 4: Von den Kriterien zur Empfehlung (Person 2, 1:00)

**Sagen:** Die Regeln werden von oben nach unten geprüft, die erste zutreffende gewinnt.
1. Fehlt eine Pflichtangabe oder gibt es praktisch keine Daten: **Entscheidung noch nicht möglich**. Das ist eine ehrliche Antwort statt Raten.
2. Weniger als 50 Fälle pro Monat: **manuell**, Automatisierung lohnt sich nicht.
3. Regeln reichen aus (KI-Bedarf unter 40): **klassische Lösung**.
4. Hohes Risiko, niedrige Fehlertoleranz oder sensible Daten: **KI als Assistenz**, der Mensch entscheidet (Human in the Loop).
5. Sonst: ab Nutzwert 60 **KI sinnvoll**, darunter Assistenz.

**Besonders betonen:**
- Die Logik ist **deterministisch**: gleiche Eingabe, gleiche Empfehlung. Das macht sie testbar und erklärbar.
- Die Aufgabenstellung empfiehlt «zuerst regelbasiert, optional Sprachmodell». Genau so haben wir es gemacht: Ein Sprachmodell kann den Begründungstext formulieren, ändert aber nie die Empfehlung. Damit sehen wir direkt, was KI übernehmen soll (formulieren) und was deterministisch bleibt (entscheiden).

**Übergang:** «Und wie speichern wir das?»

## Folie 5: NoSQL-Datenmodell (Person 2, 1:30) – Kernfolie

**Sagen:**
- Eine Collection `usecases`, ein Dokument pro Use Case. Darin eingebettet: `kriterien` (objektive Problemmerkmale), `geschaeftswert` (Teamschätzung), `loesungsansaetze` (Array mit zwei bis vier Alternativen mit Kosten und Genauigkeit) und `bewertung` (berechnet).
- **Warum eingebettet statt Referenzen?** Diese Daten gehören zu genau einem Use Case, werden immer zusammen gelesen und nie unabhängig abgefragt. Wir sparen Joins, und Lesen und Schreiben ist atomar. Das Array ist klein und begrenzt, die 16-MB-Grenze ist kein Thema. Mit `$unwind` können wir trotzdem über alle Ansätze auswerten.
- **`null` heisst «unbekannt».** Fehlende Angaben sind Teil der Fachlogik und führen zur Empfehlung «noch nicht möglich». Das flexible Schema passt dazu.
- **Computed Pattern:** Die Bewertung wird serverseitig berechnet und mitgespeichert. Dadurch sind Filter und Aggregationen schnell und indexierbar. Sie trägt eine Versionsnummer und kann bei geänderten Gewichten für alle Fälle neu berechnet werden. Der Client kann sie nicht fälschen.

**Besonders betonen:** Eine **verworfene Alternative** nennen: eigene Collection für Lösungsansätze mit Referenz. Sinnvoll wäre das, wenn Ansätze fallübergreifend wiederverwendet würden oder sehr zahlreich wären. Beides trifft hier nicht zu. Das zeigt, dass die Modellierung eine begründete Entscheidung war.
**Übergang:** «Mit welchen Daten haben wir das getestet?»

## Folie 6: Beispieldatensatz (Person 2, 0:40)

**Sagen:** 48 Use Cases aus 10 Branchen und 8 Problemtypen, darunter alle Beispiele aus der Aufgabe. Bewusst gemischt: klare KI-Fälle, klare Regel-Fälle, Grenzfälle, Fälle mit zu wenig Volumen, fehlende Daten und kreative Fälle wie die Lawinengefahr-Einschätzung für Bergbahnen oder Pflanzenkrankheiten per Foto. Verteilung: 13 KI sinnvoll, 15 Assistenz, 10 klassisch, 5 manuell, 5 unklar.
**Besonders betonen (Ehrlichkeit):** Die Werte sind von uns geschätzt, keine Messdaten. Die Auswertungen zeigen deshalb die Konsequenzen unseres Modells, keine Marktstatistik.
**Übergang:** «Schauen wir uns den Prototyp live an.» (Person 3 übernimmt.)

## Folie 7: Live-Demo (Person 3, 2:00)

**Vorbereitung (vorher, nicht während des Vortrags):**
```bash
npm run seed:reset      # 48 Beispieldaten laden (löscht ALLE vorhandenen Use Cases)
npm start               # http://localhost:3000, Browser im Vollbild, Zoom ~110 %
```
Tab 1: Use Cases, Tab 2 (optional): Auswertungen. Backup: Folie 7 zeigt einen Screenshot, falls die Demo nicht läuft.

**Drehbuch:**
1. **Erfassen (30 s):** Im Formular einen Titel eingeben. Auf die **Live-Bewertung** unter dem Formular zeigen: «Entscheidung noch nicht möglich, es fehlen Volumen, Datenverfügbarkeit …».
2. **Werte ausfüllen (30 s):** 12000 Fälle, Datenverfügbarkeit 5, Regelkomplexität 4, Variabilität 5, Datenstruktur unstrukturiert, Fehlertoleranz hoch → **KI sinnvoll**.
3. **Aha-Moment (20 s):** Fehlertoleranz auf **niedrig** stellen → springt auf **KI als Assistenz**, «Human in the Loop». Nicht speichern, einfach zurücksetzen.
4. **Detailansicht (40 s):** In der Liste «Diagnose-Unterstützung in der Radiologie» öffnen: Begründung, Teilscores, Lösungsansätze mit 12-Monats-Kosten und Break-even, ähnliche Use Cases. Optional auf «Textuelle Begründung erzeugen» klicken (ohne API-Key erscheint die regelbasierte Begründung).
5. **Nur bei Zeit:** «Vergleich»: Passwort-Reset (klassisch) neben Chatbot (KI).

**Besonders betonen:** Dass die Bewertung **beim Tippen** reagiert und jede Zahl begründet ist. Beim Radiologie-Fall hervorheben, dass die KI-Hilfe trotz hohem Nutzen nur als Assistenz empfohlen wird.
**Wenn etwas schiefgeht:** Ruhig bleiben, auf Folie 7 verweisen, weiter mit der Erklärung. Nie live debuggen.
**Übergang:** «Und was steckt dahinter in MongoDB?»

## Folie 8: Aggregation Pipelines (Person 3, 1:15)

**Sagen:** Wir haben 13 Aggregation Pipelines, jede ist in der App samt JSON einsehbar. Drei davon:
- **`volumen`** mit `$bucket`: gruppiert die Fälle nach Fallvolumen und zeigt die KI-Quote je Klasse.
- **`korrelation`**: Die Korrelation zwischen Datenmenge und Nutzwert wird komplett **in MongoDB** berechnet (`$log10`, `$group` mit Summen, `$sqrt`), ohne Daten in die Anwendung zu laden. Ergebnis: r = 0.38.
- **`regelmaschine`**: `$map`, `$filter` und `$min` berechnen die 12-Monats-Kosten je Lösungsansatz und finden Fälle, in denen Regeln günstiger sind.
- Auch die **Ähnlichkeitssuche** ist eine Aggregation (Score aus Branche, Problemtyp, gemeinsamen Tags und Nähe der Merkmale).

**Besonders betonen:** Nicht alle Pipelines vorlesen, drei erklären. Auf die Ansicht «Auswertungen» verweisen (Screenshot rechts), das «Fazit aus den Daten» oben wird live aus den Pipelines berechnet.
**Übergang:** «Damit das schnell bleibt, braucht es Indizes.»

## Folie 9: Indexierungsstrategie (Person 3, 1:00)

**Sagen:**
- Sechs Indizes, jeder für eine konkrete Abfrage. Der Compound-Index auf Branche, Problemtyp und Nutzwert folgt der **ESR-Regel** (Equality, Equality, Sort): Er bedient Filter und Sortierung ohne Sortierung im Speicher. Dazu Risiko plus Empfehlung, Nutzwert absteigend für die Rangliste, Fallvolumen für Bereiche und Buckets, ein Multikey-Index auf Tags und ein Volltextindex (Titel 10, Tags 5, Beschreibung 1, deutsches Stemming).
- **Bewusst nicht indexiert:** Teilscores (werden nur angezeigt) und einzelne Textfelder. Jeder Index kostet Schreibleistung und Speicher.
- **Beleg:** `explain("executionStats")`: Alle fünf typischen Abfragen nutzen einen Index-Scan. In der App unter «Auswertungen» sichtbar und als automatischer Test.

**Besonders betonen (Ehrlichkeit):** Bei nur 48 Dokumenten würde MongoDB bei unselektiven Filtern auch einen Collection-Scan wählen. Der Nutzen der Indizes zeigt sich erst bei grösseren Beständen, die Strategie ist aber dafür ausgelegt.
**Übergang:** «Wie wissen wir, dass das alles korrekt ist?» (Person 4 übernimmt.)

## Folie 10: Tests (Person 4, 0:50)

**Sagen:**
- 41 automatische Tests: Unit-Tests für die Bewertung ohne Datenbank und Integrationstests gegen eine echte MongoDB (separate Testdatenbank).
- **Geeignete und ungeeignete Fälle**, wie in der Aufgabe gefordert: Support-Klassifikation → KI sinnvoll. Radiologie → nur Assistenz. Passwort-Reset → klassisch. Seltene Krankheiten mit 15 Fällen → manuell. Kundenabwanderung ohne Angabe zur Fehlertoleranz → unklar. Auch der Grenzwert 49 gegen 50 Fälle ist getestet.
- Weitere Tests: Schutz vor gefälschter Bewertung, Validierung (400 statt 500), alle Pipelines liefern Daten, Index-Nutzung, Migration alter Daten.

**Besonders betonen:** Der **Robustheitstest**: Wir ändern jedes Gewicht um ±50 %, und mindestens 95 % der Empfehlungen bleiben gleich. Das heisst: Die harten Regeln dominieren, nicht die Gewichte. Die eigentliche Subjektivität steckt in den Schwellenwerten und den Eingabeschätzungen.
**Ehrlich sagen:** Das Frontend ist nicht automatisiert getestet (manuell geprüft), die Sprachmodell-Anbindung ebenfalls nicht.

## Folie 11: Was die Auswertungen zeigen (Person 4, 1:30)

**Sagen:** Wir haben drei der Forschungsfragen aus der Aufgabe untersucht.
1. **Datenmenge und Nutzen:** Unter 50 Fällen pro Monat wird KI nie empfohlen (0 von 5), ab 50’000 immer (8 von 8). Aber die Korrelation beträgt nur r = 0.38: Volumen ist notwendig, aber nicht hinreichend. Auch Regelkomplexität und Datenstruktur zählen.
2. **Human in the Loop:** Bei hohem Risiko wird KI in 0 von 14 Fällen vollautomatisch empfohlen, in 9 Fällen als Assistenz. Beispiele mit hohem Nutzen und hohem Risiko: Radiologie-Zweitmeinung, Arztbriefe, Freitext-Korrektur.
3. **Wo ist eine Regelmaschine wirtschaftlicher?** Bei 11 von 48 Fällen ist die Regel-Lösung über 12 Monate günstiger als KI oder Hybrid und höchstens 5 Prozentpunkte weniger genau, etwa Routenoptimierung, Rechnungsprüfung oder Medikamenten-Wechselwirkungen.
- Zusatz: Bei unstrukturierten Daten (Text, Bild) liegt die KI-Quote bei 78 %, bei strukturierten bei 44 %.

**Besonders betonen:** Bei Zahlen immer dazusagen «in unserem Datensatz». Es sind Konsequenzen unseres Modells, keine Marktdaten.

## Folie 12: Antwort auf die Leitfrage (Person 4, 0:45) – langsam sprechen

**Sagen:** «KI erzeugt dann den grössten Nutzen, wenn **vier Bedingungen** zusammenkommen:
1. Regeln reichen nicht, typischerweise bei unstrukturierten Daten oder stark variierenden Eingaben.
2. Es gibt genug Daten in brauchbarer Qualität.
3. Das Volumen ist gross genug, dass sich der Einmalaufwand lohnt: grob ab einigen hundert, klar ab einigen tausend Fällen pro Monat.
4. Fehler sind tragbar, oder ein Mensch fängt sie ab.»

Dann auf die farbigen Zeilen zeigen: **Fehlt die erste Bedingung**, ist die klassische Lösung besser. **Fehlt die zweite**, müssen zuerst Daten erhoben werden. **Fehlt die dritte**, ist manuelle Arbeit besser. **Fehlt die vierte**, bleibt KI eine Assistenz.
**Schlusssatz:** «KI formuliert, Regeln entscheiden, und Menschen tragen die Verantwortung.»

## Folie 13: Reflexion (Person 4, danach alle, 1:15)

Die Folie zeigt die belegbaren Punkte. **Ergänzt mündlich je ein persönliches Beispiel pro Person [TEAM]:** Welche KI-Werkzeuge habt ihr für die ursprüngliche App genutzt (Code, Design, Ideen), was hat gut funktioniert, was musstet ihr korrigieren?

**Sagen (belegbar):**
- **Wo KI geholfen hat:** Claude Code half bei der Lückenanalyse gegen die Bewertungskriterien, beim Schreiben von Schema, Routen und Tests, bei der Aggregation-Syntax und bei der Dokumentation.
- **Wo Korrektur nötig war:** Die erste Bewertungsformel war unplausibel. Der Passwort-Reset bekam einen KI-Nutzwert von 66 und war trotzdem «klassisch», und Hochrisiko-Fälle wie die Triage fielen auf «manuell», weil das Risiko doppelt bestraft wurde. Das fiel erst beim Prüfen der berechneten Verteilung auf, ein Test deckte zusätzlich auf, dass sich zwei Korrekturen aufhoben. **Lehre:** KI-Ergebnisse müssen geprüft werden, und Tests helfen dabei.
- **Grenzen unseres Modells:** Die Daten sind geschätzt. Beispieldaten und Modell stammen aus derselben Quelle (Zirkularität): Die Tests prüfen Konsistenz, nicht externe Gültigkeit. Und die Schwellenwerte wirken stärker als die Gewichte.
- **Kernbotschaft:** Wir setzen KI nicht als Entscheider ein, sondern für den Begründungstext. Das ist unsere Antwort auf «welche Aufgaben soll KI übernehmen».

**Besonders betonen:** Kritische Reflexion ist eine eigene Bewertungskategorie. Konkrete Fehler und Grenzen nennen wirkt stärker als allgemeine Aussagen.

## Folie 14: Fragen (alle, 0:15)

Kurz danken, Fragen einladen, Live-Demo oder Code bei Bedarf im Detail zeigen.

---

## Wahrscheinliche Fragen und Antworten

**Warum eingebettet und nicht in separaten Collections?**
Die Daten gehören zu genau einem Use Case und werden immer zusammen gelesen. Einbetten spart Joins und macht Schreiben atomar. Die Lösungsansätze sind ein kleines, begrenztes Array. Eine eigene Collection wäre sinnvoll bei Wiederverwendung oder sehr vielen Einträgen.

**Warum speichert ihr die Bewertung, statt sie bei Bedarf zu berechnen?**
Damit Aggregationen und Filter direkt darauf laufen und Indizes nutzen können (Computed Pattern). Die Bewertung trägt eine Versionsnummer und kann für alle Fälle neu berechnet werden (`POST /api/bewertung/neu`).

**Wie objektiv ist der KI-Nutzwert?**
Nicht objektiv, aber nachvollziehbar. Gewichte und Schwellen sind Annahmen. Der Robustheitstest zeigt, dass die Gewichte kaum etwas ändern, die Schwellenwerte und die Eingabeschätzungen aber schon. Für echte Objektivität bräuchte es Fälle mit bekanntem Ausgang.

**Wieso nicht einfach ein Sprachmodell die Bewertung machen lassen?**
Ein Sprachmodell wäre nicht deterministisch, schwer testbar und nicht sauber erklärbar. Die Aufgabe empfiehlt ausdrücklich zuerst regelbasiert. Das Modell darf formulieren, nicht entscheiden.

**Was ist mit dem Datenschutz, wenn ein Sprachmodell die Begründung schreibt?**
Die Funktion ist optional und standardmässig aus. Mit Ollama lässt sich ein lokales Modell nutzen, dann verlassen keine Daten den Rechner. Bei einer externen API würden Titel, Beschreibung und Kriterien an den Anbieter gesendet, das müsste vorher geprüft werden.

**Warum 50 Fälle als Grenze?**
Das ist eine Annahme. Ein genauer Wert hängt von den Kosten ab. Deshalb berechnen wir zusätzlich pro Fall Break-even und 12-Monats-Kosten aus den Lösungsansätzen. Die Grenze ist eine Konstante in `config/kriterien.js` und leicht änderbar.

**Wie skaliert das?**
Dokumente sind klein, Abfragen laufen über Indizes. Die Aggregationen arbeiten in der Datenbank. Bei grossen Beständen würden Pipelines mit `$match` früh filtern und häufige Auswertungen vorberechnet. Bei 48 Dokumenten zeigt `explain` den Index-Scan, der echte Nutzen entsteht bei mehr Daten.

**Sind die Ergebnisse realistisch?**
Sie spiegeln unser Modell und geschätzte Beispieldaten wider. Die Muster (Regeln bei strukturierten Daten, Assistenz bei hohem Risiko) entsprechen aber gängiger Praxis. Als Beleg für den Markt sind die Zahlen nicht gedacht.

**Was würdet ihr als Nächstes tun?**
Echte Fälle mit bekanntem Ausgang zur Validierung, Schwellen und Gewichte daraus ableiten, Benutzerverwaltung, und Datenschutz- und Regulierungsanforderungen (DSG, AI Act) genauer abbilden.

**Was hat nicht funktioniert?**
Die erste Bewertungsformel (siehe Reflexion). Ausserdem ist das Frontend nicht automatisiert getestet.

## Abdeckung der Lieferobjekte

| Lieferobjekt aus der Aufgabe | Folie |
|---|---|
| Problembeschreibung und Zieldefinition | 2 |
| Kriterienkatalog für sinnvollen KI-Einsatz | 3, 4 |
| NoSQL-Datenmodell mit Begründung | 5 |
| Beispieldatensatz mit 30–50 Use Cases | 6 (48 Fälle) |
| Funktionsfähiger Prototyp | 7 (Live-Demo) |
| Mindestens fünf Aggregation Pipelines | 8 (13 Pipelines) |
| Indexierungsstrategie | 9 |
| Tests mit geeigneten und ungeeigneten Fällen | 10 |
| Reflexion: Wo hat welche KI geholfen? | 13 |
| Klare Antwort auf die Leitfrage | 12 |
| 2–3 untersuchte Forschungsfragen | 11 |

## Checkliste am Präsentationstag

- [ ] MongoDB läuft, `npm run seed:reset` ausgeführt, `npm start` gestartet, `http://localhost:3000` im Browser offen
- [ ] Demo einmal komplett durchgespielt (Schritte 1–4), Browser-Zoom angepasst
- [ ] Folie 7 als Backup bereit (Screenshot)
- [ ] Zeit gemessen: Ziel 14 Minuten, Probe mit Stoppuhr
- [ ] Namen der Teammitglieder auf der Titelfolie ergänzen (stehen noch nicht drauf)
- [ ] **[TEAM]** Persönliche Reflexionsbeispiele und Teamorganisation (Rollen, Git-Workflow) vorbereitet; für die Kategorie «beste Teamorganisation» solltet ihr kurz erklären, wer was gemacht hat
- [ ] Übergänge zwischen den Sprechenden abgesprochen
