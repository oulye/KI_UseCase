# Vortragsskript Version 2 (einfach erklärt)

Zu den Folien in [KI_UseCase_Evaluator_v2.pptx](KI_UseCase_Evaluator_v2.pptx) (16 Folien, Sprechernotizen sind dort ebenfalls hinterlegt).
Diese Version ist für ein Publikum **ohne technisches Vorwissen** gedacht: Alltagsbilder statt Fachbegriffe, kurze Sätze, ein Gedanke pro Folie. Die ausführlichere Fassung für ein Fachpublikum bleibt unverändert in [VORTRAGSSKRIPT.md](VORTRAGSSKRIPT.md).

**Dauer:** ca. 14:30 Minuten inkl. Live-Demo (Vorgabe 10–15 Min.). Fragen danach.
**Reihenfolge:** Problem → Idee → Datenbank und Auswertungen → Ergebnisse → Tests → Entstehung und Reflexion → **Live-Demo ganz am Schluss**.
Stellen mit **[TEAM]** sind persönliche Eindrücke, die nur ihr selbst erzählen könnt.

## Zeitplan

| Folie | Thema | Sprecher | Zeit | Bewertungsbereich |
|---|---|---|---|---|
| 1 | Titel | 1 | 0:15 | – |
| 2 | Das Problem | 1 | 0:50 | Problemanalyse 20 % |
| 3 | Die fünf möglichen Antworten | 1 | 0:50 | Problemanalyse / Kriterien 20 % |
| 4 | Sieben Fragen zu jeder Idee | 1 | 0:50 | Kriterienkatalog 20 % |
| 5 | So kommt die App zu ihrer Antwort | 2 | 0:45 | Kriterienkatalog 20 % |
| 6 | Wo speichern wir das? Die Datenbank | 2 | 1:00 | **Datenmodell 25 %** |
| 7 | Unsere Testdaten (48 Ideen) | 2 | 0:30 | Datenmodell |
| 8 | Die Datenbank rechnet für uns | 2 | 0:50 | **Aggregationen 25 %** |
| 9 | Das Register (Indizes) | 3 | 0:40 | **Indizes 25 %** |
| 10 | Was wir herausgefunden haben | 3 | 1:15 | Begründung 15 % |
| 11 | Unsere Antwort auf die Leitfrage | 3 | 0:45 | Begründung 15 % |
| 12 | Funktioniert die App richtig? Tests | 3 | 0:45 | Funktionalität und Tests 15 % |
| 13 | Wie das Projekt entstanden ist | 4 | 0:50 | Reflexion 15 % |
| 14 | Reflexion | 4 | 1:00 | Reflexion 15 % |
| 15 | Live-Demo | 4 | 2:15 | Funktionalität 15 % |
| 16 | Fragen | alle | 0:10 | – |
| | **Summe** | | **ca. 14:30** | |

Wenn es knapp wird: Folie 7 auf 15 Sekunden kürzen, Folie 9 auf einen Satz, in der Demo Schritt 4 weglassen.

## Begriffe einfach erklärt (zum Nachschlagen und für Fragen)

| Begriff | Einfach gesagt |
|---|---|
| **KI** | Ein Programm, das aus Beispielen lernt, statt dass jemand jede Regel aufschreibt (z. B. erkennt es Themen in E-Mails). |
| **Regelbasiert / klassisches Programm** | Ein Wenn-Dann-Programm: «Wenn der Betrag über 1000 Franken ist, dann zur Freigabe.» Immer gleich, nachvollziehbar. |
| **Assistenz / Human in the Loop** | Die KI macht einen Vorschlag, ein Mensch entscheidet. Der Mensch bleibt «in der Schleife». |
| **Fehlertoleranz** | Wie schlimm ein Fehler ist. Falsche Filmempfehlung: egal. Falsche Diagnose: gefährlich. |
| **Gewicht** | Wie wichtig eine der sieben Fragen für das Gesamturteil ist. |
| **KI-Nutzwert** | Ein Punktwert von 0 bis 100: Je höher, desto mehr lohnt sich KI. |
| **Datenbank / NoSQL / MongoDB** | Ein digitaler Aktenschrank. «NoSQL» heisst: keine starren Tabellen, sondern flexible Karteikarten. MongoDB ist das Produkt, das wir benutzen. |
| **Dokument** | Eine Karteikarte in der Datenbank, bei uns eine pro KI-Idee. |
| **Aggregation Pipeline** | Eine Rechenanleitung in Schritten, wie ein Fliessband: filtern, gruppieren, zählen. Die Datenbank führt sie selbst aus. |
| **Index / Register** | Wie das Register hinten im Buch: Man schlägt nach, statt alle Seiten zu lesen. Macht Suchen schnell. |
| **Korrelation (r)** | Ein Wert, der zeigt, ob zwei Dinge zusammenhängen. 0 = gar nicht, 1 = vollständig. Unser Wert 0.38 = nur mässig. |
| **Test** | Ein kleines Programm, das automatisch prüft, ob unsere App bei einem bekannten Beispiel die erwartete Antwort gibt. |
| **Prompt** | Die Anweisung oder Frage, die man einer KI schreibt. |

