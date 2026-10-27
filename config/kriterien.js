// Single Source of Truth für Kriterienkatalog, Enums, Gewichte und Schwellenwerte.
// Wird von Modell, Bewertungslogik, API (/api/meta) und Frontend verwendet.

const BRANCHEN = [
  'Gesundheitswesen', 'Finanzen', 'Einzelhandel', 'Produktion', 'Bildung',
  'Logistik', 'Öffentliche Verwaltung', 'IT & Support', 'Energie', 'Sonstiges'
];

const PROBLEMTYPEN = [
  'Klassifizierung', 'Vorhersage', 'Anomalieerkennung', 'Betrugserkennung',
  'Textverarbeitung', 'Empfehlung', 'Automatisierung', 'Regelprüfung', 'Sonstiges'
];

const RISIKEN = ['Niedrig', 'Mittel', 'Hoch'];
const DATENSTRUKTUREN = ['strukturiert', 'semi-strukturiert', 'unstrukturiert'];
const FEHLERTOLERANZEN = ['niedrig', 'mittel', 'hoch'];
const LOESUNGSTYPEN = ['Manuell', 'Regelbasiert', 'KI', 'Hybrid'];

const EMPFEHLUNGEN = {
  KI_SINNVOLL: 'KI sinnvoll',
  KI_ASSISTENZ: 'KI als Assistenz sinnvoll',
  KLASSISCH: 'Klassische Lösung geeigneter',
  MANUELL: 'Manuelle Bearbeitung geeigneter',
  UNKLAR: 'Entscheidung wegen fehlender Daten noch nicht möglich'
};

// Gewichte der Teilscores (Summe = 1). Bewusst als Konstante, damit sie transparent
// und für Sensitivitätsanalysen (siehe Tests) veränderbar sind.
const GEWICHTE = {
  kiBedarf: 0.25,          // Wie schlecht lassen sich Regeln formulieren? (Regelkomplexität, Variabilität, Datenstruktur)
  daten: 0.20,             // Sind genug Daten in brauchbarer Qualität vorhanden?
  volumen: 0.10,           // Fallvolumen pro Monat (logarithmisch)
  fehlertoleranz: 0.15,    // Wie verkraftbar sind Fehler?
  compliance: 0.10,        // Erklärbarkeit & Datenschutz (hohe Anforderungen = niedriger Score)
  wirtschaftlichkeit: 0.10,// Nutzen, Zeit-/Kostenersparnis, Aufwand
  umsetzbarkeit: 0.10      // Technische Umsetzbarkeit
};

const SCHWELLEN = {
  minVolumen: 50,           // unter 50 Fällen/Monat lohnt sich keine Automatisierung
  kiBedarfKlassisch: 40,    // darunter reichen Regeln aus
  nutzwertKi: 60,           // ab hier "KI sinnvoll" (sofern keine Restriktion)
  nutzwertAssistenz: 40,    // ab hier mindestens "KI als Assistenz"
  kiFaktorMin: 0.5,         // Multiplikator bei KI-Bedarf 0 (Regeln reichen) – bei KI-Bedarf 100 ist er 1.0
  hitlKorrektur: 0.4,       // Anteil des Abzugs (Fehlertoleranz/Compliance), den Human-in-the-Loop auffängt
  hohesRisikoAnforderung: 4 // Erklärbarkeit/Datenschutz >= 4 gilt als Restriktion
};

// Pflichtangaben für eine Bewertung. Fehlt eine, lautet die Empfehlung UNKLAR.
const PFLICHTFELDER = {
  fallvolumenProMonat: 'Fallvolumen pro Monat',
  datenverfuegbarkeit: 'Datenverfügbarkeit',
  regelkomplexitaet: 'Regelkomplexität',
  variabilitaet: 'Variabilität der Eingaben',
  fehlertoleranz: 'Fehlertoleranz'
};

