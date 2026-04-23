import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Outlet,
  useLocation,
  useNavigate,
  useParams,
  useMatches,
} from "react-router-dom";
import { motion } from "framer-motion";
import {
  Menu,
  Home,
  ShoppingCart,
  Users,
  Settings,
  Share2,
  Building2,
  AlertCircle,
  BarChart3,
  CreditCard,
  Palette,
  Check,
  Repeat,
  Loader2,
  Languages,
  ChevronDown,
  Moon,
  Sun,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import SideBar from "@/components/ui/SideBar";
import MainContent from "@/components/ui/MainContent";
import TooltipPortal from "@/components/ui/tooltip/TooltipPortal";
import { useTheme } from "@/components/ui/theme/ThemeProvider";
import { useAppToast } from "@/components/ui/toast/AppToastProvider";
import { apiGet, apiPost } from "@/utils/api";
import { logout } from "@/utils/auth";
import {
  useAuthState,
  notifyAuthStateChanged,
} from "@/context/AuthStateContext";
import "@/styles/layouts/WorkspaceLayout.css";
import "@/styles/ui/Tooltip.css";

function createWorkspaceNav(businessId) {
  return [
    {
      id: "overview",
      label: "Overview",
      icon: Home,
      path: `/business/${businessId}`,
      enabled: true,
    },
    {
      id: "sales",
      label: "Sales",
      icon: ShoppingCart,
      path: `/business/${businessId}/sales`,
      enabled: false,
      children: [
        {
          id: "sales-overview",
          label: "Overview",
          path: `/business/${businessId}/sales`,
          enabled: false,
        },
        {
          id: "sales-record",
          label: "Record",
          path: `/business/${businessId}/sales/record`,
          enabled: false,
        },
        {
          id: "sales-list",
          label: "Sales List",
          path: `/business/${businessId}/sales/list`,
          enabled: false,
        },
        {
          id: "sales-search",
          label: "Search",
          path: `/business/${businessId}/sales/search`,
          enabled: false,
        },
        {
          id: "sales-returns",
          label: "Returns",
          path: `/business/${businessId}/sales/returns`,
          enabled: false,
        },
        {
          id: "sales-inventory",
          label: "Inventory",
          path: `/business/${businessId}/sales/inventory`,
          enabled: true,
        },
      ],
    },
    {
      id: "social",
      label: "Social",
      icon: Share2,
      path: `/business/${businessId}/social`,
      enabled: false,
      children: [
        {
          id: "social-overview",
          label: "Overview",
          path: `/business/${businessId}/social`,
          enabled: false,
        },
        {
          id: "social-whatsapp",
          label: "WhatsApp",
          path: `/business/${businessId}/social/whatsapp`,
          enabled: false,
        },
        {
          id: "social-instagram",
          label: "Instagram",
          path: `/business/${businessId}/social/instagram`,
          enabled: false,
        },
        {
          id: "social-tiktok",
          label: "TikTok",
          path: `/business/${businessId}/social/tiktok`,
          enabled: false,
        },
        {
          id: "social-google",
          label: "Google",
          path: `/business/${businessId}/social/google`,
          enabled: false,
        },
        {
          id: "social-youtube",
          label: "YouTube",
          path: `/business/${businessId}/social/youtube`,
          enabled: false,
        },
      ],
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      path: `/business/${businessId}/analytics`,
      enabled: false,
      children: [
        {
          id: "analytics-overview",
          label: "Overview",
          path: `/business/${businessId}/analytics`,
          enabled: false,
        },
        {
          id: "analytics-sales",
          label: "Sales",
          path: `/business/${businessId}/analytics/sales`,
          enabled: false,
        },
        {
          id: "analytics-social",
          label: "Social",
          path: `/business/${businessId}/analytics/social`,
          enabled: false,
        },
        {
          id: "analytics-daily",
          label: "Daily",
          path: `/business/${businessId}/analytics/daily`,
          enabled: false,
        },
        {
          id: "analytics-weekly",
          label: "Weekly",
          path: `/business/${businessId}/analytics/weekly`,
          enabled: false,
        },
        {
          id: "analytics-monthly",
          label: "Monthly",
          path: `/business/${businessId}/analytics/monthly`,
          enabled: false,
        },
      ],
    },
    {
      id: "members",
      label: "Members",
      icon: Users,
      path: `/business/${businessId}/members`,
      enabled: true,
      children: [
        {
          id: "members-overview",
          label: "Overview",
          path: `/business/${businessId}/members`,
          enabled: true,
        },
        {
          id: "members-list",
          label: "Members",
          path: `/business/${businessId}/members/list`,
          enabled: true,
        },
        {
          id: "members-roles",
          label: "Roles",
          path: `/business/${businessId}/members/roles`,
          enabled: true,
        },
        {
          id: "members-permissions",
          label: "Permissions",
          path: `/business/${businessId}/members/permissions`,
          enabled: true,
        },
        {
          id: "members-invites",
          label: "Invites",
          path: `/business/${businessId}/members/invites`,
          enabled: true,
        },
      ],
    },
    {
      id: "payments",
      label: "Payments",
      icon: CreditCard,
      path: `/business/${businessId}/payments`,
      enabled: false,
      children: [
        {
          id: "payments-overview",
          label: "Overview",
          path: `/business/${businessId}/payments`,
          enabled: false,
        },
        {
          id: "payments-transactions",
          label: "Transactions",
          path: `/business/${businessId}/payments/transactions`,
          enabled: false,
        },
        {
          id: "payments-methods",
          label: "Methods",
          path: `/business/${businessId}/payments/methods`,
          enabled: false,
        },
        {
          id: "payments-payouts",
          label: "Payouts",
          path: `/business/${businessId}/payments/payouts`,
          enabled: false,
        },
      ],
    },
    {
      id: "profile",
      label: "Profile",
      icon: Building2,
      path: `/business/${businessId}/profile`,
      enabled: true,
      children: [
        {
          id: "profile-overview",
          label: "Overview",
          path: `/business/${businessId}/profile`,
          enabled: true,
        },
        {
          id: "profile-details",
          label: "Details",
          path: `/business/${businessId}/profile/details`,
          enabled: true,
        },
        {
          id: "profile-edit",
          label: "Edit",
          path: `/business/${businessId}/profile/edit`,
          enabled: true,
        },
      ],
    },
    {
      id: "customize",
      label: "Customize",
      icon: Palette,
      path: `/business/${businessId}/customize`,
      enabled: false,
      children: [
        {
          id: "customize-overview",
          label: "Overview",
          path: `/business/${businessId}/customize`,
          enabled: false,
        },
        {
          id: "customize-theme",
          label: "Theme",
          path: `/business/${businessId}/customize/theme`,
          enabled: false,
        },
        {
          id: "customize-layout",
          label: "Layout",
          path: `/business/${businessId}/customize/layout`,
          enabled: false,
        },
        {
          id: "customize-preferences",
          label: "Prefs",
          path: `/business/${businessId}/customize/preferences`,
          enabled: false,
        },
      ],
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      path: `/business/${businessId}/settings`,
      enabled: false,
      children: [
        {
          id: "settings-overview",
          label: "Overview",
          path: `/business/${businessId}/settings`,
          enabled: false,
        },
        {
          id: "settings-user-profile",
          label: "User",
          path: `/business/${businessId}/settings/user-profile`,
          enabled: false,
        },
        {
          id: "settings-account-state",
          label: "Account",
          path: `/business/${businessId}/settings/account-state`,
          enabled: false,
        },
        {
          id: "settings-security",
          label: "Security",
          path: `/business/${businessId}/settings/security`,
          enabled: false,
        },
      ],
    },
  ];
}

function getDeepestRouteTitle(matches) {
  const titledMatches = matches.filter((match) => match?.handle?.title);
  if (!titledMatches.length) return "Business Overview";
  return titledMatches[titledMatches.length - 1].handle.title;
}

function resolveWorkspaceNavigation(navItems, pathname, matches) {
  let activeSection = "overview";
  let activeSubSection = null;

  for (const item of navItems) {
    const children = Array.isArray(item.children) ? item.children : [];

    for (const child of children) {
      if (pathname === child.path || pathname.startsWith(`${child.path}/`)) {
        activeSection = item.id;
        activeSubSection = child.id;
        return {
          activeSection,
          activeSubSection,
          title: getDeepestRouteTitle(matches),
        };
      }
    }

    if (pathname === item.path || pathname.startsWith(`${item.path}/`)) {
      activeSection = item.id;
      return {
        activeSection,
        activeSubSection,
        title: getDeepestRouteTitle(matches),
      };
    }
  }

  return {
    activeSection,
    activeSubSection,
    title: getDeepestRouteTitle(matches),
  };
}

function getInitials(name = "") {
  const cleaned = String(name).trim();
  if (!cleaned) return "B";

  const parts = cleaned.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return cleaned.slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function buildWorkspaceChecklist({ business, membership, profile }) {
  return [
    {
      id: "business",
      label: "Business loaded",
      completed: Boolean(business?.id || business?.name),
      action: null,
    },
    {
      id: "role",
      label: "Membership detected",
      completed: Boolean(membership?.role),
      action: null,
    },
    {
      id: "profile",
      label: "Profile connected",
      completed: Boolean(profile),
      action: business?.id ? `/business/${business.id}/profile` : null,
    },
    {
      id: "customize",
      label: "Workspace customization",
      completed: false,
      action: business?.id ? `/business/${business.id}/customize` : null,
    },
  ];
}

function getWorkspaceSetupLevel(context) {
  const checklist = buildWorkspaceChecklist(context);
  const completedCount = checklist.filter((item) => item.completed).length;
  return Math.round((completedCount / checklist.length) * 100);
}

function WorkspaceTopBarMenu({
  business,
  membership,
  profile,
  businesses,
  activeBusinessId,
  switchingId,
  onSwitchBusiness,
  onNavigate,
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const { t, i18n } = useTranslation(["common", "header"]);
  const { darkMode, toggleTheme } = useTheme();
  const toast = useAppToast();

  const roleLabel = membership?.role || "member";
  const displayName = business?.name || "Business";
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const checklist = useMemo(
    () => buildWorkspaceChecklist({ business, membership, profile }),
    [business, membership, profile]
  );

  const setupLevel = useMemo(
    () => getWorkspaceSetupLevel({ business, membership, profile }),
    [business, membership, profile]
  );

  const remaining = checklist.filter((item) => !item.completed);
  const hasMultipleBusinesses =
    Array.isArray(businesses) && businesses.length > 1;
  const currentLanguage = i18n.resolvedLanguage || i18n.language || "en";

  const languageOptions = useMemo(
    () => [
      {
        value: "en",
        label: t("english", { ns: "common", defaultValue: "English" }),
      },
      {
        value: "sw",
        label: t("swahili", { ns: "common", defaultValue: "Kiswahili" }),
      },
    ],
    [t]
  );

  const activeLanguage =
    languageOptions.find((option) => option.value === currentLanguage) ||
    languageOptions[0];

  const sortedBusinesses = useMemo(() => {
    const items = Array.isArray(businesses) ? [...businesses] : [];
    return items.sort((a, b) => {
      if (a.id === activeBusinessId) return -1;
      if (b.id === activeBusinessId) return 1;
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
  }, [businesses, activeBusinessId]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleLanguageChange = useCallback(
    async (event) => {
      const nextLanguage = event.target.value;

      if (!nextLanguage || nextLanguage === currentLanguage) return;

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
      } catch {
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
    <div className="topbar-user-wrapper" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`topbar-user-trigger ${open ? "open" : ""}`}
        aria-label="Open workspace menu"
      >
        <div className="topbar-user-avatar">{initials}</div>

        <div className="topbar-user-meta">
          <p className="topbar-user-name">{displayName}</p>
          <p className="topbar-user-role">{roleLabel}</p>
        </div>

        <div className="topbar-user-progress">{setupLevel}%</div>
      </button>

      {open && (
        <div className="topbar-user-menu">
          <div className="topbar-user-menu-head">
            <p className="topbar-user-menu-label">Active business</p>
            <p className="topbar-user-menu-name">{displayName}</p>
            <p className="topbar-user-menu-email">{roleLabel}</p>

            <div className="topbar-user-menu-progress">
              <div className="topbar-user-menu-progress-row">
                <span className="topbar-user-menu-progress-title">
                  Workspace setup
                </span>
                <span className="topbar-user-menu-progress-value">
                  {setupLevel}%
                </span>
              </div>

              <div className="topbar-user-menu-progress-bar">
                <div
                  className="topbar-user-menu-progress-fill"
                  style={{ width: `${setupLevel}%` }}
                />
              </div>

              {remaining.length > 0 ? (
                <div className="topbar-user-menu-checklist">
                  {remaining.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="topbar-user-menu-check-item"
                      onClick={() => {
                        if (item.action) {
                          onNavigate(item.action);
                          setOpen(false);
                        }
                      }}
                      disabled={!item.action}
                    >
                      <span className="topbar-user-menu-check-dot" />
                      <span className="topbar-user-menu-check-label">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="topbar-user-menu-complete">
                  <Check size={14} />
                  <span>Workspace is ready</span>
                </div>
              )}
            </div>
          </div>

          <div className="topbar-user-menu-section">
            <p className="topbar-user-menu-section-title">Preferences</p>

            <div className="topbar-preferences-grid">
              <TooltipPortal
                content={languageTooltip}
                placement="left"
                delay={100}
              >
                <div className="topbar-language-switch">
                  <div className="topbar-language-switch__control">
                    <Languages
                      size={16}
                      className="topbar-language-switch__icon"
                      aria-hidden="true"
                    />

                    <div className="topbar-language-switch__value">
                      <span className="topbar-language-switch__label">
                        {activeLanguage.label}
                      </span>
                    </div>

                    <ChevronDown
                      size={16}
                      className="topbar-language-switch__chevron"
                      aria-hidden="true"
                    />

                    <select
                      value={currentLanguage}
                      onChange={handleLanguageChange}
                      className="topbar-language-switch__select"
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

              <TooltipPortal content={themeTooltip} placement="left" delay={100}>
                <button
                  type="button"
                  onClick={handleThemeToggle}
                  className="topbar-theme-toggle"
                  aria-label={themeTooltip}
                >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </TooltipPortal>
            </div>
          </div>

          {hasMultipleBusinesses && (
            <>
              <div className="topbar-user-menu-divider" />

              <div className="px-3 py-2">
                <div className="topbar-switch-header mb-2 flex items-center gap-2 px-1 text-[11px] font-medium uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                  <Repeat size={13} />
                  <span>Switch business</span>
                </div>

                <div className="flex flex-col gap-2">
                  {sortedBusinesses.map((item) => {
                    const isActive = item.id === activeBusinessId;
                    const isSwitching = switchingId === item.id;

                    const roleText =
                      Array.isArray(item.roles) && item.roles.length > 0
                        ? item.roles.join(", ")
                        : "member";

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={async () => {
                          const switched = await onSwitchBusiness?.(item.id);
                          if (switched) setOpen(false);
                        }}
                        disabled={isSwitching || switchingId !== null}
                        className="topbar-menu-button rounded-2xl border border-gray-200 bg-white/80 px-3 py-3 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-[#3a3a3a] dark:bg-[#252526] dark:hover:bg-[#2a2a2a]"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 dark:bg-[#2a2a2a]">
                          {isSwitching ? (
                            <Loader2
                              size={16}
                              className="animate-spin text-[#1F75FE]"
                            />
                          ) : (
                            <Building2
                              size={16}
                              className="text-gray-500 dark:text-gray-400"
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-100">
                              {item.name || "Business"}
                            </span>

                            {isActive && (
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                Active
                              </span>
                            )}
                          </div>

                          <p className="mt-1 truncate text-xs capitalize text-gray-500 dark:text-gray-400">
                            {roleText}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function WorkspaceLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const matches = useMatches();
  const { businessId } = useParams();
  const { authState, refreshAuthState } = useAuthState();
  const toast = useAppToast();

  const [business, setBusiness] = useState(null);
  const [membership, setMembership] = useState(null);
  const [profile, setProfile] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [switchingId, setSwitchingId] = useState(null);

  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [rbacSummary, setRbacSummary] = useState(null);
  const [rbacSummaryLoading, setRbacSummaryLoading] = useState(false);

  const fetchRbacSummary = useCallback(async () => {
    if (!business || !business.id) return;

    setRbacSummaryLoading(true);

    try {
      const resp = await apiGet(`/api/businesses/${business.id}/rbac-summary/`);

      if (!resp.ok) {
        console.warn("Failed to load RBAC summary", resp.status);
        setRbacSummary(null);
        return;
      }

      const data = await resp.json();
      setRbacSummary(data || null);
    } catch (err) {
      console.error("Error fetching RBAC summary:", err);
      setRbacSummary(null);
    } finally {
      setRbacSummaryLoading(false);
    }
  }, [business]);

  useEffect(() => {
    fetchRbacSummary();

    const interval = setInterval(() => {
      fetchRbacSummary();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchRbacSummary]);

  const applyWorkspaceContext = useCallback((payload = {}) => {
    if (payload.business !== undefined) {
      setBusiness(payload.business || null);
    }

    if (payload.membership !== undefined) {
      setMembership(payload.membership || null);
    }

    if (payload.profile !== undefined) {
      setProfile(payload.profile || null);
    }
  }, []);

  const fetchBusinessContext = useCallback(async () => {
    if (!businessId) {
      toast.warning("Missing business id.");
      navigate("/account/home", { replace: true });
      return;
    }

    setLoading(true);

    try {
      const [businessResponse, businessesResponse] = await Promise.all([
        apiGet(`/api/businesses/${businessId}/`),
        apiGet("/api/businesses/"),
      ]);

      if (!businessResponse.ok) {
        if (businessResponse.status === 403) {
          toast.error("You do not have access to this business.");
          navigate("/account/home", { replace: true });
          return;
        }

        if (businessResponse.status === 404) {
          toast.error("Business not found.");
          navigate("/account/home", { replace: true });
          return;
        }

        throw new Error(`Failed to load business (${businessResponse.status})`);
      }

      const businessData = await businessResponse.json();
      applyWorkspaceContext({
        business: businessData?.business || null,
        membership: businessData?.membership || null,
        profile: businessData?.profile || null,
      });

      if (businessesResponse.ok) {
        const businessesData = await businessesResponse.json();
        const items = Array.isArray(businessesData)
          ? businessesData
          : businessesData?.results || [];
        setBusinesses(items);
      } else {
        setBusinesses([]);
      }
    } catch (err) {
      console.error("Error loading business workspace:", err);
      toast.error(err?.message || "Failed to load business workspace.");
      navigate("/account/home", { replace: true });
    } finally {
      setLoading(false);
    }
  }, [applyWorkspaceContext, businessId, navigate, toast]);

  useEffect(() => {
    fetchBusinessContext();
  }, [fetchBusinessContext]);

  const activeBusinessId = useMemo(() => {
    return authState?.active_business_id || businessId || null;
  }, [authState?.active_business_id, businessId]);

  const normalizedRole = useMemo(() => {
    return String(membership?.role || "").toLowerCase();
  }, [membership]);

  const navItems = useMemo(() => createWorkspaceNav(businessId), [businessId]);

  const routeState = useMemo(() => {
    return resolveWorkspaceNavigation(navItems, location.pathname, matches);
  }, [navItems, location.pathname, matches]);

  const isItemAccessible = (item) => {
    if (item.enabled === false) return false;

    if (item.restricted?.length) {
      return item.restricted.includes(normalizedRole);
    }

    return true;
  };

  const handleNavigation = (item) => {
    const accessible = isItemAccessible(item);

    if (!accessible) {
      toast.warning(`${item.label} is not built yet.`);
      return;
    }

    navigate(item.path);
    setIsMobileSidebarOpen(false);
  };

  const handleSwitchBusiness = async (nextBusinessId) => {
    if (!nextBusinessId) return false;
    if (switchingId) return false;

    if (nextBusinessId === activeBusinessId) {
      if (nextBusinessId !== businessId) {
        navigate(`/business/${nextBusinessId}`, { replace: true });
      }
      return true;
    }

    setSwitchingId(nextBusinessId);

    try {
      const response = await apiPost(
        `/api/businesses/${nextBusinessId}/activate/`,
        {}
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || `Failed to switch (${response.status})`);
      }

      notifyAuthStateChanged();
      await refreshAuthState();

      toast.success("Business switched successfully.");
      navigate(`/business/${nextBusinessId}`, { replace: true });
      return true;
    } catch (err) {
      console.error("Switch failed:", err);
      toast.error(err?.message || "Failed to switch business.");
      return false;
    } finally {
      setSwitchingId(null);
    }
  };

  const handleSidebarProfile = () => {
    navigate(`/business/${businessId}/profile`);
    setIsMobileSidebarOpen(false);
  };

  const handleSidebarSettings = () => {
    navigate(`/business/${businessId}/profile`);
    setIsMobileSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully.");
    navigate("/account/home", { replace: true });
  };

  if (loading) {
    return (
      <div className="account-shell-layout">
        <div className="account-shell-main">
          <MainContent>
            <div className="flex min-h-[60vh] items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                className="h-11 w-11 rounded-full border-4 border-[#1F75FE]/15 border-t-[#1F75FE]"
              />
            </div>
          </MainContent>
        </div>
      </div>
    );
  }

  if (!business || !membership) {
    return (
      <div className="account-shell-layout">
        <div className="account-shell-main">
          <MainContent>
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="rounded-[24px] border border-red-100 bg-white p-8 text-center shadow-sm dark:border-red-500/20 dark:bg-[#1e1e1e]">
                <AlertCircle size={42} className="mx-auto mb-4 text-red-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Unable to load business workspace
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  The business context is missing or you do not have access.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/account/home", { replace: true })}
                  className="mt-5 rounded-2xl bg-[#1F75FE] px-5 py-3 text-sm font-medium text-white transition hover:opacity-95"
                >
                  Back to account home
                </button>
              </div>
            </div>
          </MainContent>
        </div>
      </div>
    );
  }

  return (
    <div className="account-shell-layout">
      <SideBar
        navItems={navItems}
        activeSection={routeState.activeSection}
        activeSubSection={routeState.activeSubSection}
        onNavigate={handleNavigation}
        displayName={business?.name || "Business"}
        onProfile={handleSidebarProfile}
        onSettings={handleSidebarSettings}
        onLogout={handleLogout}
        isDesktopCollapsed={isDesktopCollapsed}
        onToggleDesktopSidebar={() => setIsDesktopCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
      />

      <div className="account-shell-main">
        <header className="account-shell-header">
          <div className="account-shell-header-inner">
            <div className="account-shell-header-left">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="account-shell-mobile-menu"
                aria-label="Open sidebar"
              >
                <Menu size={18} />
              </button>

              <p className="account-shell-header-title">{routeState.title}</p>
            </div>

            <div className="account-shell-header-right">
              <WorkspaceTopBarMenu
                business={business}
                membership={membership}
                profile={profile}
                businesses={businesses}
                activeBusinessId={activeBusinessId}
                switchingId={switchingId}
                onSwitchBusiness={handleSwitchBusiness}
                onNavigate={(path) => navigate(path)}
              />
            </div>
          </div>
        </header>

        <MainContent>
          <Outlet
            context={{
              business,
              membership,
              profile,
              businesses,
              setBusiness,
              setMembership,
              setProfile,
              setBusinesses,
              applyWorkspaceContext,
              refreshWorkspaceContext: fetchBusinessContext,
              rbacSummary,
              rbacSummaryLoading,
              refreshRbacSummary: fetchRbacSummary,
            }}
          />
        </MainContent>

        <footer className="account-shell-footer">Business workspace</footer>
      </div>
    </div>
  );
}