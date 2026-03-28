'use strict';

const Translator = require('../components/translator.js');

module.exports = function (app) {
  const translator = new Translator();

  app.route('/api/translate').post((req, res) => {
    const { text, locale } = req.body;

    if (text === undefined || locale === undefined) {
      return res.json({ error: 'Required field(s) missing' });
    }

    if (typeof text !== 'string' || text.trim() === '') {
      return res.json({ error: 'No text to translate' });
    }

    if (locale !== 'american-to-british' && locale !== 'british-to-american') {
      return res.json({ error: 'Invalid value for locale field' });
    }

    const trimmed = text.trim();
    const plain = translator.translate(trimmed, locale);
    const translation =
      plain === trimmed
        ? 'Everything looks good to me!'
        : translator.translateWithHighlight(trimmed, locale);

    res.json({ text, translation });
  });
};
