// Unit-Tests der regelbasierten Bewertung: geeignete und ungeeignete KI-Fälle, Grenzwerte,
// fehlende Daten und Robustheit gegenüber veränderten Gewichten. Keine Datenbank nötig.
const test = require('node:test');
const assert = require('node:assert/strict');
const { bewerte, teilscores, wirtschaftlichkeit } = require('../services/bewertung');
const { GEWICHTE, SCHWELLEN } = require('../config/kriterien');
const seed = require('../data/usecases');

const fall = (overrides = {}) => ({
  titel: 'Testfall',
  risiko: overrides.risiko || 'Mittel',
  kriterien: {
    fallvolumenProMonat: 10000, datenverfuegbarkeit: 4, datenstruktur: 'unstrukturiert',
    regelkomplexitaet: 4, variabilitaet: 5, fehlertoleranz: 'hoch', erklaerbarkeit: 2, datenschutz: 2,
    ...overrides.kriterien
  },
  geschaeftswert: { nutzen: 8, aufwand: 4, zeitersparnis: 60, kostenersparnis: 40, technischeUmsetzbarkeit: 8, ...overrides.geschaeftswert }
});

const nachTitel = (titel) => seed.find((u) => u.titel.startsWith(titel));

test('Gewichte summieren sich auf 1', () => {
  const summe = Object.values(GEWICHTE).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(summe - 1) < 1e-9);
});

test.describe('geeignete KI-Fälle', () => {
  test('hohes Volumen, unstrukturiert, fehlertolerant → KI sinnvoll', () => {
    const b = bewerte(fall());
    assert.equal(b.empfehlung, 'KI_SINNVOLL');
    assert.equal(b.geeignet, true);
    assert.equal(b.humanInTheLoop, false);
    assert.ok(b.nutzwert >= SCHWELLEN.nutzwertKi);
  });

  test('Support-Klassifikation und Produktempfehlung aus dem Datensatz → KI sinnvoll', () => {
    assert.equal(bewerte(nachTitel('Automatische Klassifikation von Support')).empfehlung, 'KI_SINNVOLL');
    assert.equal(bewerte(nachTitel('Produktempfehlungen im Webshop')).empfehlung, 'KI_SINNVOLL');
  });

  test('niedrige Fehlertoleranz → höchstens Assistenz mit Human in the Loop', () => {
    const b = bewerte(fall({ kriterien: { fehlertoleranz: 'niedrig' } }));
    assert.equal(b.empfehlung, 'KI_ASSISTENZ');
    assert.equal(b.humanInTheLoop, true);
    assert.match(b.begruendung.join(' '), /Fehlertoleranz/);
  });

  test('hohes Risiko verhindert vollautomatische KI, auch bei sonst idealen Werten', () => {
    assert.equal(bewerte(fall({ risiko: 'Hoch' })).empfehlung, 'KI_ASSISTENZ');
  });

  test('sensible Daten (Datenschutz 5) → Assistenz', () => {
    assert.equal(bewerte(fall({ kriterien: { datenschutz: 5 } })).empfehlung, 'KI_ASSISTENZ');
  });

  test('Radiologie und Triage aus dem Datensatz → Assistenz', () => {
    assert.equal(bewerte(nachTitel('Diagnose-Unterstützung in der Radiologie')).empfehlung, 'KI_ASSISTENZ');
    assert.equal(bewerte(nachTitel('Triage-Empfehlung in der Notaufnahme')).empfehlung, 'KI_ASSISTENZ');
  });
});

test.describe('ungeeignete KI-Fälle', () => {
  test('eindeutige Regeln auf strukturierten Daten → klassische Lösung', () => {
    const b = bewerte(fall({ kriterien: { datenstruktur: 'strukturiert', regelkomplexitaet: 1, variabilitaet: 1 } }));
    assert.equal(b.empfehlung, 'KLASSISCH');
    assert.equal(b.geeignet, false);
  });

  test('Passwort-Reset, Rechnungsprüfung, Medikamenten-Check, Routenplanung → klassisch', () => {
    ['Passwort-Reset', 'Rechnungsprüfung auf Geschäftsregeln', 'Medikamenten-Wechselwirkungsprüfung', 'Routenoptimierung', 'Plausibilitätsprüfung von Zählerständen']
      .forEach((t) => assert.equal(bewerte(nachTitel(t)).empfehlung, 'KLASSISCH', t));
  });

  test('zu geringes Fallvolumen → manuell, selbst wenn alles andere für KI spricht', () => {
    const b = bewerte(fall({ kriterien: { fallvolumenProMonat: 10 } }));
    assert.equal(b.empfehlung, 'MANUELL');
    assert.match(b.begruendung[0], /lohnt sich keine Automatisierung/);
  });

  test('Grenzwert Fallvolumen: 49 → manuell, 50 → KI-Bewertung', () => {
    assert.equal(bewerte(fall({ kriterien: { fallvolumenProMonat: SCHWELLEN.minVolumen - 1 } })).empfehlung, 'MANUELL');
    assert.notEqual(bewerte(fall({ kriterien: { fallvolumenProMonat: SCHWELLEN.minVolumen } })).empfehlung, 'MANUELL');
  });

  test('seltene Spezialfälle aus dem Datensatz → manuell', () => {
    ['Fehleranalyse für eine einzelne Spezialmaschine', 'Fallabgleich bei seltenen Krankheiten', 'Moderation jährlicher Strategie-Workshops']
      .forEach((t) => assert.equal(bewerte(nachTitel(t)).empfehlung, 'MANUELL', t));
  });

  test('KI-Zusatznutzen ist bei Regelfällen klein (unter der Assistenz-Schwelle)', () => {
    assert.ok(bewerte(nachTitel('Passwort-Reset')).nutzwert < SCHWELLEN.nutzwertAssistenz);
  });
});

