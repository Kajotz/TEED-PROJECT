import React, { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, Languages, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import AuthStaticCanvas from "@/components/homeUI/canvas/AuthStaticCanvas";
import TooltipPortal from "@/components/ui/tooltip/TooltipPortal";
import { useTheme } from "@/components/ui/theme/ThemeProvider";
import { useAppToast } from "@/components/ui/toast/AppToastProvider";
import "@/styles/layouts/AuthLayout.css";
import "@/styles/ui/Tooltip.css";

export default function AuthLayout({ children }) {
  const { t, i18n } = useTranslation(["common", "header", "auth"]);
  const { darkMode, toggleTheme } = useTheme();
  const toast = useAppToast();

  const currentLanguage = i18n.resolvedLanguage || i18n.language || "en";

  const languageOptions = useMemo(
    () => [
      {
        value: "en",
        shortLabel: "EN",
        label: t("english", { ns: "common", defaultValue: "English" }),
      },
      {
        value: "sw",
        shortLabel: "SW",
        label: t("swahili", { ns: "common", defaultValue: "Swahili" }),
      },
    ],
    [t]
  );

  const activeLanguage =
    languageOptions.find((option) => option.value === currentLanguage) ||
    languageOptions[0];

  const handleLanguageChange = useCallback(
    async (event) => {
      const nextLanguage = event.target.value;

      if (!nextLanguage || nextLanguage === currentLanguage) {
        return;
      }

      try {
        await i18n.changeLanguage(nextLanguage);

        const selected =
          languageOptions.find((option) => option.value === nextLanguage) ||
          languageOptions[0];

        toast.success(
          t("languageChangedMessage", {
            ns: "common",
            defaultValue: "Language changed to {{language}}.",
            language: selected.label,
          })
        );
      } catch (error) {
        toast.error(
          t("languageChangeFailed", {
            ns: "common",
            defaultValue: "Failed to change language.",
          })
        );
      }
    },
    [currentLanguage, i18n, languageOptions, t, toast]
  );

  const handleThemeToggle = useCallback(() => {
    const nextDarkMode = !darkMode;
    toggleTheme();

    toast.info(
      nextDarkMode
        ? t("darkModeEnabled", {
            ns: "common",
            defaultValue: "Dark mode enabled.",
          })
        : t("lightModeEnabled", {
            ns: "common",
            defaultValue: "Light mode enabled.",
          })
    );
  }, [darkMode, toggleTheme, t, toast]);

  const languageTooltip = t("chooseInterfaceLanguage", {
    ns: "common",
    defaultValue: "Choose interface language",
  });

  const themeTooltip = darkMode
    ? t("switchToLightMode", {
        ns: "common",
        defaultValue: "Switch to light mode",
      })
    : t("switchToDarkMode", {
        ns: "common",
        defaultValue: "Switch to dark mode",
      });

  return (
    <div className={`auth-layout ${darkMode ? "is-dark" : "is-light"}`}>
      <section className="auth-shell">
        <AuthStaticCanvas darkMode={darkMode} />

        <header className="auth-header">
          <div className="auth-header__inner">
            <Link
              to="/"
              className="auth-logo"
              aria-label={t("goToHomepage", { ns: "common" })}
            >
              <span className="auth-logo__main">
                {t("logoMain", { ns: "header", defaultValue: "Teed" })}
              </span>
              <span className="auth-logo__accent">
                {t("logoAccent", { ns: "header", defaultValue: "Hub" })}
              </span>
            </Link>

            <div className="auth-header__actions">
              <TooltipPortal
                content={languageTooltip}
                placement="bottom"
                delay={100}
              >
                <div className="auth-language-switch">
                  <div className="auth-language-switch__control">
                    <Languages
                      size={16}
                      className="auth-language-switch__icon"
                      aria-hidden="true"
                    />

                    <div className="auth-language-switch__value">
                      <span className="auth-language-switch__short">
                        {activeLanguage.shortLabel}
                      </span>
                      <span className="auth-language-switch__label">
                        {activeLanguage.label}
                      </span>
                    </div>

                    <ChevronDown
                      size={16}
                      className="auth-language-switch__chevron"
                      aria-hidden="true"
                    />

                    <select
                      value={currentLanguage}
                      onChange={handleLanguageChange}
                      className="auth-language-switch__select"
                      aria-label={t("selectLanguage", {
                        ns: "common",
                        defaultValue: "Select language",
                      })}
                    >
                      {languageOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </TooltipPortal>

              <TooltipPortal
                content={themeTooltip}
                placement="bottom"
                delay={100}
              >
                <button
                  type="button"
                  onClick={handleThemeToggle}
                  className="auth-theme-toggle"
                  aria-label={themeTooltip}
                >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </TooltipPortal>
            </div>
          </div>
        </header>

        <main className="auth-main">
          <div className="auth-main__inner">{children}</div>
        </main>
      </section>

      <footer className="auth-footer">
        <div className="auth-footer__inner">
          <p className="auth-footer__text">© 2026 TEED Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}