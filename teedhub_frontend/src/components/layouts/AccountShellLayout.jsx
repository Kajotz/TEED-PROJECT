import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  Home,
  Building2,
  Mail,
  Settings,
  UserCircle2,
  ShieldCheck,
  Check,
  User,
  LogOut,
  Languages,
  ChevronDown,
  Moon,
  Sun,
  LockKeyhole,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAuthState } from "@/context/AuthStateContext";
import SideBar from "@/components/ui/SideBar";
import MainContent from "@/components/ui/MainContent";
import TooltipPortal from "@/components/ui/tooltip/TooltipPortal";
import { useTheme } from "@/components/ui/theme/ThemeProvider";
import { useAppToast } from "@/components/ui/toast/AppToastProvider";
import { logout } from "@/utils/auth";
import "@/styles/layouts/AccountShellLayout.css";
import "@/styles/ui/Tooltip.css";

function getDisplayName(authState) {
  const profile = authState?.profile_summary || {};
  return profile.username || profile.email?.split("@")[0] || "User";
}

function getDisplayEmail(authState) {
  const profile = authState?.profile_summary || {};
  return profile.email || authState?.email || "";
}

function getInitials(name = "") {
  const cleaned = String(name).trim();
  if (!cleaned) return "U";

  const parts = cleaned.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return cleaned.slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function getCurrentSection(pathname) {
  if (pathname === "/account" || pathname === "/account/home") return "home";
  if (pathname.startsWith("/account/invites")) return "invites";
  if (pathname.startsWith("/account/create-business")) return "create-business";
  if (pathname.startsWith("/account/settings/security/recovery")) return "recovery";
  if (pathname.startsWith("/account/settings/security")) return "security";
  if (pathname.startsWith("/account/settings")) return "settings";
  if (pathname.startsWith("/account/profile")) return "profile";
  return "home";
}

function getHeaderTitle(section) {
  switch (section) {
    case "invites":
      return "Invitations";
    case "profile":
      return "My Profile";
    case "settings":
      return "Account Settings";
    case "security":
      return "Security";
    case "recovery":
      return "Recovery Methods";
    case "create-business":
      return "Create Business";
    case "home":
    default:
      return "Account Overview";
  }
}

function getAccountChecklist(authState) {
  const profile = authState?.profile_summary || {};
  const missingFields = Array.isArray(authState?.missing_fields)
    ? authState.missing_fields
    : [];

  const hasPhone =
    Boolean(profile?.phone_number) || !missingFields.includes("phone_number");

  const hasCountry =
    Boolean(profile?.country) || !missingFields.includes("country");

  const hasBusinessAccess = Boolean(authState?.has_business_access);
  const hasPendingMembership = Boolean(authState?.has_pending_membership);

  return [
    {
      id: "auth",
      label: "Signed in",
      completed: Boolean(authState?.authenticated),
      action: null,
    },
    {
      id: "identity",
      label: "Identity verified",
      completed: Boolean(authState?.identity_verified),
      action: null,
    },
    {
      id: "phone",
      label: "Phone added",
      completed: hasPhone,
      action: "/account/settings/security",
    },
    {
      id: "country",
      label: "Country added",
      completed: hasCountry,
      action: "/account/profile",
    },
    {
      id: "account",
      label: "Account completed",
      completed: Boolean(authState?.account_completed),
      action: "/account/profile",
    },
    {
      id: "business",
      label: hasPendingMembership ? "Invitation waiting" : "Business access",
      completed: hasBusinessAccess || hasPendingMembership,
      action: hasPendingMembership ? "/account/invites" : "/account/create-business",
    },
  ];
}

function getAccountSetupLevel(authState) {
  const checklist = getAccountChecklist(authState);
  const completedCount = checklist.filter((item) => item.completed).length;
  return Math.round((completedCount / checklist.length) * 100);
}

function TopBarUserMenu({
  authState,
  displayName,
  onProfile,
  onSettings,
  onLogout,
  onNavigate,
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const { t, i18n } = useTranslation(["common", "header"]);
  const { darkMode, toggleTheme } = useTheme();
  const toast = useAppToast();

  const initials = useMemo(() => getInitials(displayName), [displayName]);
  const email = useMemo(() => getDisplayEmail(authState), [authState]);
  const checklist = useMemo(() => getAccountChecklist(authState), [authState]);
  const setupLevel = useMemo(() => getAccountSetupLevel(authState), [authState]);

  const remaining = checklist.filter((item) => !item.completed);
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
        aria-label="Open account menu"
      >
        <div className="topbar-user-avatar">{initials}</div>

        <div className="topbar-user-meta">
          <p className="topbar-user-name">{displayName}</p>
          <p className="topbar-user-role">Account</p>
        </div>

        <div className="topbar-user-progress">{setupLevel}%</div>
      </button>

      {open && (
        <div className="topbar-user-menu">
          <div className="topbar-user-menu-head">
            <p className="topbar-user-menu-label">Signed in as</p>
            <p className="topbar-user-menu-name">{displayName}</p>
            {email ? <p className="topbar-user-menu-email">{email}</p> : null}

            <div className="topbar-user-menu-progress">
              <div className="topbar-user-menu-progress-row">
                <span className="topbar-user-menu-progress-title">
                  Account setup
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
                  <span>Everything is completed</span>
                </div>
              )}
            </div>
          </div>

          <div className="topbar-user-menu-section">
            <p className="topbar-user-menu-section-title">Preferences</p>

            <div className="topbar-preferences-grid">
              <TooltipPortal content={languageTooltip} placement="left" delay={100}>
                <div className="topbar-language-switch">
                  <div className="topbar-language-switch__control">
                    <Languages
                      size={16}
                      className="topbar-language-switch__icon"
                      aria-hidden="true"
                    />

                    <div className="topbar-language-switch__value">
                      <span className="topbar-language-switch__short">
                        {activeLanguage.shortLabel}
                      </span>
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

          <div className="topbar-user-menu-divider" />

          <button
            type="button"
            onClick={() => {
              onProfile?.();
              setOpen(false);
            }}
            className="topbar-menu-button"
          >
            <User size={16} />
            <span>Profile</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSettings?.();
              setOpen(false);
            }}
            className="topbar-menu-button"
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>

          <div className="topbar-user-menu-divider" />

          <button
            type="button"
            onClick={() => {
              onLogout?.();
              setOpen(false);
            }}
            className="topbar-menu-button danger"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function AccountShellLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authState } = useAuthState();

  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const displayName = getDisplayName(authState);

  const inviteCount = useMemo(() => {
    return authState?.pending_invites_count || 0;
  }, [authState]);

  const activeSection = getCurrentSection(location.pathname);
  const headerTitle = getHeaderTitle(activeSection);

  const navItems = [
    {
      id: "home",
      label: "Overview",
      icon: Home,
      path: "/account/home",
      available: true,
    },
    {
      id: "invites",
      label: "Invitations",
      icon: Mail,
      path: "/account/invites",
      available: true,
      badge: inviteCount > 0 ? String(inviteCount) : null,
    },
    {
      id: "create-business",
      label: "Create Business",
      icon: Building2,
      path: "/account/create-business",
      available: true,
    },
    {
      id: "profile",
      label: "Profile",
      icon: UserCircle2,
      path: "/account/profile",
      available: true,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      path: "/account/settings",
      available: true,
    },
    {
      id: "security",
      label: "Security",
      icon: ShieldCheck,
      path: "/account/settings/security",
      available: true,
    },
    {
      id: "recovery",
      label: "Recovery",
      icon: LockKeyhole,
      path: "/account/settings/security/recovery",
      available: true,
    },
  ];

  const handleNavigation = (item) => {
    if (!item.available) return;
    navigate(item.path);
    setIsMobileSidebarOpen(false);
  };

  const handleProfile = () => {
    navigate("/account/profile");
    setIsMobileSidebarOpen(false);
  };

  const handleSettings = () => {
    navigate("/account/settings");
    setIsMobileSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="account-shell-layout">
      <SideBar
        navItems={navItems}
        activeSection={activeSection}
        onNavigate={handleNavigation}
        displayName={displayName}
        onProfile={handleProfile}
        onSettings={handleSettings}
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

              <p className="account-shell-header-title">{headerTitle}</p>
            </div>

            <div className="account-shell-header-right">
              <TopBarUserMenu
                authState={authState}
                displayName={displayName}
                onProfile={handleProfile}
                onSettings={handleSettings}
                onLogout={handleLogout}
                onNavigate={(path) => navigate(path)}
              />
            </div>
          </div>
        </header>

        <MainContent>
          <Outlet />
        </MainContent>

        <footer className="account-shell-footer">
          © 2026 TEED Hub. All rights reserved.
        </footer>
      </div>
    </div>
  );
}