## Die fünf Botschaften, die hängen bleiben sollen

1. **Nicht jede KI-Idee lohnt sich.** Manchmal ist ein einfaches Programm oder Handarbeit besser.
2. **Unsere App sagt nicht nur «ja» oder «nein»,** sondern gibt eine von fünf begründeten Antworten, auch «noch unklar».
3. **Bei Fehlern, die weh tun, entscheidet ein Mensch mit.**
4. **KI lohnt sich bei vier Bedingungen:** Regeln reichen nicht, genug Daten, oft genug gebraucht, Fehler verkraftbar.
5. **Wir haben mit drei verschiedenen KIs gearbeitet und ihre Ergebnisse immer geprüft.**

---

## Folie 1: Titel (Person 1, 0:15)

**Sagen:** «Guten Tag. Wir haben eine App gebaut, die prüft, ob sich eine KI-Idee wirklich lohnt. Die fünf Farben hier unten sind die fünf möglichen Antworten der App. Sie begleiten uns durch die ganze Präsentation.»
**Übergang:** «Warum braucht es so eine App überhaupt?»

## Folie 2: Das Problem (Person 1, 0:50)

**Sagen:**
- «Viele Firmen haben heute KI-Ideen. Aber nicht jede Idee lohnt sich. Das ist ein bisschen wie mit Kanonen auf Spatzen schiessen.»
- «Wir sehen drei typische Fehler: Erstens eine zu grosse Lösung, also KI, obwohl ein einfaches Programm reicht. Zweitens etwas automatisieren, das fast nie vorkommt. Drittens KI allein entscheiden lassen, obwohl ein Fehler teuer wäre.»
- **Leitfrage vorlesen:** «Wann bringt KI mehr Nutzen als ein einfaches Programm oder Handarbeit?» und «Das beantworten wir am Ende.»
- «Unser Ziel: eine App, die KI-Ideen prüft und begründet empfiehlt.»

**Besonders betonen:** Die Leitfrage. Sie kommt am Schluss in Folie 11 wieder.

## Folie 3: Die fünf möglichen Antworten (Person 1, 0:50)

**Sagen:** «Die App gibt zu jeder Idee eine von fünf Antworten.»
- **KI sinnvoll:** Die KI erledigt die Arbeit selbständig. Beispiel: E-Mails nach Thema sortieren.
- **KI als Assistenz:** Die KI macht einen Vorschlag, ein Mensch entscheidet. Beispiel: Zweitmeinung bei Röntgenbildern.
- **Klassisch:** Ein einfaches Wenn-Dann-Programm reicht. Beispiel: Passwort zurücksetzen.
- **Manuell:** Von Hand ist besser, weil der Fall zu selten vorkommt.
- **Unklar:** Es fehlen noch wichtige Informationen.

**Besonders betonen:** «Unklar» ist eine ehrliche Antwort. Die App rät nicht, wenn Informationen fehlen.

## Folie 4: Sieben Fragen zu jeder Idee (Person 1, 0:50)

**Sagen:**
- «Damit die App urteilen kann, stellt sie sieben Fragen. Die Prozentzahl zeigt, wie wichtig die Frage ist.»
- «Am wichtigsten sind drei: Lassen sich einfache Regeln nicht aufschreiben? Das sind 25 Prozent. Gibt es genug brauchbare Daten? 20 Prozent. Wie schlimm wäre ein Fehler? 15 Prozent.»
- «Dazu kommen: Wie oft kommt der Fall vor? Muss man es erklären können, sind die Daten sensibel? Lohnt es sich finanziell? Ist es technisch machbar? Je 10 Prozent.»
- «Aus den Antworten entsteht ein Punktwert von 0 bis 100, der KI-Nutzwert.»

