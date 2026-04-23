import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sun, Moon, Menu, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import Button from "@/components/ui/Button";
import TooltipPortal from "@/components/ui/tooltip/TooltipPortal";
import { useTheme } from "@/components/ui/theme/ThemeProvider";
import { useAppToast } from "@/components/ui/toast/AppToastProvider";
import ProductsMegaMenu from "@/components/homeUI/ProductsMegaMenu";
import "@/styles/homeUI/Header.css";

export default function Header({ loading = false }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  const productsRef = useRef(null);
  const { darkMode, toggleTheme } = useTheme();
  const { info, error } = useAppToast();
  const { t, i18n } = useTranslation(["common", "header"]);

  const currentLanguage = i18n.resolvedLanguage || i18n.language || "en";

  const productSections = useMemo(
    () => [
      {
        title: t("productSections.growth.title", { ns: "header" }),
        description: t("productSections.growth.description", { ns: "header" }),
        items: [
          {
            label: t("productSections.growth.items.analytics.label", { ns: "header" }),
            href: "/products/analytics",
            description: t(
              "productSections.growth.items.analytics.description",
              { ns: "header" }
            ),
            sublinks: [
              {
                label: t(
                  "productSections.growth.items.analytics.sublinks.trafficOverview",
                  { ns: "header" }
                ),
                href: "/products/analytics/traffic-overview",
              },
              {
                label: t(
                  "productSections.growth.items.analytics.sublinks.salesTrends",
                  { ns: "header" }
                ),
                href: "/products/analytics/sales-trends",
              },
              {
                label: t(
                  "productSections.growth.items.analytics.sublinks.performanceReports",
                  { ns: "header" }
                ),
                href: "/products/analytics/performance-reports",
              },
            ],
          },
          {
            label: t("productSections.growth.items.marketingTools.label", {
              ns: "header",
            }),
            href: "/products/marketing-tools",
            description: t(
              "productSections.growth.items.marketingTools.description",
              { ns: "header" }
            ),
            sublinks: [
              {
                label: t(
                  "productSections.growth.items.marketingTools.sublinks.campaignSupport",
                  { ns: "header" }
                ),
                href: "/products/marketing-tools/campaign-support",
              },
              {
                label: t(
                  "productSections.growth.items.marketingTools.sublinks.contentPlanning",
                  { ns: "header" }
                ),
                href: "/products/marketing-tools/content-planning",
              },
              {
                label: t(
                  "productSections.growth.items.marketingTools.sublinks.promotionFlow",
                  { ns: "header" }
                ),
                href: "/products/marketing-tools/promotion-flow",
              },
            ],
          },
          {
            label: t("productSections.growth.items.audienceInsights.label", {
              ns: "header",
            }),
            href: "/products/audience-insights",
            description: t(
              "productSections.growth.items.audienceInsights.description",
              { ns: "header" }
            ),
            sublinks: [
              {
                label: t(
                  "productSections.growth.items.audienceInsights.sublinks.customerBehavior",
                  { ns: "header" }
                ),
                href: "/products/audience-insights/customer-behavior",
              },
              {
                label: t(
                  "productSections.growth.items.audienceInsights.sublinks.retentionPatterns",
                  { ns: "header" }
                ),
                href: "/products/audience-insights/retention-patterns",
              },
              {
                label: t(
                  "productSections.growth.items.audienceInsights.sublinks.engagementSignals",
                  { ns: "header" }
                ),
                href: "/products/audience-insights/engagement-signals",
              },
            ],
          },
        ],
      },
      {
        title: t("productSections.commerce.title", { ns: "header" }),
        description: t("productSections.commerce.description", { ns: "header" }),
        items: [
          {
            label: t("productSections.commerce.items.storefront.label", {
              ns: "header",
            }),
            href: "/products/storefront",
            description: t(
              "productSections.commerce.items.storefront.description",
              { ns: "header" }
            ),
            sublinks: [
              {
                label: t(
                  "productSections.commerce.items.storefront.sublinks.catalogSetup",
                  { ns: "header" }
                ),
                href: "/products/storefront/catalog-setup",
              },
              {
                label: t(
                  "productSections.commerce.items.storefront.sublinks.mobileLayout",
                  { ns: "header" }
                ),
                href: "/products/storefront/mobile-layout",
              },
              {
                label: t(
                  "productSections.commerce.items.storefront.sublinks.customPages",
                  { ns: "header" }
                ),
                href: "/products/storefront/custom-pages",
              },
            ],
          },
          {
            label: t("productSections.commerce.items.payments.label", {
              ns: "header",
            }),
            href: "/products/payments",
            description: t(
              "productSections.commerce.items.payments.description",
              { ns: "header" }
            ),
            sublinks: [
              {
                label: t(
                  "productSections.commerce.items.payments.sublinks.secureCheckout",
                  { ns: "header" }
                ),
                href: "/products/payments/secure-checkout",
              },
              {
                label: t(
                  "productSections.commerce.items.payments.sublinks.transactionFlow",
                  { ns: "header" }
                ),
                href: "/products/payments/transaction-flow",
              },
              {
                label: t(
                  "productSections.commerce.items.payments.sublinks.payoutSupport",
                  { ns: "header" }
                ),
                href: "/products/payments/payout-support",
              },
            ],
          },
          {
            label: t("productSections.commerce.items.orders.label", { ns: "header" }),
            href: "/products/orders",
            description: t(
              "productSections.commerce.items.orders.description",
              { ns: "header" }
            ),
            sublinks: [
              {
                label: t(
                  "productSections.commerce.items.orders.sublinks.orderTracking",
                  { ns: "header" }
                ),
                href: "/products/orders/order-tracking",
              },
              {
                label: t(
                  "productSections.commerce.items.orders.sublinks.fulfillmentStates",
                  { ns: "header" }
                ),
                href: "/products/orders/fulfillment-states",
              },
              {
                label: t(
                  "productSections.commerce.items.orders.sublinks.customerHistory",
                  { ns: "header" }
                ),
                href: "/products/orders/customer-history",
              },
            ],
          },
        ],
      },
      {
        title: t("productSections.operations.title", { ns: "header" }),
        description: t("productSections.operations.description", { ns: "header" }),
        items: [
          {
            label: t("productSections.operations.items.crm.label", { ns: "header" }),
            href: "/products/crm",
            description: t(
              "productSections.operations.items.crm.description",
              { ns: "header" }
            ),
            sublinks: [
              {
                label: t(
                  "productSections.operations.items.crm.sublinks.customerRecords",
                  { ns: "header" }
                ),
                href: "/products/crm/customer-records",
              },
              {
                label: t(
                  "productSections.operations.items.crm.sublinks.followUpFlow",
                  { ns: "header" }
                ),
                href: "/products/crm/follow-up-flow",
              },
              {
                label: t(
                  "productSections.operations.items.crm.sublinks.relationshipTracking",
                  { ns: "header" }
                ),
                href: "/products/crm/relationship-tracking",
              },
            ],
          },
          {
            label: t("productSections.operations.items.inventory.label", {
              ns: "header",
            }),
            href: "/products/inventory",
            description: t(
              "productSections.operations.items.inventory.description",
              { ns: "header" }
            ),
            sublinks: [
              {
                label: t(
                  "productSections.operations.items.inventory.sublinks.stockRecords",
                  { ns: "header" }
                ),
                href: "/products/inventory/stock-records",
              },
              {
                label: t(
                  "productSections.operations.items.inventory.sublinks.lowStockAlerts",
                  { ns: "header" }
                ),
                href: "/products/inventory/low-stock-alerts",
              },
              {
                label: t(
                  "productSections.operations.items.inventory.sublinks.movementHistory",
                  { ns: "header" }
                ),
                href: "/products/inventory/movement-history",
              },
            ],
          },
          {
            label: t("productSections.operations.items.automation.label", {
              ns: "header",
            }),
            href: "/products/automation",
            description: t(
              "productSections.operations.items.automation.description",
              { ns: "header" }
            ),
            sublinks: [
              {
                label: t(
                  "productSections.operations.items.automation.sublinks.routineTasks",
                  { ns: "header" }
                ),
                href: "/products/automation/routine-tasks",
              },
              {
                label: t(
                  "productSections.operations.items.automation.sublinks.notifications",
                  { ns: "header" }
                ),
                href: "/products/automation/notifications",
              },
              {
                label: t(
                  "productSections.operations.items.automation.sublinks.workflowShortcuts",
                  { ns: "header" }
                ),
                href: "/products/automation/workflow-shortcuts",
              },
            ],
          },
        ],
      },
    ],
    [t]
  );

  const handleLanguageChange = useCallback(
    async (lang) => {
      try {
        await i18n.changeLanguage(lang);
        info(
          lang === "sw"
            ? "Lugha imebadilishwa kwenda Kiswahili."
            : "Language changed to English."
        );
      } catch {
        error("Failed to change language.");
      }
    },
    [i18n, info, error]
  );

  const handleToggleTheme = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  const handleToggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const handleToggleProducts = useCallback(() => {
    setProductsOpen((prev) => !prev);
  }, []);

  const handleCloseProducts = useCallback(() => {
    setProductsOpen(false);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (productsRef.current && !productsRef.current.contains(event.target)) {
        setProductsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-header-desktop">
          <div className="app-header-left">
            <a
              href="/"
              className="app-logo"
              aria-label={t("goToHomepage", { ns: "common" })}
            >
              <span className="logo-main">{t("logoMain", { ns: "header" })}</span>
              <span className="logo-accent">{t("logoAccent", { ns: "header" })}</span>
            </a>

            <nav className="app-nav" aria-label="Primary navigation" ref={productsRef}>
              <div className="app-nav-dropdown-wrap">
                <button
                  type="button"
                  className={`app-nav-link app-nav-trigger ${productsOpen ? "open" : ""}`}
                  onClick={handleToggleProducts}
                  aria-expanded={productsOpen}
                  aria-haspopup="true"
                >
                  <span>{t("navigation.products", { ns: "header" })}</span>
                  <ChevronRight
                    size={15}
                    className={`app-nav-chevron-right ${productsOpen ? "open" : ""}`}
                  />
                </button>

                <ProductsMegaMenu
                  mode="desktop"
                  isOpen={productsOpen}
                  sections={productSections}
                  onNavigate={handleCloseProducts}
                />
              </div>

              <a href="/resources" className="app-nav-link">
                <span>{t("navigation.resources", { ns: "header" })}</span>
              </a>

              <a href="/company" className="app-nav-link">
                <span>{t("navigation.company", { ns: "header" })}</span>
              </a>

              <a href="/pricing" className="app-nav-link">
                <span>{t("navigation.pricing", { ns: "header" })}</span>
              </a>
            </nav>
          </div>

          <div className="app-header-right">
            <TooltipPortal content={t("chooseInterfaceLanguage", { ns: "common" })}>
              <select
                value={currentLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="app-select"
                aria-label={t("selectLanguage", { ns: "common" })}
              >
                <option value="en">{t("english", { ns: "common" })}</option>
                <option value="sw">{t("swahili", { ns: "common" })}</option>
              </select>
            </TooltipPortal>

            <TooltipPortal
              content={
                darkMode
                  ? t("switchToLightMode", { ns: "common" })
                  : t("switchToDarkMode", { ns: "common" })
              }
            >
              <button
                type="button"
                onClick={handleToggleTheme}
                className="app-icon-btn"
                aria-label={
                  darkMode
                    ? t("switchToLightMode", { ns: "common" })
                    : t("switchToDarkMode", { ns: "common" })
                }
              >
                {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            </TooltipPortal>

            {!loading && (
              <TooltipPortal content={t("openSignInPage", { ns: "common" })}>
                <span className="app-inline-tooltip-anchor">
                  <Button to="/login" variant="primary" size="md">
                    {t("signIn", { ns: "common" })}
                  </Button>
                </span>
              </TooltipPortal>
            )}
          </div>
        </div>

        <div className="app-header-mobile">
          <a
            href="/"
            className="app-logo"
            aria-label={t("goToHomepage", { ns: "common" })}
          >
            <span className="logo-main">{t("logoMain", { ns: "header" })}</span>
            <span className="logo-accent">{t("logoAccent", { ns: "header" })}</span>
          </a>

          <div className="app-header-actions">
            <TooltipPortal
              content={
                darkMode
                  ? t("switchToLightMode", { ns: "common" })
                  : t("switchToDarkMode", { ns: "common" })
              }
            >
              <button
                type="button"
                onClick={handleToggleTheme}
                className="app-icon-btn"
                aria-label={
                  darkMode
                    ? t("switchToLightMode", { ns: "common" })
                    : t("switchToDarkMode", { ns: "common" })
                }
              >
                {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            </TooltipPortal>

            <TooltipPortal
              content={
                mobileMenuOpen
                  ? t("closeNavigation", { ns: "common" })
                  : t("openNavigation", { ns: "common" })
              }
            >
              <button
                type="button"
                onClick={handleToggleMobileMenu}
                className="app-icon-btn"
                aria-label={
                  mobileMenuOpen
                    ? t("mobileMenu.close", { ns: "header" })
                    : t("mobileMenu.open", { ns: "header" })
                }
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </TooltipPortal>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="app-mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
            />

            <motion.div
              className="app-mobile-menu"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <div className="app-mobile-menu-inner">
                <ProductsMegaMenu
                  mode="mobile"
                  isOpen={mobileMenuOpen}
                  sections={productSections}
                  onNavigate={closeMobileMenu}
                  productsLabel={t("navigation.products", { ns: "header" })}
                />

                <a
                  href="/resources"
                  className="app-mobile-link"
                  onClick={closeMobileMenu}
                >
                  <span>{t("navigation.resources", { ns: "header" })}</span>
                </a>

                <a
                  href="/company"
                  className="app-mobile-link"
                  onClick={closeMobileMenu}
                >
                  <span>{t("navigation.company", { ns: "header" })}</span>
                </a>

                <a
                  href="/pricing"
                  className="app-mobile-link"
                  onClick={closeMobileMenu}
                >
                  <span>{t("navigation.pricing", { ns: "header" })}</span>
                </a>

                <div className="app-mobile-controls">
                  <select
                    value={currentLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="app-select app-select-mobile"
                    aria-label={t("selectLanguage", { ns: "common" })}
                  >
                    <option value="en">{t("english", { ns: "common" })}</option>
                    <option value="sw">{t("swahili", { ns: "common" })}</option>
                  </select>

                  {!loading && (
                    <span className="app-inline-tooltip-anchor app-inline-tooltip-full">
                      <Button to="/login" variant="primary" size="md">
                        {t("signIn", { ns: "common" })}
                      </Button>
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}