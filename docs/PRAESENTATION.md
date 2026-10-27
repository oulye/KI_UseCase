# Präsentation (10–15 Min.) und Reflexion

Gliederung der Abschlusspräsentation entlang der Lieferobjekte und Bewertungskriterien. Stellen mit **[TEAM]** kann nur das Team selbst ausfüllen (eigene Erfahrungen), sie sind absichtlich nicht vorbefüllt.

| Min. | Folie | Inhalt | Bewertungsbereich |
|---|---|---|---|
| 1 | Problem & Ziel | Viele KI-Ideen, wenig Kriterien → Leitfrage; Ziel der Anwendung | Problemanalyse (20 %) |
| 2 | Kriterienkatalog | 7 Kriterien mit Gewichten, 8 Entscheidungsregeln, 5 Empfehlungen (UI-Ansicht «Kriterien») | Problemanalyse (20 %) |
| 2 | Datenmodell | Ein Dokument pro Use Case mit eingebetteten Kriterien/Ansätzen/Bewertung; Begründung embed vs. reference, Computed Pattern (README §3) | Datenmodell (25 %) |
| 1 | Beispieldatensatz | 48 Fälle, 10 Branchen; Verteilung 13/15/10/5/5 | Datenmodell |
| 3 | Live-Demo | Fall erfassen → Live-Bewertung; Fall mit fehlenden Daten (UNKLAR); Detailansicht mit ähnlichen Fällen; Vergleich | Funktionalität (15 %) |
| 3 | Aggregationen & Indizes | 2–3 Pipelines live zeigen (`volumen`, `risiko`, `regelmaschine`), JSON-Pipeline aufklappen; Index-Tabelle mit `explain` | Abfragen/Indizes (25 %) |
| 1 | Tests | 41 Tests: geeignete vs. ungeeignete Fälle, Robustheit der Gewichte | Funktionalität/Tests |
| 1 | Antwort auf die Leitfrage | Vier Bedingungen (README §8) | Begründung (15 %) |
| 1 | Reflexion | siehe unten | Reflexion (15 %) |

**Demo-Tipp:** Vor der Präsentation `npm run seed:reset` ausführen, dann Ansicht «Auswertungen» öffnen: Das «Fazit aus den Daten» oben liefert die Kernaussagen live aus den Pipelines.

## Reflexion: Wo hat welche KI im eigenen Projekt tatsächlich geholfen?

### Belegbar (aus der Arbeit an der Erweiterung dieses Repos)

- **Claude Code (Sonnet 5.5)** wurde eingesetzt, um das bestehende CRUD-Projekt gegen die Aufgabenstellung zu prüfen und zu erweitern: Bewertungslogik, Datenmodell, Pipelines, Indizes, Beispieldatensatz, Tests, Frontend, Dokumentation. Es hat geholfen bei: Lücken-Analyse (was fehlt gegenüber den Bewertungskriterien), Schreiben von Boilerplate (Schema, Express-Routen, Tests), Aggregation-Syntax (`$bucket`, `$map/$filter`, Korrelation in der DB), konsistenter Dokumentation.
- **Wo es nicht automatisch richtig war** (und menschliche Prüfung nötig war): Die erste Bewertungsformel lieferte unplausible Ergebnisse (Passwort-Reset hatte «KI-Nutzwert 66» und war trotzdem «klassisch»; Hochrisiko-Fälle wie Triage fielen auf «manuell», weil Risiko doppelt bestraft wurde). Das fiel erst beim Durchsehen der berechneten Verteilung des Datensatzes auf und führte zu zwei Änderungen: Skalierung mit dem KI-Bedarf und teilweise Kompensation durch Human in the Loop. Ein Test (`Monotonie bei Fehlertoleranz`) schlug zudem zunächst fehl und deckte auf, dass beide Korrekturen sich aufhoben.
- **Das Modell wurde bewusst nicht als Entscheider eingesetzt**, sondern nur optional für den Begründungstext (`services/llm.js`): Die Entscheidung bleibt deterministisch, testbar und erklärbar. Das ist zugleich die Antwort auf «welche Aufgaben sollte KI übernehmen, welche besser nicht»: formulieren ja, entscheiden nein.
- **Lehre:** Die Beispieldaten und die Bewertungslogik stammen aus derselben Quelle – das erzeugt Zirkularität (README §9). KI-generierte Daten bestätigen das Modell eher, als dass sie es prüfen.

### [TEAM] Bitte selbst ergänzen

- Welche KI-Werkzeuge hat jedes Teammitglied vor dieser Erweiterung für die ursprüngliche App verwendet (Code, Design, Idee), und wofür konkret?
- Was hat gut funktioniert, was musste korrigiert werden? Ein konkretes Beispiel pro Person.
- Wo war KI-Hilfe überschätzt oder hat Zeit gekostet?
- Was würden wir beim nächsten Mal anders machen?

## [TEAM] Teamorganisation (für «beste Teamorganisation»)

Rollen, Aufgabenverteilung, Git-Workflow, Absprachen: bitte ergänzen (die Git-Historie enthält bisher nur Commits einer Person).

## Besondere Leistungen: Argumente

| Kategorie | Argument |
|---|---|
| Stärkste Datenmodellierung | Embedding mit Begründung, Computed Pattern mit Versionierung, `null` = «unbekannt» als Teil der Fachlogik, Whitelisting gegen Mass Assignment |
| Beste kritische Reflexion | README §9: Gewichte vs. Schwellen (Sensitivitätstest), Zirkularität, geschätzte Daten |
| Kreativster Use Case | Lawinengefahr-Einschätzung für Bergbahnen, Pflanzenkrankheiten per Foto, Strategie-Workshop-Moderation (bewusst «manuell») |
| Sauberste Implementierung | Reine Bewertungsfunktion ohne DB, getrennte Services, zentrale Konfiguration, Fehlerbehandlung (400/404 statt Absturz), 41 Tests |
| Überzeugendste Visualisierung | Gestapelte Verteilungsbalken je Branche/Risiko/Struktur, Fazit live aus Aggregationen, Pipeline-JSON einblendbar |