**Besonders betonen (ehrlich):** Die Gewichte sind unsere Annahmen. Die App macht das Urteil nachvollziehbar, das heisst nicht automatisch richtig.
**Übergang:** «Wie wird aus den Antworten ein Urteil?» (Person 2 übernimmt.)

## Folie 5: So kommt die App zu ihrer Antwort (Person 2, 0:45)

**Sagen:** «Die App prüft fünf Fragen der Reihe nach. Die erste Frage, die zutrifft, entscheidet.»
1. «Fehlen wichtige Infos? Dann sagt sie: noch unklar.»
2. «Kommt der Fall selten vor, unter 50-mal im Monat? Dann: von Hand.»
3. «Reichen einfache Wenn-Dann-Regeln? Dann: klassisches Programm.»
4. «Ist ein Fehler gefährlich oder sind die Daten sensibel? Dann hilft die KI nur, und der Mensch entscheidet.»
5. «Passt alles und der Punktwert ist hoch? Dann: KI sinnvoll.»

**Besonders betonen:** Die App selbst ist ein einfaches, regelbasiertes Programm: gleiche Eingabe, gleiche Antwort. Eine KI darf höchstens den Begründungstext schreiben und ändert die Empfehlung nie. «Das ist unsere Antwort auf die Frage, was KI übernehmen soll und was nicht: formulieren ja, entscheiden nein.»

## Folie 6: Wo speichern wir das? Die Datenbank (Person 2, 1:00) – Kernfolie

**Sagen:**
- «Gespeichert wird alles in einer Datenbank namens MongoDB. Das ist ein digitaler Aktenschrank ohne starre Tabellen, man nennt das NoSQL.»
- «Stellt euch eine **Karteikarte pro KI-Idee** vor. Auf der Karte stehen vier Dinge: die Eckdaten, die Merkmale der Idee, die möglichen Lösungswege mit Kosten, und das Ergebnis der App.»
- **Warum so?** «Erstens: Was zusammengehört, liegt auf einer Karte. Das geht schnell, und es ist immer alles beisammen. Zweitens: Leere Felder sind erlaubt und bedeuten ‹unbekannt›. Dann sagt die App ‹noch unklar›. Drittens: Wir speichern das Urteil der App gleich mit. So kann die Datenbank sofort zählen und auswerten.»

**Besonders betonen:** Das war eine bewusste Entscheidung. Falls gefragt: Man hätte die Lösungswege auch in einen separaten Schrank legen können. Das lohnt sich aber nur, wenn man sie oft wiederverwendet, was bei uns nicht der Fall ist.

## Folie 7: Unsere Testdaten (Person 2, 0:30)

**Sagen:** «Zum Testen haben wir 48 KI-Ideen aus 10 Branchen erfasst, darunter alle Beispiele aus der Aufgabe. Absichtlich gemischt: klare KI-Fälle, klare Fälle für einfache Programme, Grenzfälle, seltene Fälle und Fälle mit fehlenden Informationen. Das Diagramm zeigt, wie die App die 48 Ideen einordnet.»
**Besonders betonen (ehrlich):** «Die Werte haben wir selbst geschätzt, es sind keine echten Messdaten.»

## Folie 8: Die Datenbank rechnet für uns (Person 2, 0:50)

**Sagen:**
- «Die Datenbank kann auch selbst rechnen. Dafür gibt es sogenannte Aggregation Pipelines. Das ist eine Rechenanleitung in Schritten, wie ein Fliessband: filtern, gruppieren, zählen.»
- «Wir haben 13 solcher Auswertungen, verlangt waren mindestens fünf. Fünf davon seht ihr hier: Wie viele Ideen pro Branche empfehlen KI? Ab welcher Menge lohnt sich KI? Hängen Menge und Nutzen zusammen? Wo sind einfache Regeln günstiger? Wann zahlt sich der Aufwand aus?»
- «Die Ergebnisse zeigen wir gleich auf Folie 10.»

**Übergang:** «Damit das auch bei vielen Daten schnell bleibt, braucht es ein Register.» (Person 3 übernimmt.)

## Folie 9: Das Register (Person 3, 0:40)

