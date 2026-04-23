import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

// EN
import enCommon from "./en/common.js";
import enHeader from "./en/header.js";
import enDashboard from "./en/dashboard.js";
import enAccount from "./en/account.js";
import enHero from "./en/hero.js";
import enPlatforms from "./en/platforms.js";

// SW
import swCommon from "./sw/common.js";
import swHeader from "./sw/header.js";
import swDashboard from "./sw/dashboard.js";
import swAccount from "./sw/account.js";
import swHero from "./sw/hero.js";
import swPlatforms from "./sw/platforms.js";

const resources = {
  en: {
    common: enCommon,
    header: enHeader,
    dashboard: enDashboard,
    account: enAccount,
    hero: enHero,
    platforms: enPlatforms,
  },
  sw: {
    common: swCommon,
    header: swHeader,
    dashboard: swDashboard,
    account: swAccount,
    hero: swHero,
    platforms: swPlatforms,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: ["en", "sw"],
    ns: ["common", "header", "dashboard", "account", "hero", "platforms"],
    defaultNS: "common",
    debug: false,

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;