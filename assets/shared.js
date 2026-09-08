/*!
 * Simple-Editing · shared.js
 * -----------------------------------------------------------------------
 * One small controller shared by every tool in this repo.
 *
 * It does NOT try to re-implement each tool's own i18n dictionary or
 * theme colors (every tool keeps its own look & feel). What it DOES do:
 *
 *   1. Owns the two localStorage keys that store the user's theme /
 *      language choice, so picking "Dark" or "English" in one tool is
 *      remembered when you open a different tool (same-origin storage).
 *   2. Falls back sensibly to the browser's color-scheme / language
 *      preference the very first time (before the user has chosen).
 *   3. Auto-fills any "back to home" link on the page (any element with
 *      the [data-se-home] attribute) with the correct label for the
 *      current language, so every tool page can share one home button
 *      without duplicating translation strings.
 *
 * Usage in a tool page:
 *   <script src="../../assets/shared.js"></script>   (load before the
 *   page's own inline <script> so SharedSettings exists in time)
 *
 *   let theme = SharedSettings.getTheme();      // 'light' | 'dark'
 *   let lang  = SharedSettings.getLang();       // 'zh' | 'en'
 *   SharedSettings.setTheme('dark');            // persist a choice
 *   SharedSettings.setLang('en');               // persist a choice
 *   SharedSettings.paintHomeLinks(lang);         // refresh home button text
 * -----------------------------------------------------------------------
 */
