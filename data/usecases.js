// Beispieldatensatz: 42 KI-Use-Cases aus verschiedenen Branchen.
// Bewusst gemischt: klar geeignete, klar ungeeignete, Grenzfälle und Fälle mit fehlenden Angaben.
//
// Kurzformat (wird unten in das echte Datenmodell expandiert):
//   k = [fallvolumen/Monat, datenverfügbarkeit 1-5, struktur S|H|U, regelkomplexität 1-5, variabilität 1-5,
//        fehlertoleranz n|m|h, erklärbarkeit-Anforderung 1-5, datenschutz-Anforderung 1-5]   (null = unbekannt)
//   g = [nutzen 1-10, aufwand 1-10, zeitersparnis %, kostenersparnis %, techn. Umsetzbarkeit 1-10]
//   l = Lösungsansätze: M(kosten/Fall, genauigkeit) | R(einmal, kosten/Fall, genauigkeit) | K(...) | H(...)
// Kosten in CHF; Mitarbeitendenstunde ≈ CHF 60 -> 1 Minute manuell ≈ CHF 1.

const STRUKTUR = { S: 'strukturiert', H: 'semi-strukturiert', U: 'unstrukturiert' };
const TOLERANZ = { n: 'niedrig', m: 'mittel', h: 'hoch' };

const TEXT = {
  Manuell: 'Manuelle Bearbeitung durch Mitarbeitende',
  Regelbasiert: 'Regelwerk / Skript (deterministisch)',
  KI: 'Trainiertes ML-/LLM-Modell',
  Hybrid: 'KI-Vorschlag mit menschlicher Freigabe'
};

const M = (laufend, genauigkeit, beschreibung) => ({ typ: 'Manuell', einmalaufwandCHF: 0, laufendeKostenProFall: laufend, genauigkeit, beschreibung });
const R = (einmal, laufend, genauigkeit, beschreibung) => ({ typ: 'Regelbasiert', einmalaufwandCHF: einmal, laufendeKostenProFall: laufend, genauigkeit, beschreibung });
const K = (einmal, laufend, genauigkeit, beschreibung) => ({ typ: 'KI', einmalaufwandCHF: einmal, laufendeKostenProFall: laufend, genauigkeit, beschreibung });
const H = (einmal, laufend, genauigkeit, beschreibung) => ({ typ: 'Hybrid', einmalaufwandCHF: einmal, laufendeKostenProFall: laufend, genauigkeit, beschreibung });

const uc = (titel, beschreibung, branche, problemtyp, risiko, tags, k, g, l) => ({
  titel, beschreibung, branche, problemtyp, risiko, tags,
  kriterien: {
    fallvolumenProMonat: k[0], datenverfuegbarkeit: k[1], datenstruktur: STRUKTUR[k[2]],
    regelkomplexitaet: k[3], variabilitaet: k[4], fehlertoleranz: k[5] ? TOLERANZ[k[5]] : null,
    erklaerbarkeit: k[6], datenschutz: k[7]
  },
  geschaeftswert: { nutzen: g[0], aufwand: g[1], zeitersparnis: g[2], kostenersparnis: g[3], technischeUmsetzbarkeit: g[4] },
  loesungsansaetze: l.map((a) => ({ ...a, beschreibung: a.beschreibung || TEXT[a.typ] }))
});