**Sagen:**
- «Stellt euch das Register hinten in einem Buch vor. Statt jede Seite zu lesen, schlagt ihr nach und springt direkt zur richtigen Stelle. Das macht die Datenbank mit einem sogenannten Index auch.»
- «Wir haben sechs Register, je eines für eine typische Suche, zum Beispiel nach Branche, nach Risiko oder nach Wörtern.»
- «Wir haben geprüft: Alle fünf typischen Suchen nutzen ein Register.»

**Besonders betonen:** Wir haben bewusst nicht alles mit einem Register versehen, denn jedes Register kostet Platz und etwas Zeit beim Speichern.
**Ehrlich, falls gefragt:** Bei nur 48 Einträgen merkt man den Unterschied kaum, er zeigt sich bei grossen Datenmengen.

## Folie 10: Was wir herausgefunden haben (Person 3, 1:15)

**Sagen:** «Wir haben drei der vorgeschlagenen Fragen untersucht.»
1. **Menge:** «Unter 50 Fällen im Monat empfiehlt die App nie KI, ab 50’000 immer, in allen 8 Fällen. Aber die Menge allein entscheidet nicht. Der Zusammenhang ist nur mässig.»
2. **Mensch entscheidet mit:** «Bei hohem Risiko empfiehlt die App in keinem der 14 Fälle die KI allein. In 9 Fällen empfiehlt sie die KI als Assistenz. Beispiele: Radiologie, Arztbriefe, Prüfungen korrigieren.»
3. **Einfache Regeln:** «Bei 11 von 48 Ideen sind einfache Regeln über ein Jahr günstiger, bei fast gleicher Genauigkeit. Beispiele: Routenplanung, Rechnungsprüfung.»
- «Zusätzlich: Bei Texten und Bildern empfiehlt die App in 78 Prozent der Fälle KI, bei Tabellen-Daten nur in 44 Prozent.»

**Besonders betonen:** Immer dazusagen: «Das sind die Zahlen aus unseren geschätzten Beispieldaten.»

## Folie 11: Unsere Antwort (Person 3, 0:45) – langsam sprechen

**Sagen:** «Unsere Antwort auf die Leitfrage: KI lohnt sich, wenn vier Dinge zusammenkommen.»
1. «Einfache Regeln reichen nicht, zum Beispiel bei Texten oder Bildern. Sonst genügt ein einfaches Programm.»
2. «Es gibt genug gute Daten, denn die KI lernt aus Beispielen. Sonst muss man zuerst Daten sammeln.»
3. «Der Fall kommt oft genug vor, ab einigen hundert Mal pro Monat. Sonst ist Handarbeit besser.»
4. «Fehler sind verkraftbar, oder ein Mensch prüft das Ergebnis. Sonst bleibt die KI eine Assistenz.»

**Schlusssatz:** «KI formuliert, Regeln entscheiden, Menschen tragen die Verantwortung.»

## Folie 12: Funktioniert die App richtig? (Person 3, 0:45)

**Sagen:**
- «Wie wissen wir, dass unsere App richtig urteilt? Wir haben 41 automatische Tests. Sie prüfen mit bekannten Beispielen, ob die App die erwartete Antwort gibt, bei geeigneten und bei ungeeigneten Fällen.»
- «Beispiele: Support-Mails sortieren gibt KI sinnvoll. Röntgenbilder prüfen gibt Assistenz. Passwort zurücksetzen gibt klassisch. Seltene Krankheiten mit nur 15 Fällen im Monat gibt manuell. Und wenn eine Angabe fehlt, sagt die App unklar.»
- **Stabilitäts-Check:** «Wir haben die Gewichtung stark verändert, um die Hälfte rauf und runter. Die Antwort der App blieb in mindestens 95 von 100 Fällen gleich. Das zeigt: Die Regeln entscheiden, nicht die einzelnen Gewichte.»

**Ehrlich sagen:** Die Oberfläche haben wir von Hand geprüft, nicht automatisch.
**Übergang:** «Zum Schluss: Wie ist das Projekt überhaupt entstanden?» (Person 4 übernimmt.)

## Folie 13: Wie das Projekt entstanden ist (Person 4, 0:50)

