const americanOnly = require('./american-only.js');
const americanToBritishSpelling = require('./american-to-british-spelling.js');
const britishOnly = require('./british-only.js');

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sortKeysLongestFirst(obj) {
  return Object.keys(obj).sort((a, b) => b.length - a.length);
}

function applyCasePattern(replacement, match) {
  if (!match.length) return replacement;
  if (match === match.toUpperCase()) return replacement.toUpperCase();
  if (match[0] === match[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function phrasePattern(phrase) {
  const parts = phrase.split(/\s+/).map(escapeRegex);
  return new RegExp(`\\b${parts.join('\\s+')}\\b`, 'gi');
}

function replacePhrases(str, dict, highlightParts) {
  let out = str;
  const keys = sortKeysLongestFirst(dict);
  for (const key of keys) {
    const replacement = dict[key];
    const re = phrasePattern(key);
    out = out.replace(re, (match) => {
      const repl = applyCasePattern(replacement, match);
      if (highlightParts) {
        const id = highlightParts.length;
        highlightParts.push(repl);
        return `⟦${id}⟧`;
      }
      return repl;
    });
  }
  return out;
}

function replaceSpelling(str, dict, highlightParts) {
  let out = str;
  const keys = sortKeysLongestFirst(dict);
  for (const key of keys) {
    const replacement = dict[key];
    const re = new RegExp(`\\b${escapeRegex(key)}\\b`, 'gi');
    out = out.replace(re, (match) => {
      const repl = applyCasePattern(replacement, match);
      if (highlightParts) {
        const id = highlightParts.length;
        highlightParts.push(repl);
        return `⟦${id}⟧`;
      }
      return repl;
    });
  }
  return out;
}

function americanToBritishTitlesRemovePeriod(str, highlightParts) {
  return str.replace(/\b(Mr|Mrs|Ms|Mx|Dr|Prof)\./gi, (match) => {
    const base = match.slice(0, -1);
    const repl =
      base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
    if (highlightParts) {
      const id = highlightParts.length;
      highlightParts.push(repl);
      return `⟦${id}⟧`;
    }
    return repl;
  });
}

function britishToAmericanTitlesAddPeriod(str, highlightParts) {
  return str.replace(/\b(Mr|Mrs|Ms|Mx|Dr|Prof)\b(?!\.)/gi, (match) => {
    const repl =
      match.charAt(0).toUpperCase() + match.slice(1).toLowerCase() + '.';
    if (highlightParts) {
      const id = highlightParts.length;
      highlightParts.push(repl);
      return `⟦${id}⟧`;
    }
    return repl;
  });
}

function convertTimeAmericanToBritish(str, highlightParts) {
  return str.replace(/\b(\d{1,2}):(\d{2})\b/g, (match, h, m) => {
    const repl = `${h}.${m}`;
    if (highlightParts) {
      const id = highlightParts.length;
      highlightParts.push(repl);
      return `⟦${id}⟧`;
    }
    return repl;
  });
}

function convertTimeBritishToAmerican(str, highlightParts) {
  return str.replace(/\b(\d{1,2})\.(\d{2})\b/g, (match, h, m) => {
    const repl = `${h}:${m}`;
    if (highlightParts) {
      const id = highlightParts.length;
      highlightParts.push(repl);
      return `⟦${id}⟧`;
    }
    return repl;
  });
}

function buildBritishToAmericanSpelling() {
  const rev = {};
  for (const [us, uk] of Object.entries(americanToBritishSpelling)) {
    rev[uk] = us;
  }
  return rev;
}

const britishToAmericanSpelling = buildBritishToAmericanSpelling();

function expandHighlightPlaceholders(str, parts) {
  return str.replace(/⟦(\d+)⟧/g, (_, id) => {
    const text = parts[Number(id)];
    return `<span class="highlight">${text}</span>`;
  });
}

class Translator {
  translate(text, locale) {
    if (locale === 'american-to-british') {
      return this._americanToBritish(text, null);
    }
    if (locale === 'british-to-american') {
      return this._britishToAmerican(text, null);
    }
    return text;
  }

  translateWithHighlight(text, locale) {
    const parts = [];
    let s;
    if (locale === 'american-to-british') {
      s = this._americanToBritish(text, parts);
    } else if (locale === 'british-to-american') {
      s = this._britishToAmerican(text, parts);
    } else {
      return text;
    }
    return expandHighlightPlaceholders(s, parts);
  }

  _americanToBritish(text, highlightParts) {
    let s = text;
    s = replacePhrases(s, americanOnly, highlightParts);
    s = replaceSpelling(s, americanToBritishSpelling, highlightParts);
    s = americanToBritishTitlesRemovePeriod(s, highlightParts);
    s = convertTimeAmericanToBritish(s, highlightParts);
    return s;
  }

  _britishToAmerican(text, highlightParts) {
    let s = text;
    s = replacePhrases(s, britishOnly, highlightParts);
    s = replaceSpelling(s, britishToAmericanSpelling, highlightParts);
    s = britishToAmericanTitlesAddPeriod(s, highlightParts);
    s = convertTimeBritishToAmerican(s, highlightParts);
    return s;
  }
}

module.exports = Translator;
