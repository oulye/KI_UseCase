// Regelbasierte, deterministische Bewertung eines Use Cases.
// Reine Funktionen ohne DB-Zugriff -> leicht testbar und vollständig nachvollziehbar.

const { GEWICHTE, SCHWELLEN, PFLICHTFELDER, EMPFEHLUNGEN } = require('../config/kriterien');

const BEWERTUNG_VERSION = 1;

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const round = (value, digits = 0) => {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
};
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

// Skala 1..max -> 0..100
const skala = (value, max) => clamp(((value - 1) / (max - 1)) * 100);

const STRUKTUR_FAKTOR = { strukturiert: 0, 'semi-strukturiert': 0.5, unstrukturiert: 1 };
const TOLERANZ_SCORE = { niedrig: 0, mittel: 50, hoch: 100 };

function fehlendeAngaben(kriterien = {}) {
  return Object.entries(PFLICHTFELDER)
    .filter(([key]) => !isNum(kriterien[key]) && !(key === 'fehlertoleranz' && TOLERANZ_SCORE[kriterien[key]] !== undefined))
    .map(([, label]) => label);
}

function teilscores(uc) {
  const k = uc.kriterien || {};
  const g = uc.geschaeftswert || {};

  const regel = isNum(k.regelkomplexitaet) ? skala(k.regelkomplexitaet, 5) : 0;
  const varia = isNum(k.variabilitaet) ? skala(k.variabilitaet, 5) : 0;
  const struktur = (STRUKTUR_FAKTOR[k.datenstruktur] ?? 0.5) * 100;

  const erkl = isNum(k.erklaerbarkeit) ? skala(k.erklaerbarkeit, 5) : 50;
  const dsg = isNum(k.datenschutz) ? skala(k.datenschutz, 5) : 50;

  const nutzen = isNum(g.nutzen) ? skala(g.nutzen, 10) : 50;
  const zeit = isNum(g.zeitersparnis) ? clamp(g.zeitersparnis) : 0;
  const kosten = isNum(g.kostenersparnis) ? clamp(g.kostenersparnis) : 0;
  const aufwand = isNum(g.aufwand) ? 100 - skala(g.aufwand, 10) : 50;

  const volumen = isNum(k.fallvolumenProMonat) && k.fallvolumenProMonat > 0
    ? clamp((Math.log10(k.fallvolumenProMonat / 10) / 4) * 100)
    : 0;

  return {
    kiBedarf: round(regel * 0.5 + varia * 0.3 + struktur * 0.2),
    daten: isNum(k.datenverfuegbarkeit) ? round(skala(k.datenverfuegbarkeit, 5)) : 0,
    volumen: round(volumen),
    fehlertoleranz: TOLERANZ_SCORE[k.fehlertoleranz] ?? 0,
    compliance: round(100 - (erkl * 0.5 + dsg * 0.5)),
    wirtschaftlichkeit: round(nutzen * 0.4 + zeit * 0.2 + kosten * 0.2 + aufwand * 0.2),
    umsetzbarkeit: isNum(g.technischeUmsetzbarkeit) ? round(skala(g.technischeUmsetzbarkeit, 10)) : 50
  };
}

// KI-Nutzwert (0-100) = gewichtete Summe der Teilscores, skaliert mit dem KI-Bedarf:
// Je besser Regeln die Aufgabe abdecken, desto kleiner ist der *zusätzliche* Nutzen von KI.
// hitl=true: Mit Human in the Loop werden die Abzüge für Fehlertoleranz und Compliance
// nur zu (1 - hitlKorrektur) wirksam, weil der Mensch Fehler auffängt.
function nutzwertAus(scores, gewichte = GEWICHTE, { hitl = false } = {}) {
  let summe = Object.entries(gewichte).reduce((acc, [key, w]) => acc + (scores[key] ?? 0) * w, 0);
  if (hitl) {
    const abzug = (100 - scores.fehlertoleranz) * gewichte.fehlertoleranz + (100 - scores.compliance) * gewichte.compliance;
    summe += SCHWELLEN.hitlKorrektur * abzug;
  }
  const faktor = SCHWELLEN.kiFaktorMin + (1 - SCHWELLEN.kiFaktorMin) * (scores.kiBedarf / 100);
  return round(clamp(summe) * faktor);
}

function einschraenkungen(uc) {
  const k = uc.kriterien || {};
  const liste = [];
  if (uc.risiko === 'Hoch') liste.push('Risiko ist hoch');
  if (k.fehlertoleranz === 'niedrig') liste.push('Fehlertoleranz ist niedrig');
  if (isNum(k.erklaerbarkeit) && k.erklaerbarkeit >= SCHWELLEN.hohesRisikoAnforderung) {
    liste.push(`hohe Anforderung an Erklärbarkeit (${k.erklaerbarkeit}/5)`);
  }
  if (isNum(k.datenschutz) && k.datenschutz >= SCHWELLEN.hohesRisikoAnforderung) {
    liste.push(`sensible Daten / hoher Datenschutzbedarf (${k.datenschutz}/5)`);
  }
  return liste;
}

