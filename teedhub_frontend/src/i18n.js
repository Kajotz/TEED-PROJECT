import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(LanguageDetector) // auto-detects browser language
  .use(initReactI18next) // passes i18n instance to react-i18next
  .init({
    fallbackLng: "en", // default language
    debug: true,
    interpolation: {
      escapeValue: false, // React already escapes
    },
    resources: {
      en: {
        translation: {
          welcome: "Welcome to TEED Hub",
          button_text: "Click Me",
        },
      },
      sw: {
        translation: {
          welcome: "Karibu TEED Hub",
          button_text: "Bofya Mimi",
        },
      },
    },
  });

export default i18n;