const KRITERIENKATALOG = [
  { schluessel: 'kiBedarf', titel: 'KI-Bedarf (Regelschwäche)', gewicht: GEWICHTE.kiBedarf,
    frage: 'Lässt sich die Aufgabe nicht sauber in Regeln fassen?',
    beschreibung: 'Hohe Regelkomplexität, stark variierende Eingaben und unstrukturierte Daten sprechen für KI; eindeutige Regeln auf strukturierten Daten für eine klassische Lösung.' },
  { schluessel: 'daten', titel: 'Datenreife', gewicht: GEWICHTE.daten,
    frage: 'Gibt es genügend Daten in ausreichender Qualität?',
    beschreibung: 'Ohne (gelabelte) Daten kann kein ML-Modell trainiert oder evaluiert werden. Bei Datenverfügbarkeit 1 ist die Entscheidung "noch nicht möglich".' },
  { schluessel: 'volumen', titel: 'Fallvolumen', gewicht: GEWICHTE.volumen,
    frage: 'Wie oft tritt der Fall auf?',
    beschreibung: 'Logarithmische Skala von 10 bis 100\'000 Fällen/Monat. Unter 50 Fällen/Monat lohnt sich Automatisierung generell nicht (manuell).' },
  { schluessel: 'fehlertoleranz', titel: 'Fehlertoleranz', gewicht: GEWICHTE.fehlertoleranz,
    frage: 'Wie schlimm ist ein falsches Ergebnis?',
    beschreibung: 'KI ist probabilistisch. Bei niedriger Fehlertoleranz wird KI höchstens als Assistenz mit Human-in-the-Loop empfohlen.' },
  { schluessel: 'compliance', titel: 'Erklärbarkeit & Datenschutz', gewicht: GEWICHTE.compliance,
    frage: 'Muss die Entscheidung nachvollziehbar sein? Sind die Daten sensibel?',
    beschreibung: 'Hohe Anforderungen an Erklärbarkeit oder Datenschutz (>= 4) schränken KI auf eine Assistenzrolle ein.' },
  { schluessel: 'wirtschaftlichkeit', titel: 'Wirtschaftlichkeit', gewicht: GEWICHTE.wirtschaftlichkeit,
    frage: 'Stehen Nutzen und Einsparungen in einem guten Verhältnis zum Aufwand?',
    beschreibung: 'Kombination aus Geschäftsnutzen, Zeit-/Kostenersparnis und (invertiertem) Aufwand.' },
  { schluessel: 'umsetzbarkeit', titel: 'Technische Umsetzbarkeit', gewicht: GEWICHTE.umsetzbarkeit,
    frage: 'Ist das technisch mit vertretbarem Aufwand machbar?',
    beschreibung: 'Einschätzung des Teams auf einer Skala von 1 bis 10.' }
];

const ENTSCHEIDUNGSREGELN = [
  'Pflichtangabe fehlt (Volumen, Datenverfügbarkeit, Regelkomplexität, Variabilität, Fehlertoleranz) → Entscheidung noch nicht möglich',
  'Fallvolumen < 50 pro Monat → Manuelle Bearbeitung geeigneter',
  'Datenverfügbarkeit = 1 und KI-Bedarf >= 40 → Entscheidung noch nicht möglich (erst Daten erheben)',
  'KI-Bedarf < 40 (Regeln reichen aus) → Klassische Lösung geeigneter',
  'KI-Nutzwert < 40 → Klassische Lösung (Regelkomplexität <= 3) bzw. Manuelle Bearbeitung',
  'Restriktion (Risiko Hoch, Fehlertoleranz niedrig, Erklärbarkeit/Datenschutz >= 4) → KI als Assistenz (Human in the Loop)',
  'KI-Nutzwert >= 60 → KI sinnvoll',
  'sonst → KI als Assistenz sinnvoll'
];

module.exports = {
  BRANCHEN, PROBLEMTYPEN, RISIKEN, DATENSTRUKTUREN, FEHLERTOLERANZEN, LOESUNGSTYPEN,
  EMPFEHLUNGEN, GEWICHTE, SCHWELLEN, PFLICHTFELDER, KRITERIENKATALOG, ENTSCHEIDUNGSREGELN
};
