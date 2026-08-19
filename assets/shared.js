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

  global.SharedSettings = {
    THEME_KEY: THEME_KEY,
    LANG_KEY: LANG_KEY,
    getTheme: getTheme,
    setTheme: setTheme,
    hasExplicitTheme: hasExplicitTheme,
    getLang: getLang,
    setLang: setLang,
    paintHomeLinks: paintHomeLinks
  };

  // Paint home links as soon as the DOM is ready, in case a page never
  // gets around to calling paintHomeLinks() itself.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      paintHomeLinks(getLang());
    });
  } else {
    paintHomeLinks(getLang());
  }
})(window);