**Sagen:** «Wir haben in drei Schritten mit drei verschiedenen KIs gearbeitet.»
1. **ChatGPT, das Grundgerüst:** «Wir haben die Aufgabenstellung an ChatGPT geschickt und daraus das erste Projekt erstellen lassen.»
2. **GitHub Copilot, die Weiterentwicklung:** «Danach haben wir mit einzelnen Prompts in Copilot Änderungen am Projekt vorgenommen.» (Ein Prompt ist die Anweisung an die KI.)
3. **Claude, die Überarbeitung:** «Zum Schluss haben wir Claude das Projekt anhand der Aufgabenstellung überarbeiten lassen. Claude hat es gegen alle Bewertungskriterien geprüft und ergänzt: die Bewertungslogik, das Datenmodell, die Auswertungen, die Register, die Beispieldaten, die Tests und die Oberfläche.»
- «Aus einer einfachen Erfassungs-App wurde ein Werkzeug, das KI-Ideen bewertet.»

**[TEAM]:** Jede Person kann hier in einem Satz sagen, wie sie diese Arbeit mit den KIs erlebt hat.

## Folie 14: Reflexion (Person 4, 1:00)

**Sagen:**
- **Was geholfen hat:** «ChatGPT gab uns einen schnellen Start aus der Aufgabenstellung. Copilot half bei gezielten Änderungen in kleinen Schritten. Claude hat das ganze Projekt überblickt und mit der Aufgabe abgeglichen.»
- **Was korrigiert werden musste:**
  1. «Das Grundgerüst sah komplett aus, aber es fehlte, was die Aufgabe verlangt: keine Bewertung, keine Auswertungen, keine Register, keine Tests.»
  2. «Im Code blieben Reste früherer Änderungen.»
  3. «Auch Claudes erste Bewertungsformel war falsch eingestellt: Passwort zurücksetzen bekam 66 Punkte und war trotzdem als ‹klassisch› eingestuft. Das fiel erst auf, als wir die Ergebnisse angeschaut haben.»
- **Was wir gelernt haben:** «KI-Ergebnisse immer gegen die Aufgabe prüfen. Tests und Stichproben decken Fehler auf. Und genau so funktioniert auch unsere App: Die KI schlägt vor, Menschen und Regeln entscheiden.»
- **Grenze:** «Unsere Daten sind geschätzt. Die Zahlen zeigen unser Modell, keine Marktstatistik.»

**[TEAM]:** Hier eigene Eindrücke ergänzen, zum Beispiel: Welche KI fühlte sich wie an? Wo hat euch etwas überrascht oder Zeit gekostet?
**Übergang:** «Und jetzt zeigen wir euch die App live.»

## Folie 15: Live-Demo (Person 4, 2:15)

**Vorbereitung (vorher, nicht während des Vortrags):**
```bash
npm run seed:reset      # lädt die 48 Beispieldaten (löscht ALLE vorhandenen Use Cases)
npm start               # öffnet http://localhost:3000
```
Browser im Vollbild, Zoom ca. 110 %. Backup: Folie 15 zeigt einen Screenshot.

**Drehbuch:**
1. **Idee eingeben (30 s):** Im Formular einen Titel eintippen. «Seht ihr: Unter dem Formular erscheint sofort die Bewertung. Jetzt steht dort ‹Entscheidung noch nicht möglich›, weil Angaben fehlen.»
2. **Angaben ausfüllen (30 s):** 12000 Fälle pro Monat, Datenverfügbarkeit 5, Regelkomplexität 4, Variabilität 5, Datenstruktur unstrukturiert, Fehlertoleranz hoch. «Jetzt sagt die App: KI sinnvoll.»
3. **Aha-Moment (20 s):** Fehlertoleranz auf **niedrig** stellen. «Wenn ein Fehler gefährlich ist, wird aus ‹KI sinnvoll› ‹KI als Assistenz›.» Nicht speichern, zurücksetzen.
4. **Details (40 s):** In der Liste «Diagnose-Unterstützung in der Radiologie» öffnen. Begründung, Punkte, Kosten der Lösungswege und ähnliche Ideen zeigen.
5. **Nur bei Zeit:** Menüpunkt «Auswertungen» kurz zeigen, das «Fazit aus den Daten» steht ganz oben.

**Wenn etwas schiefgeht:** Ruhig bleiben, auf Folie 15 verweisen, weiter erklären. Nicht live reparieren.
**Zum Schluss:** «Vielen Dank. Wir freuen uns auf eure Fragen.»

## Folie 16: Fragen (alle, 0:10)

Danken und Fragen einladen.

---

## Wahrscheinliche Fragen und einfache Antworten