test.describe('fehlende Daten', () => {
  test('fehlende Pflichtangaben → Entscheidung nicht möglich, mit Liste der Lücken', () => {
    const b = bewerte(fall({ kriterien: { fallvolumenProMonat: null, fehlertoleranz: null } }));
    assert.equal(b.empfehlung, 'UNKLAR');
    assert.equal(b.geeignet, null);
    assert.deepEqual([...b.fehlendeAngaben].sort(), ['Fallvolumen pro Monat', 'Fehlertoleranz']);
  });

  test('kein Datenbestand bei hohem KI-Bedarf → unklar (erst Daten sammeln)', () => {
    const b = bewerte(fall({ kriterien: { datenverfuegbarkeit: 1 } }));
    assert.equal(b.empfehlung, 'UNKLAR');
    assert.match(b.begruendung.join(' '), /Daten sammeln/);
  });

  test('leerer Use Case stürzt nicht ab', () => {
    assert.equal(bewerte({}).empfehlung, 'UNKLAR');
  });
});

test.describe('Eigenschaften der Bewertung', () => {
  test('mehr verfügbare Daten senken den Nutzwert nie (Monotonie)', () => {
    let letzter = -1;
    for (let dv = 2; dv <= 5; dv++) {
      const n = bewerte(fall({ kriterien: { datenverfuegbarkeit: dv } })).nutzwert;
      assert.ok(n >= letzter, `dv=${dv}`);
      letzter = n;
    }
  });

  test('höhere Fehlertoleranz erhöht den Nutzwert; bei niedriger greift Human in the Loop', () => {
    const b = (ft) => bewerte(fall({ kriterien: { fehlertoleranz: ft } }));
    assert.ok(b('mittel').nutzwert < b('hoch').nutzwert);
    // Bei niedriger Fehlertoleranz fängt der Mensch einen Teil des Abzugs auf (Nutzwert ≈ mittel),
    // die Empfehlung ist aber restriktiver.
    assert.equal(b('niedrig').humanInTheLoop, true);
    assert.equal(b('hoch').humanInTheLoop, false);
    assert.ok(b('niedrig').nutzwert < b('hoch').nutzwert);
  });

  test('Teilscores liegen immer zwischen 0 und 100', () => {
    seed.forEach((u) => Object.values(teilscores(u)).forEach((s) => assert.ok(s >= 0 && s <= 100, u.titel)));
  });

  test('Bewertung ist deterministisch', () => {
    const a = bewerte(seed[1]);
    const b = bewerte(seed[1]);
    assert.deepEqual({ ...a, berechnetAm: 0 }, { ...b, berechnetAm: 0 });
  });

  test('Robustheit: ±50 % Änderung eines Gewichts ändert fast keine Empfehlung', () => {
    const basis = seed.map((u) => bewerte(u).empfehlung);
    let gleich = 0;
    let gesamt = 0;
    for (const key of Object.keys(GEWICHTE)) {
      for (const faktor of [0.5, 1.5]) {
        const g = { ...GEWICHTE, [key]: GEWICHTE[key] * faktor };
        const summe = Object.values(g).reduce((a, b) => a + b, 0);
        Object.keys(g).forEach((k) => { g[k] /= summe; });
        seed.forEach((u, i) => { gesamt++; if (bewerte(u, { gewichte: g }).empfehlung === basis[i]) gleich++; });
      }
    }
    assert.ok(gleich / gesamt >= 0.95, `nur ${((gleich / gesamt) * 100).toFixed(1)} % stabil`);
  });
});

test.describe('Wirtschaftlichkeit', () => {
  test('Break-even und günstigster Ansatz', () => {
    const w = wirtschaftlichkeit({
      kriterien: { fallvolumenProMonat: 1000 },
      loesungsansaetze: [
        { typ: 'Manuell', einmalaufwandCHF: 0, laufendeKostenProFall: 2 },
        { typ: 'KI', einmalaufwandCHF: 12000, laufendeKostenProFall: 0.5 }
      ]
    });
    const ki = w.ansaetze.find((a) => a.typ === 'KI');
    assert.equal(ki.breakEvenMonate, 8); // 12000 / (1000 * (2 - 0.5))
    assert.equal(ki.tco12Monate, 18000);
    assert.equal(w.guenstigsterAnsatz, 'KI'); // Manuell kostet 24000 über 12 Monate
  });

  test('ohne Ansätze oder Volumen keine Auswertung', () => {
    assert.equal(wirtschaftlichkeit({ kriterien: {}, loesungsansaetze: [] }), null);
  });
});

test.describe('Beispieldatensatz', () => {
  test('30 bis 50 Use Cases mit eindeutigen Titeln', () => {
    assert.ok(seed.length >= 30 && seed.length <= 50, `Anzahl: ${seed.length}`);
    assert.equal(new Set(seed.map((u) => u.titel)).size, seed.length);
  });

  test('alle fünf Empfehlungen kommen vor, geeignete wie ungeeignete', () => {
    const arten = new Set(seed.map((u) => bewerte(u).empfehlung));
    ['KI_SINNVOLL', 'KI_ASSISTENZ', 'KLASSISCH', 'MANUELL', 'UNKLAR'].forEach((e) => assert.ok(arten.has(e), e));
  });

  test('jeder Use Case hat mindestens zwei Lösungsansätze (Vergleich möglich)', () => {
    seed.forEach((u) => assert.ok(u.loesungsansaetze.length >= 2, u.titel));
  });

  test('mehrere Branchen und Problemtypen sind abgedeckt', () => {
    assert.ok(new Set(seed.map((u) => u.branche)).size >= 6);
    assert.ok(new Set(seed.map((u) => u.problemtyp)).size >= 6);
  });
});
