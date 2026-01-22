/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// The top-30 locales on Crowdin are enabled
// but we enable only a subset of those
const locales = [
  'en',
  'ja',
  'es-ES',
  'fr',
  'pt-BR',
  'ro',
  'ru',
  'uk',
  'zh-Hans',
];

const localeConfigs = {
  en: {
    label: 'English',
  },
  ja: {
    label: '日本語',
  },
  'es-ES': {
    label: 'Español',
  },
  fr: {
    label: 'Français',
  },
  'pt-BR': {
    label: 'Português (Brasil)',
  },
  ro: {
    label: 'Română',
  },
  ru: {
    label: 'Русский',
  },
  uk: {
    label: 'Українська',
  },
  'zh-Hans': {
    label: '简体中文',
  },
};

// Docusaurus 2 i18n config
module.exports = {
  defaultLocale: 'en',
  locales,
  localeConfigs,
};