**Woher wisst ihr, dass die Empfehlungen stimmen?**
Wir wissen es nicht sicher. Die App macht das Urteil nachvollziehbar, jede Zahl ist sichtbar. Die Werte sind von uns geschätzt. Für echte Sicherheit bräuchte man echte Fälle, bei denen man das Ergebnis schon kennt.

**Warum entscheidet nicht einfach eine KI?**
Eine KI gibt nicht immer dieselbe Antwort und kann ihre Entscheidung schlecht erklären. Unsere App soll nachvollziehbar sein. Darum entscheiden Regeln, und die KI darf höchstens den Begründungstext formulieren.

**Was bedeutet «Karteikarte» in der Datenbank genau?**
In MongoDB heisst das «Dokument». Alles, was zu einer KI-Idee gehört, liegt in einem Dokument, statt auf viele Tabellen verteilt zu sein.

**Ist das nicht kompliziert?**
Für Anwender nicht: Sie füllen ein Formular aus und sehen sofort die Empfehlung. Die Technik dahinter haben wir bewusst einfach gehalten.

**Warum gerade 50 Fälle als Grenze?**
Das ist eine Annahme von uns. Wie viel genau sich lohnt, hängt von den Kosten ab. Deshalb rechnet die App bei jeder Idee zusätzlich aus, wann sich der Aufwand auszahlt. Die Grenze lässt sich leicht ändern.

**Was ist mit dem Datenschutz, wenn eine KI den Begründungstext schreibt?**
Diese Funktion ist optional und standardmässig aus. Mit einem lokalen Modell verlassen keine Daten den Rechner. Bei einem externen Anbieter würden Titel und Beschreibung an diesen gesendet, das müsste man vorher prüfen.

**Welche KI war die beste?**
**[TEAM]** Eure persönliche Einschätzung. Ehrlich bleiben: ChatGPT gab uns den schnellen Start, Copilot half bei kleinen Änderungen, Claude hat das ganze Projekt gegen die Aufgabe geprüft und ergänzt. Aber jede KI musste kontrolliert werden.

**Was habt ihr selbst gemacht, und was die KI?**
**[TEAM]** Bitte ehrlich beantworten: Wer hat die Aufgabenstellung verstanden, die Prompts geschrieben, die Ergebnisse geprüft, die Entscheidungen getroffen (z. B. welche Fragen untersucht werden)?

**Was würdet ihr als Nächstes tun?**
Echte Fälle mit bekanntem Ausgang prüfen, die Gewichte und Grenzen daraus ableiten, eine Benutzerverwaltung einbauen und Datenschutz- und Gesetzesanforderungen genauer abbilden.

## Abdeckung der Lieferobjekte

| Lieferobjekt aus der Aufgabe | Folie |
|---|---|
| Problembeschreibung und Zieldefinition | 2 |
| Kriterienkatalog für sinnvollen KI-Einsatz | 3, 4, 5 |
| NoSQL-Datenmodell mit Begründung | 6 |
| Beispieldatensatz mit 30–50 Use Cases | 7 (48 Fälle) |
| Mindestens fünf Aggregation Pipelines | 8 (13 Pipelines, 5 gezeigt) |
| Indexierungsstrategie | 9 |
| Untersuchte Forschungsfragen und Ergebnisse | 10 |
| Klare Antwort auf die Leitfrage | 11 |
| Tests mit geeigneten und ungeeigneten Fällen | 12 |
| Reflexion: Wo hat welche KI geholfen? | 13, 14 |
| Funktionsfähiger Prototyp | 15 (Live-Demo am Schluss) |

## Checkliste am Präsentationstag

- [ ] MongoDB läuft, `npm run seed:reset` ausgeführt, `npm start` gestartet, `http://localhost:3000` im Browser offen
- [ ] Demo einmal komplett durchgespielt, Browser-Zoom angepasst
- [ ] Zeit gemessen: Ziel 14:30, Probe mit Stoppuhr
- [ ] Namen der Teammitglieder auf der Titelfolie ergänzen (stehen noch nicht drauf)
- [ ] **[TEAM]** Persönliche Eindrücke zu den drei KIs und zur Aufgabenverteilung vorbereitet
- [ ] Übergänge zwischen den Sprechenden abgesprochen: 1 → 2 nach Folie 4, 2 → 3 nach Folie 8, 3 → 4 nach Folie 12
- [ ] Die Person, die die Demo macht (Person 4), hat den Rechner mit dem laufenden Server vorbereitet