function bewerte(uc, { gewichte = GEWICHTE } = {}) {
  const k = uc.kriterien || {};
  const scores = teilscores(uc);
  const restriktionen = einschraenkungen(uc);
  const nutzwert = nutzwertAus(scores, gewichte, { hitl: restriktionen.length > 0 });
  const fehlend = fehlendeAngaben(k);
  const begruendung = [];
  let empfehlung;

  const fertig = (key, hitl = false) => ({
    empfehlung: key,
    empfehlungText: EMPFEHLUNGEN[key],
    geeignet: key === 'KI_SINNVOLL' || key === 'KI_ASSISTENZ' ? true : key === 'UNKLAR' ? null : false,
    humanInTheLoop: hitl,
    nutzwert,
    teilscores: scores,
    begruendung,
    fehlendeAngaben: fehlend,
    version: BEWERTUNG_VERSION,
    berechnetAm: new Date()
  });

  if (fehlend.length) {
    begruendung.push(`Es fehlen Pflichtangaben: ${fehlend.join(', ')}.`);
    begruendung.push('Ohne diese Angaben ist keine seriöse Aussage möglich – zuerst Daten erheben.');
    return fertig('UNKLAR');
  }

  if (k.fallvolumenProMonat < SCHWELLEN.minVolumen) {
    begruendung.push(`Mit ${k.fallvolumenProMonat} Fällen pro Monat (< ${SCHWELLEN.minVolumen}) lohnt sich keine Automatisierung.`);
    begruendung.push('Entwicklungs- und Betriebsaufwand übersteigen den Nutzen – manuelle Bearbeitung (ggf. mit Checkliste).');
    return fertig('MANUELL');
  }

  if (k.datenverfuegbarkeit <= 1 && scores.kiBedarf >= SCHWELLEN.kiBedarfKlassisch) {
    begruendung.push('Der Fall würde von KI profitieren (KI-Bedarf ' + scores.kiBedarf + '/100), es sind aber praktisch keine Daten vorhanden.');
    begruendung.push('Zuerst Daten sammeln bzw. labeln, danach neu bewerten.');
    return fertig('UNKLAR');
  }

  if (scores.kiBedarf < SCHWELLEN.kiBedarfKlassisch) {
    begruendung.push(`Die Aufgabe ist über Regeln gut abbildbar (KI-Bedarf nur ${scores.kiBedarf}/100: Regelkomplexität ${k.regelkomplexitaet}/5, Variabilität ${k.variabilitaet}/5).`);
    begruendung.push('Eine regelbasierte Lösung ist deterministisch, erklärbar, günstiger im Betrieb und ohne Trainingsdaten umsetzbar.');
    return fertig('KLASSISCH');
  }

  if (nutzwert < SCHWELLEN.nutzwertAssistenz) {
    begruendung.push(`Der KI-Nutzwert ist mit ${nutzwert}/100 zu gering (Schwelle ${SCHWELLEN.nutzwertAssistenz}).`);
    if (k.regelkomplexitaet <= 3) {
      begruendung.push('Die Regeln sind formulierbar – eine klassische, regelbasierte Lösung ist geeigneter.');
      return fertig('KLASSISCH');
    }
    begruendung.push('Die Regeln sind schwer formalisierbar, KI bringt aber zu wenig Nutzen – manuelle Bearbeitung ist geeigneter.');
    return fertig('MANUELL');
  }

  if (restriktionen.length) {
    begruendung.push(`KI-Nutzwert ${nutzwert}/100 (mit Human in the Loop), aber: ${restriktionen.join('; ')}.`);
    begruendung.push('KI liefert Vorschläge, der Mensch entscheidet (Human in the Loop).');
    return fertig('KI_ASSISTENZ', true);
  }

  if (nutzwert >= SCHWELLEN.nutzwertKi) {
    begruendung.push(`Hoher KI-Nutzwert (${nutzwert}/100): Regeln allein genügen nicht (KI-Bedarf ${scores.kiBedarf}/100), Daten (${scores.daten}/100) und Volumen (${k.fallvolumenProMonat}/Monat) sind vorhanden.`);
    begruendung.push('Fehler sind tolerierbar und es bestehen keine besonderen Erklärbarkeits- oder Datenschutzauflagen.');
    return fertig('KI_SINNVOLL');
  }

  begruendung.push(`Mittlerer KI-Nutzwert (${nutzwert}/100, Schwelle für vollautomatisch: ${SCHWELLEN.nutzwertKi}).`);
  begruendung.push('KI als Assistenz mit stichprobenartiger Kontrolle ist sinnvoll.');
  return fertig('KI_ASSISTENZ', true);
}

// Gesamtkosten (CHF) eines Lösungsansatzes über 12 Monate.
function tco12(loesung, fallvolumen) {
  return (loesung.einmalaufwandCHF || 0) + 12 * (fallvolumen || 0) * (loesung.laufendeKostenProFall || 0);
}

// Bewertet die Ansätze eines Use Cases (Break-even gegenüber manueller Bearbeitung).
function wirtschaftlichkeit(uc) {
  const fv = uc.kriterien?.fallvolumenProMonat;
  const ansaetze = uc.loesungsansaetze || [];
  if (!isNum(fv) || !ansaetze.length) return null;

  const manuell = ansaetze.find((a) => a.typ === 'Manuell');
  const mitTco = ansaetze.map((a) => {
    const tco = tco12(a, fv);
    let breakEvenMonate = null;
    if (manuell && a.typ !== 'Manuell' && manuell.laufendeKostenProFall > a.laufendeKostenProFall && fv > 0) {
      breakEvenMonate = round((a.einmalaufwandCHF || 0) / (fv * (manuell.laufendeKostenProFall - a.laufendeKostenProFall)), 1);
    }
    return { typ: a.typ, tco12Monate: round(tco), breakEvenMonate };
  });
  const guenstigster = mitTco.reduce((best, a) => (a.tco12Monate < best.tco12Monate ? a : best));
  return { ansaetze: mitTco, guenstigsterAnsatz: guenstigster.typ };
}

module.exports = { bewerte, teilscores, nutzwertAus, fehlendeAngaben, einschraenkungen, tco12, wirtschaftlichkeit, BEWERTUNG_VERSION };