(function (global) {
  'use strict';

  var THEME_KEY = 'se-theme'; // 'light' | 'dark'
  var LANG_KEY = 'se-lang';   // 'zh' | 'en'

  function systemPrefersDark() {
    return !!(global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  function systemPrefersEnglish() {
    var l = ((navigator.language || navigator.userLanguage || '') + '').toLowerCase();
    return l.indexOf('zh') !== 0;
  }

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* ignore (private mode, quota, etc.) */ }
  }

  function getTheme() {
    var saved = safeGet(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return systemPrefersDark() ? 'dark' : 'light';
  }

  function hasExplicitTheme() {
    var saved = safeGet(THEME_KEY);
    return saved === 'light' || saved === 'dark';
  }

  function setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') return;
    safeSet(THEME_KEY, theme);
    document.documentElement.dataset.theme = theme;
    queueMicrotask(paintToolbar);
  }

  function getLang() {
    var saved = safeGet(LANG_KEY);
    if (saved === 'zh' || saved === 'en') return saved;
    return systemPrefersEnglish() ? 'en' : 'zh';
  }

  function setLang(lang) {
    if (lang !== 'zh' && lang !== 'en') return;
    safeSet(LANG_KEY, lang);
    paintHomeLinks(lang);
    paintExtraTranslations(lang);
    document.dispatchEvent(new CustomEvent('se-language-change', {detail:lang}));
    queueMicrotask(paintToolbar);
  }

  // Generic "back to home" link support. Any element with
  // [data-se-home] on the page automatically gets the right label,
  // without every tool needing its own translation entry for it.
  var HOME_TEXT = { zh: '🏠 回首頁', en: '🏠 Home' };
  var HOME_TITLE = { zh: '回到工具列表', en: 'Back to the tool list' };

  function paintHomeLinks(lang) {
    var list = document.querySelectorAll('[data-se-home]');
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      el.textContent = HOME_TEXT[lang] || HOME_TEXT.zh;
      el.title = HOME_TITLE[lang] || HOME_TITLE.zh;
    }
  }

  function paintExtraTranslations(lang) {
    document.querySelectorAll('[data-se-zh][data-se-en]').forEach(function (el) {
      var value = lang === 'en' ? el.dataset.seEn : el.dataset.seZh;
      if (el.matches('input, textarea')) el.placeholder = value;
      else el.textContent = value;
    });
    document.querySelectorAll('[data-title-zh][data-title-en]').forEach(function (el) { el.title = lang === 'en' ? el.dataset.titleEn : el.dataset.titleZh; });
  }

  function applyTranslations(dict) {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.dataset.i18n;
      if (dict[key] === undefined) return;
      if (/^placeholder/i.test(key) && el.matches('textarea, input')) el.placeholder = dict[key];
      else el.textContent = dict[key];
    });
  }

  var toolbar;
  function paintToolbar() {
    if (!toolbar) return;
    var lang = getLang(), dark = document.documentElement.dataset.theme === 'dark';
    var labels = {
      theme: lang === 'en' ? '🌓 Theme: ' + (dark ? 'Dark' : 'Light') : '🌓 主題：' + (dark ? '深色' : '淺色'),
      language: lang === 'en' ? '🌐 中文' : '🌐 English',
      home: lang === 'en' ? '🏠 Home' : '🏠 回首頁'
    };
    toolbar.setAttribute('aria-label', lang === 'en' ? 'Page settings and navigation' : '頁面設定與導覽');
    toolbar.querySelectorAll('[data-se-control]').forEach(function (el) {
      var label = labels[el.dataset.seControl];
      if (el.textContent !== label) el.textContent = label;
      el.title = label;
    });
  }

  function initToolbar() {
    var theme = document.querySelector('#themeToggle, #btn-theme-toggle');
    var language = document.querySelector('#localeToggle, #langToggle, #btn-lang-toggle');
    var home = document.querySelector('[data-se-home]');
    toolbar = document.createElement('nav');
    toolbar.className = 'se-toolbar';
    [[theme, 'theme'], [language, 'language'], [home, 'home']].forEach(function (item) {
      if (!item[0]) return;
      item[0].classList.add('se-control');
      item[0].dataset.seControl = item[1];
      toolbar.appendChild(item[0]);
    });
    document.body.prepend(toolbar);
    document.documentElement.dataset.theme = getTheme();
    if (global.matchMedia) global.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
      if (hasExplicitTheme()) return;
      var theme = e.matches ? 'dark' : 'light';
      document.documentElement.dataset.theme = theme;
    });
    paintExtraTranslations(getLang());
    paintToolbar();
    new MutationObserver(paintToolbar).observe(toolbar, { childList: true, subtree: true, characterData: true });
    new MutationObserver(paintToolbar).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  function bytesToBase64(bytes) {
    var chunks = [];
    for (var i = 0; i < bytes.length; i += 32768) chunks.push(String.fromCharCode.apply(null, bytes.subarray(i, i + 32768)));
    return btoa(chunks.join(''));
  }

  async function copyText(text) {
    if (navigator.clipboard && global.isSecureContext) return navigator.clipboard.writeText(text);
    var area = document.createElement('textarea');
    area.value = text; area.style.position = 'fixed'; area.style.opacity = '0';
    document.body.appendChild(area); area.select();
    try { if (!document.execCommand('copy')) throw new Error('Copy failed'); }
    finally { area.remove(); }
  }

  function message(el, zh, en) {
    el.dataset.seZh = zh; el.dataset.seEn = en;
    el.textContent = getLang() === 'en' ? en : zh;
  }

  global.SharedSettings = {
    THEME_KEY: THEME_KEY,
    LANG_KEY: LANG_KEY,
    getTheme: getTheme,
    setTheme: setTheme,
    hasExplicitTheme: hasExplicitTheme,
    getLang: getLang,
    setLang: setLang,
    paintHomeLinks: paintHomeLinks,
    paintExtraTranslations: paintExtraTranslations,
    applyTranslations: applyTranslations,
    bytesToBase64: bytesToBase64,
    copyText: copyText,
    message: message
  };

  // Paint home links as soon as the DOM is ready, in case a page never
  // gets around to calling paintHomeLinks() itself.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      paintHomeLinks(getLang());
      initToolbar();
    });
  } else {
    paintHomeLinks(getLang());
    initToolbar();
  }
})(window);
