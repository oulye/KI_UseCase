// Optionale textuelle Begründung durch ein Sprachmodell.
// Die Entscheidung selbst bleibt regelbasiert (deterministisch); das LLM formuliert nur den Text.
// Ohne Konfiguration wird die regelbasierte Begründung zu einem Fliesstext zusammengesetzt.

const { EMPFEHLUNGEN } = require('../config/kriterien');

const regelText = (uc) => {
  const b = uc.bewertung;
  return `Empfehlung: ${EMPFEHLUNGEN[b.empfehlung]} (KI-Nutzwert ${b.nutzwert}/100). ${b.begruendung.join(' ')}`;
};

function prompt(uc) {
  const b = uc.bewertung;
  return [
    'Du bist Berater für den sinnvollen Einsatz von KI. Formuliere in 3-4 Sätzen auf Deutsch eine sachliche Begründung für die folgende Empfehlung.',
    'Ändere die Empfehlung NICHT, erfinde keine Zahlen und nenne Risiken und Alternativen.',
    `Use Case: ${uc.titel} – ${uc.beschreibung || 'keine Beschreibung'}`,
    `Branche: ${uc.branche || 'unbekannt'}, Problemtyp: ${uc.problemtyp || 'unbekannt'}, Risiko: ${uc.risiko}`,
    `Kriterien: ${JSON.stringify(uc.kriterien)}`,
    `Teilscores (0-100): ${JSON.stringify(b.teilscores)}`,
    `Empfehlung (regelbasiert): ${EMPFEHLUNGEN[b.empfehlung]}, Nutzwert ${b.nutzwert}/100`,
    `Regelbasierte Gründe: ${b.begruendung.join(' ')}`
  ].join('\n');
}

async function ueberAnthropic(uc) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt(uc) }]
    })
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
  const json = await res.json();
  return { text: json.content.map((c) => c.text || '').join('').trim(), quelle: `anthropic:${json.model}` };
}

async function ueberOllama(uc) {
  const res = await fetch(`${process.env.OLLAMA_URL || 'http://127.0.0.1:11434'}/api/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: process.env.OLLAMA_MODEL, prompt: prompt(uc), stream: false })
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  const json = await res.json();
  return { text: String(json.response || '').trim(), quelle: `ollama:${process.env.OLLAMA_MODEL}` };
}

async function generiereBegruendung(uc) {
  try {
    if (process.env.ANTHROPIC_API_KEY) return await ueberAnthropic(uc);
    if (process.env.OLLAMA_MODEL) return await ueberOllama(uc);
  } catch (err) {
    console.warn('LLM-Begründung fehlgeschlagen, Fallback auf Regeltext:', err.message);
  }
  return { text: regelText(uc), quelle: 'regelbasiert' };
}

module.exports = { generiereBegruendung, regelText };