module.exports = [
  // ---------------------------------------------------------------- IT & Support
  uc('Automatische Klassifikation von Support-Anfragen',
    'Eingehende Support-Mails werden automatisch einer Kategorie und Fachabteilung zugeordnet.',
    'IT & Support', 'Klassifizierung', 'Niedrig', ['support', 'text', 'nlp', 'klassifikation'],
    [12000, 5, 'U', 4, 5, 'h', 2, 2], [8, 4, 70, 40, 8],
    [M(2.0, 92), R(12000, 0.05, 61, 'Schlüsselwort-Regeln'), K(25000, 0.08, 94, 'Fine-getuntes Textklassifikationsmodell')]),

  uc('Automatische Beantwortung von Kundenfragen (Chatbot)',
    'Ein Chatbot beantwortet Standardfragen zu Produkten und Bestellungen auf Basis der Wissensdatenbank.',
    'IT & Support', 'Automatisierung', 'Mittel', ['chatbot', 'support', 'llm', 'kundenservice'],
    [8000, 4, 'U', 4, 5, 'm', 3, 3], [8, 5, 60, 45, 7],
    [M(4.0, 95), R(20000, 0.05, 55, 'Entscheidungsbaum-Bot'), K(45000, 0.25, 85, 'LLM mit Wissensdatenbank (RAG)'), H(50000, 1.2, 94, 'Chatbot, Eskalation an Mensch')]),

  uc('Passwort-Reset-Anfragen automatisieren',
    'Self-Service-Workflow für Passwort-Resets inkl. Identitätsprüfung.',
    'IT & Support', 'Automatisierung', 'Niedrig', ['support', 'workflow', 'self-service'],
    [3000, 5, 'S', 1, 1, 'h', 1, 2], [7, 2, 90, 60, 9],
    [M(3.0, 97), R(6000, 0.02, 99, 'Workflow mit Identitätsprüfung'), K(30000, 0.10, 97)]),

  uc('Zusammenfassung technischer Berichte',
    'Lange Prüf- und Störungsberichte werden automatisch in eine Management-Zusammenfassung verdichtet.',
    'IT & Support', 'Textverarbeitung', 'Niedrig', ['text', 'llm', 'zusammenfassung', 'berichte'],
    [400, 4, 'U', 5, 4, 'm', 2, 2], [7, 4, 50, 25, 8],
    [M(15.0, 90), K(15000, 0.30, 85, 'LLM-Zusammenfassung'), H(18000, 3.0, 94, 'LLM-Entwurf, Review durch Fachperson')]),

  uc('Ticket-Priorisierung nach Dringlichkeit',
    'Support-Tickets werden anhand Text, Kundentyp und Historie automatisch priorisiert.',
    'IT & Support', 'Klassifizierung', 'Mittel', ['support', 'priorisierung', 'tickets'],
    [5000, 4, 'H', 3, 3, 'm', 3, 2], [7, 4, 40, 25, 8],
    [M(1.5, 88), R(9000, 0.02, 78, 'SLA- und Kundenstatus-Regeln'), K(22000, 0.06, 90)]),

  uc('Anomalieerkennung in Server-Logs',
    'Ungewöhnliche Muster in Systemlogs werden automatisch erkannt und gemeldet.',
    'IT & Support', 'Anomalieerkennung', 'Mittel', ['logs', 'anomalie', 'monitoring', 'sensor'],
    [500000, 4, 'S', 4, 4, 'm', 2, 2], [8, 5, 80, 35, 7],
    [M(0.5, 40), R(10000, 0.001, 65, 'Schwellwert-Alarme'), K(30000, 0.002, 90, 'Unüberwachtes Anomalie-Modell')]),

  uc('Code-Review-Vorschläge für Pull Requests',
    'Ein Sprachmodell kommentiert Pull Requests mit Verbesserungsvorschlägen.',
    'IT & Support', 'Textverarbeitung', 'Mittel', ['llm', 'code', 'entwicklung'],
    [600, 3, 'U', 4, 4, 'm', 3, 3], [6, 3, 30, 15, 8],
    [M(12.0, 90), R(8000, 0.01, 40, 'Linter + Regeln'), H(8000, 1.5, 93, 'LLM-Vorschläge, Entwickler entscheidet')]),

  // ---------------------------------------------------------------- Produktion
  uc('Vorhersage von Maschinenausfällen (Predictive Maintenance)',
    'Aus Vibrations- und Temperaturdaten wird die Restlaufzeit kritischer Komponenten vorhergesagt.',
    'Produktion', 'Vorhersage', 'Hoch', ['predictive-maintenance', 'sensor', 'wartung', 'zeitreihe'],
    [20000, 4, 'S', 4, 3, 'n', 4, 1], [9, 6, 50, 40, 6],
    [M(3.0, 55), R(15000, 0.01, 62, 'Fixe Wartungsintervalle'), K(60000, 0.05, 88), H(65000, 0.8, 93, 'KI-Prognose, Instandhalter bestätigt')]),

  uc('Erkennung ungewöhnlicher Sensordaten',
    'Sensorströme von Produktionsanlagen werden in Echtzeit auf Abweichungen überwacht.',
    'Produktion', 'Anomalieerkennung', 'Mittel', ['sensor', 'anomalie', 'zeitreihe', 'iot'],
    [1000000, 4, 'S', 4, 4, 'h', 2, 1], [8, 5, 75, 30, 8],
    [M(0.4, 30), R(8000, 0.0005, 68, 'Statische Grenzwerte'), K(35000, 0.001, 91)]),

  uc('Visuelle Qualitätskontrolle (Bildklassifikation)',
    'Kameras prüfen Bauteile auf Kratzer, Risse und Montagefehler.',
    'Produktion', 'Klassifizierung', 'Mittel', ['bild', 'qualität', 'computer-vision'],
    [200000, 4, 'U', 5, 3, 'm', 3, 1], [9, 6, 85, 50, 7],
    [M(0.3, 82), R(20000, 0.001, 60, 'Klassische Bildverarbeitung'), K(55000, 0.002, 97, 'CNN-Bildklassifikation')]),

  uc('Schichtplanung nach festen Regeln (GAV)',
    'Schichtpläne werden anhand von Arbeitszeitgesetz, GAV und Verfügbarkeiten automatisch erstellt.',
    'Produktion', 'Regelprüfung', 'Mittel', ['planung', 'regeln', 'hr'],
    [300, 5, 'S', 2, 1, 'n', 5, 3], [6, 4, 70, 30, 8],
    [M(20.0, 88), R(15000, 0.1, 99, 'Regelbasierter Planer / Constraint Solver'), K(40000, 0.5, 80)]),

  uc('Bestellmengen-Berechnung für Standardmaterial',
    'Nachbestellungen von Normteilen nach Min/Max-Bestand und Lieferzeit.',
    'Produktion', 'Automatisierung', 'Niedrig', ['lager', 'bestellung', 'regeln'],
    [2000, 5, 'S', 1, 1, 'h', 1, 1], [6, 2, 80, 40, 9],
    [M(4.0, 92), R(5000, 0.01, 99, 'Min/Max-Regeln im ERP'), K(35000, 0.05, 95)]),

  uc('Zusammenfassung von Wartungsprotokollen',
    'Freitext-Protokolle von Servicetechnikern werden strukturiert und verdichtet.',
    'Produktion', 'Textverarbeitung', 'Niedrig', ['text', 'llm', 'wartung', 'protokoll'],
    [250, 3, 'U', 4, 4, 'h', 1, 1], [6, 4, 55, 25, 8],
    [M(8.0, 92), K(12000, 0.20, 88), H(14000, 2.0, 95)]),

  uc('Fehleranalyse für eine einzelne Spezialmaschine',
    'Ursachenanalyse bei seltenen Störungen einer Einzelanlage.',
    'Produktion', 'Vorhersage', 'Mittel', ['spezialfall', 'wartung'],
    [10, 2, 'H', 5, 4, 'm', 3, 1], [5, 7, 20, 10, 4],
    [M(150.0, 85), K(40000, 5.0, 60)]),

  // ---------------------------------------------------------------- Gesundheitswesen
  uc('Triage-Empfehlung in der Notaufnahme',
    'Aus Symptomen und Vitaldaten wird eine Dringlichkeitsstufe vorgeschlagen.',
    'Gesundheitswesen', 'Klassifizierung', 'Hoch', ['triage', 'medizin', 'entscheidungsunterstützung'],
    [4000, 3, 'H', 4, 4, 'n', 5, 5], [8, 8, 30, 15, 5],
    [M(6.0, 85), R(25000, 0.05, 80, 'Manchester-Triage-Regelwerk'), H(90000, 1.5, 92, 'KI-Vorschlag, Pflegefachperson entscheidet')]),

  uc('Diagnose-Unterstützung in der Radiologie',
    'Bildanalyse markiert auffällige Regionen in Röntgen- und CT-Bildern als Zweitmeinung.',
    'Gesundheitswesen', 'Klassifizierung', 'Hoch', ['bild', 'medizin', 'radiologie', 'computer-vision'],
    [6000, 4, 'U', 5, 4, 'n', 5, 5], [9, 8, 30, 10, 6],
    [M(20.0, 91), K(150000, 2.0, 94, 'Zugelassenes Medizinprodukt'), H(150000, 8.0, 97, 'KI als Zweitleser')]),

  uc('Automatische Terminerinnerungen für Arztpraxen',
    'Patienten erhalten regelbasiert SMS/Mail-Erinnerungen vor Terminen.',
    'Gesundheitswesen', 'Automatisierung', 'Niedrig', ['termine', 'workflow', 'regeln'],
    [5000, 5, 'S', 1, 1, 'h', 1, 3], [6, 1, 85, 45, 10],
    [M(2.0, 90), R(2000, 0.03, 99, 'Terminregel im Praxissystem'), K(20000, 0.08, 95)]),

  uc('Arztbrief-Entwürfe aus Konsultationsnotizen',
    'Aus Stichworten wird ein Entwurf für den Arztbrief generiert.',
    'Gesundheitswesen', 'Textverarbeitung', 'Hoch', ['text', 'llm', 'medizin', 'dokumentation'],
    [2500, 3, 'U', 5, 4, 'n', 4, 5], [8, 6, 55, 30, 7],
    [M(10.0, 96), K(60000, 0.5, 88), H(65000, 2.5, 97, 'LLM-Entwurf (on-premise), Arzt prüft und signiert')]),

  uc('Medikamenten-Wechselwirkungsprüfung',
    'Verordnungen werden gegen eine Datenbank bekannter Wechselwirkungen geprüft.',
    'Gesundheitswesen', 'Regelprüfung', 'Hoch', ['medizin', 'regeln', 'sicherheit'],
    [15000, 5, 'S', 2, 1, 'n', 5, 4], [9, 3, 70, 30, 9],
    [M(5.0, 90), R(10000, 0.01, 99, 'Interaktionsdatenbank + Regeln'), K(50000, 0.1, 93)]),

  uc('Fallabgleich bei seltenen Krankheiten',
    'Seltene Krankheitsbilder werden mit publizierten Fällen abgeglichen.',
    'Gesundheitswesen', 'Empfehlung', 'Hoch', ['medizin', 'spezialfall'],
    [15, 2, 'U', 5, 5, 'n', 5, 5], [7, 8, 20, 5, 4],
    [M(120.0, 80), K(100000, 10.0, 70)]),

  uc('Vorhersage der Aufenthaltsdauer von Patienten',
    'Prognose der Bettenbelegung aus Aufnahmedaten.',
    'Gesundheitswesen', 'Vorhersage', 'Mittel', ['prognose', 'medizin', 'planung'],
    [800, null, 'S', 4, 3, 'm', 3, 4], [6, 5, 30, 20, 6],
    [M(3.0, 60), K(40000, 0.1, null)]),

  // ---------------------------------------------------------------- Finanzen
  uc('Betrugserkennung bei Kreditkartentransaktionen',
    'Transaktionen werden in Echtzeit bewertet; verdächtige Zahlungen werden zur Prüfung blockiert.',
    'Finanzen', 'Betrugserkennung', 'Mittel', ['betrug', 'transaktionen', 'anomalie', 'echtzeit'],
    [5000000, 5, 'S', 5, 5, 'm', 3, 3], [10, 6, 90, 60, 8],
    [M(1.0, 20), R(30000, 0.0005, 70, 'Regelbasierte Betrugsregeln'), K(120000, 0.001, 96)]),

  uc('Kreditwürdigkeitsprüfung',
    'Scoring-Modell schlägt eine Kreditentscheidung vor.',
    'Finanzen', 'Klassifizierung', 'Hoch', ['kredit', 'scoring', 'finanz'],
    [3000, 4, 'S', 3, 4, 'n', 5, 5], [8, 6, 50, 30, 7],
    [M(25.0, 85), R(20000, 0.05, 82, 'Scorecard mit festen Regeln'), H(80000, 3.0, 92, 'Modell-Vorschlag, Kreditberater entscheidet')]),

  uc('Rechnungsprüfung auf Geschäftsregeln',
    'Eingangsrechnungen werden gegen Bestellung, Konditionen und Freigabelimiten geprüft.',
    'Finanzen', 'Regelprüfung', 'Mittel', ['rechnung', 'regeln', 'buchhaltung'],
    [20000, 5, 'S', 1, 2, 'm', 3, 2], [8, 3, 75, 50, 9],
    [M(3.0, 94), R(12000, 0.02, 99, 'Regelbasierte 3-Way-Match-Prüfung'), K(60000, 0.10, 96)]),

  uc('Datenextraktion aus Rechnungen (PDF)',
    'Rechnungsdaten werden aus uneinheitlichen PDF-Layouts extrahiert (OCR + Sprachmodell).',
    'Finanzen', 'Automatisierung', 'Niedrig', ['ocr', 'rechnung', 'dokumente', 'llm'],
    [15000, 4, 'U', 4, 4, 'm', 2, 3], [8, 5, 75, 45, 8],
    [M(4.0, 98), R(25000, 0.05, 65, 'Template-basierte Extraktion pro Lieferant'), K(40000, 0.10, 95, 'Dokumentenverständnis-Modell')]),

  uc('Vorsortierung von Geldwäsche-Verdachtsmeldungen',
    'Alerts aus der Transaktionsüberwachung werden nach Wahrscheinlichkeit eines echten Verdachts priorisiert.',
    'Finanzen', 'Anomalieerkennung', 'Hoch', ['geldwäsche', 'compliance', 'anomalie'],
    [10000, 3, 'S', 4, 4, 'n', 5, 5], [8, 7, 45, 30, 6],
    [M(15.0, 88), R(18000, 0.02, 60), H(95000, 4.0, 93, 'Priorisierung durch KI, Entscheid durch Compliance-Officer')]),

  uc('Personalisierte Anlageempfehlungen',
    'Individuelle Anlagevorschläge für Privatkunden auf Basis von Profil und Marktdaten.',
    'Finanzen', 'Empfehlung', 'Hoch', ['beratung', 'finanz', 'empfehlung'],
    [30, 2, 'S', 4, 4, 'n', 5, 5], [6, 8, 25, 10, 4],
    [M(60.0, 90), K(90000, 3.0, 75)]),

  // ---------------------------------------------------------------- Einzelhandel
  uc('Produktempfehlungen im Webshop',
    'Kunden erhalten personalisierte Produktvorschläge aus Kauf- und Klickhistorie.',
    'Einzelhandel', 'Empfehlung', 'Niedrig', ['empfehlung', 'webshop', 'personalisierung'],
    [2000000, 5, 'S', 5, 5, 'h', 1, 3], [8, 5, 20, 25, 9],
    [M(0.5, 40), R(10000, 0.0005, 50, 'Bestseller-/Regel-Empfehlung'), K(50000, 0.001, 82, 'Collaborative Filtering')]),

  uc('Nachfrageprognose für Filialen',
    'Absatzprognose pro Artikel und Filiale für die Bestellplanung.',
    'Einzelhandel', 'Vorhersage', 'Mittel', ['prognose', 'zeitreihe', 'planung', 'absatz'],
    [50000, 4, 'S', 4, 3, 'm', 2, 1], [8, 5, 60, 35, 8],
    [M(1.5, 60), R(8000, 0.002, 65, 'Gleitender Durchschnitt'), K(45000, 0.004, 85)]),

  uc('Aktionspreise nach festen Regeln',
    'Preise werden anhand von Aktionskalender, Marge und Lagerbestand automatisch gesetzt.',
    'Einzelhandel', 'Automatisierung', 'Niedrig', ['preis', 'regeln'],
    [4000, 5, 'S', 1, 1, 'h', 2, 1], [6, 2, 70, 30, 9],
    [M(2.0, 93), R(6000, 0.01, 99, 'Preisregeln im Kassensystem'), K(30000, 0.05, 94)]),

  uc('Stimmungsanalyse von Kundenbewertungen',
    'Rezensionen und Social-Media-Kommentare werden nach Stimmung und Thema klassifiziert.',
    'Einzelhandel', 'Klassifizierung', 'Niedrig', ['text', 'nlp', 'sentiment', 'feedback'],
    [30000, 4, 'U', 4, 5, 'h', 1, 2], [7, 3, 80, 40, 9],
    [M(1.0, 90), R(5000, 0.01, 60, 'Wortlisten'), K(18000, 0.02, 90)]),

  uc('Betrugserkennung bei Retouren',
    'Auffällige Retourenmuster einzelner Kunden werden erkannt.',
    'Einzelhandel', 'Betrugserkennung', 'Mittel', ['betrug', 'retouren', 'anomalie'],
    [null, 3, 'S', 4, 4, 'm', 3, 3], [6, 5, 40, 30, 6],
    [M(3.0, 50), K(30000, 0.02, null)]),

  // ---------------------------------------------------------------- Bildung
  uc('Erstellung von Unterrichtsmaterial',
    'Lehrpersonen generieren Arbeitsblätter, Quizfragen und Erklärtexte mit einem Sprachmodell.',
    'Bildung', 'Textverarbeitung', 'Niedrig', ['llm', 'unterricht', 'text', 'generierung'],
    [120, 3, 'U', 5, 5, 'h', 1, 1], [7, 2, 60, 30, 9],
    [M(30.0, 92), K(2000, 0.5, 80, 'Sprachmodell mit Vorlage'), H(3000, 5.0, 93, 'KI-Entwurf, Lehrperson überarbeitet')]),

  uc('Automatische Korrektur von Freitext-Prüfungen',
    'Offene Antworten werden bewertet und mit Feedback versehen.',
    'Bildung', 'Klassifizierung', 'Hoch', ['bewertung', 'text', 'nlp', 'prüfung'],
    [1500, 3, 'U', 5, 4, 'n', 5, 4], [7, 6, 60, 30, 6],
    [M(8.0, 92), K(50000, 0.5, 78), H(55000, 3.0, 94, 'KI-Bewertungsvorschlag, Lehrperson bestätigt')]),

  uc('Prüfung von Stundenplan-Konflikten',
    'Doppelbelegungen von Räumen und Lehrpersonen werden automatisch erkannt.',
    'Bildung', 'Regelprüfung', 'Niedrig', ['planung', 'regeln', 'stundenplan'],
    [400, 5, 'S', 1, 1, 'm', 2, 1], [5, 2, 80, 20, 10],
    [M(5.0, 90), R(3000, 0.01, 100, 'Constraint-Check'), K(25000, 0.1, 95)]),

  uc('Individuelle Lernpfad-Empfehlungen',
    'Lernende erhalten adaptive Übungsvorschläge auf Basis ihres Lernfortschritts.',
    'Bildung', 'Empfehlung', 'Mittel', ['adaptiv', 'lernen', 'empfehlung'],
    [3000, 1, 'H', 4, 5, 'm', 3, 4], [7, 6, 40, 20, 5],
    [M(10.0, 80), K(60000, 0.1, null)]),

  // ---------------------------------------------------------------- Logistik / Energie / Verwaltung
  uc('Routenoptimierung für Lieferfahrzeuge',
    'Touren werden unter Berücksichtigung von Zeitfenstern und Kapazität optimiert.',
    'Logistik', 'Automatisierung', 'Niedrig', ['optimierung', 'routen', 'planung'],
    [6000, 5, 'S', 2, 3, 'h', 2, 1], [8, 4, 60, 30, 8],
    [M(8.0, 70), R(15000, 0.02, 92, 'Operations-Research-Solver (Vehicle Routing)'), K(70000, 0.5, 88, 'Reinforcement Learning')]),

  uc('Vorhersage von Sendungsverzögerungen',
    'Verspätete Lieferungen werden aus Wetter, Verkehr und Historie vorhergesagt.',
    'Logistik', 'Vorhersage', 'Mittel', ['prognose', 'logistik', 'zeitreihe'],
    [90000, 4, 'S', 4, 4, 'h', 2, 1], [7, 5, 40, 25, 8],
    [M(1.0, 45), R(10000, 0.002, 60, 'Statische Laufzeit-Tabellen'), K(40000, 0.005, 84)]),

  uc('Stromlastprognose',
    'Prognose des Stromverbrauchs im Netzgebiet in 15-Minuten-Intervallen.',
    'Energie', 'Vorhersage', 'Mittel', ['prognose', 'zeitreihe', 'energie'],
    [700000, 5, 'S', 4, 3, 'm', 2, 1], [9, 5, 70, 40, 8],
    [M(0.5, 55), R(10000, 0.0005, 70, 'Lastprofile nach Wochentag'), K(45000, 0.001, 93)]),

  uc('Plausibilitätsprüfung von Zählerständen',
    'Gemeldete Zählerstände werden gegen Grenzwerte und Vorjahreswerte geprüft.',
    'Energie', 'Regelprüfung', 'Niedrig', ['regeln', 'zähler', 'plausibilität'],
    [25000, 5, 'S', 1, 2, 'm', 2, 2], [6, 2, 85, 45, 9],
    [M(1.5, 93), R(4000, 0.001, 98, 'Grenzwert- und Vorjahresregeln'), K(30000, 0.01, 97)]),

  uc('Vorprüfung von Baugesuchen',
    'Baugesuche werden auf Vollständigkeit und Einhaltung von Bauvorschriften geprüft.',
    'Öffentliche Verwaltung', 'Regelprüfung', 'Hoch', ['verwaltung', 'regeln', 'dokumente'],
    [200, 4, 'H', 3, 3, 'n', 5, 3], [7, 6, 40, 25, 6],
    [M(40.0, 90), R(30000, 1.0, 90, 'Regelbasierte Checkliste'), H(70000, 6.0, 95, 'KI liest Pläne, Sachbearbeiter entscheidet')]),

  uc('Triage von Bürgeranfragen per E-Mail',
    'Anfragen an die Gemeinde werden dem zuständigen Amt zugeordnet.',
    'Öffentliche Verwaltung', 'Klassifizierung', 'Mittel', ['text', 'nlp', 'verwaltung', 'klassifikation'],
    [3000, 4, 'U', 4, 4, 'm', 3, 4], [7, 4, 50, 30, 7],
    [M(2.5, 93), R(8000, 0.03, 60, 'Stichwortzuordnung'), H(30000, 0.4, 94, 'KI-Zuordnung, Sachbearbeiter bestätigt')]),

  // ---------------------------------------------------------------- Kreative / ungewöhnliche Fälle
  uc('Lawinengefahr-Einschätzung für Bergbahnen',
    'Wetter-, Schnee- und Messdaten werden zu einem Lawinengefahr-Vorschlag verdichtet.',
    'Sonstiges', 'Vorhersage', 'Hoch', ['wetter', 'sicherheit', 'prognose', 'sensor'],
    [900, 3, 'S', 4, 4, 'n', 5, 1], [9, 7, 30, 10, 5],
    [M(25.0, 80), R(20000, 0.5, 70, 'Lawinenbulletin-Entscheidungsmatrix'), H(85000, 3.0, 90, 'Modell-Vorschlag, Lawinenwart entscheidet')]),

  uc('Pflanzenkrankheiten per Foto erkennen (Hobbygarten-App)',
    'Nutzer fotografieren ein Blatt, die App schlägt Krankheit und Behandlung vor.',
    'Sonstiges', 'Klassifizierung', 'Niedrig', ['bild', 'computer-vision', 'consumer', 'natur'],
    [40000, 4, 'U', 5, 4, 'h', 1, 1], [6, 5, 90, 40, 8],
    [M(3.0, 70), R(10000, 0.001, 35, 'Entscheidungsbaum nach Symptomen'), K(30000, 0.002, 88)]),

  // ---------------------------------------------------------------- weitere Fälle (manuell / unklar)
  uc('Einzelfallprüfung von Garantieansprüchen bei Grossanlagen',
    'Technische Beurteilung seltener, teurer Garantiefälle bei Industrieanlagen.',
    'Produktion', 'Klassifizierung', 'Hoch', ['garantie', 'spezialfall', 'gutachten'],
    [25, 2, 'U', 5, 5, 'n', 5, 2], [5, 7, 15, 10, 4],
    [M(180.0, 90), K(80000, 12.0, 70)]),

  uc('Moderation jährlicher Strategie-Workshops',
    'KI soll die Moderation und Ergebnissicherung des jährlichen Strategieworkshops übernehmen.',
    'Sonstiges', 'Textverarbeitung', 'Mittel', ['workshop', 'moderation', 'spezialfall'],
    [4, 1, 'U', 5, 5, 'm', 3, 4], [3, 6, 10, 5, 3],
    [M(600.0, 90), K(30000, 40.0, null)]),

  uc('Vorhersage der Kundenabwanderung (Churn)',
    'Kunden mit erhöhtem Kündigungsrisiko werden früh erkannt, damit der Vertrieb gezielt eingreifen kann.',
    'Finanzen', 'Vorhersage', 'Mittel', ['churn', 'kunden', 'prognose'],
    [6000, 3, 'S', 4, 4, null, 3, 3], [7, 5, 30, 25, 7],
    [M(2.0, 50), K(40000, 0.02, null)]),

  uc('Automatische Gutachtenerstellung für Versicherungsschäden',
    'Schadengutachten sollen aus Fotos und Schadenmeldungen automatisch entstehen – bislang liegen keine digitalisierten Gutachten vor.',
    'Finanzen', 'Textverarbeitung', 'Hoch', ['versicherung', 'gutachten', 'bild', 'llm'],
    [1200, 1, 'U', 5, 5, 'n', 5, 4], [8, 8, 50, 30, 4],
    [M(45.0, 92), K(120000, 2.0, null)])
];
