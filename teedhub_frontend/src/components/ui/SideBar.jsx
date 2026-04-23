import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  LogOut,
  Settings,
  User,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useTheme } from "@/components/ui/theme/ThemeProvider";
import "@/styles/ui/sidebar.css";

function getInitials(name = "") {
  const cleaned = String(name).trim();
  if (!cleaned) return "U";

  const parts = cleaned.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return cleaned.slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function isEnabled(item) {
  if (typeof item?.enabled === "boolean") return item.enabled;
  if (typeof item?.available === "boolean") return item.available;
  return true;
}

function hasChildren(item) {
  return Array.isArray(item?.children) && item.children.length > 0;
}

function NavItem({
  item,
  isActive,
  activeSubSection = "",
  onClick,
  collapsed = false,
  expanded = false,
  onToggleExpand,
}) {
  const Icon = item.icon;
  const disabled = !isEnabled(item);
  const children = hasChildren(item) ? item.children : [];
  const childCount = children.length;

  return (
    <div className={`sidebar-group ${expanded ? "expanded" : ""}`}>
      <div
        className={`sidebar-nav-item-row ${collapsed ? "collapsed" : ""} ${
          isActive ? "active" : ""
        } ${disabled ? "disabled" : ""}`}
      >
        <button
          type="button"
          onClick={() => {
            if (!disabled) onClick?.(item);
          }}
          disabled={disabled}
          title={collapsed ? item.label : undefined}
          className={`sidebar-nav-item ${isActive ? "active" : ""} ${
            disabled ? "disabled" : ""
          } ${collapsed ? "collapsed" : ""} ${
            childCount > 0 ? "has-children" : ""
          }`}
        >
          <div className="sidebar-nav-icon">
            {Icon ? <Icon size={18} strokeWidth={2.1} /> : null}
          </div>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.16 }}
                className="sidebar-nav-content"
              >
                <span className="sidebar-nav-label">{item.label}</span>

                <div className="sidebar-nav-right">
                  {item.badge ? (
                    <span className="sidebar-badge">{item.badge}</span>
                  ) : null}

                  {!childCount && disabled ? (
                    <span className="sidebar-soon-badge">Soon</span>
                  ) : null}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {!collapsed && childCount > 0 ? (
          <button
            type="button"
            onClick={() => onToggleExpand?.(item.id)}
            className="sidebar-expand-btn"
            aria-label={expanded ? "Collapse section" : "Expand section"}
          >
            <ChevronDown
              size={15}
              className={`sidebar-expand-icon ${expanded ? "open" : ""}`}
            />
          </button>
        ) : null}
      </div>

      {!collapsed && childCount > 0 ? (
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="sidebar-subnav-wrap"
            >
              <div className="sidebar-subnav">
                {children.map((child) => {
                  const childDisabled = !isEnabled(child);
                  const childActive = activeSubSection === child.id;

                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => {
                        if (!childDisabled) onClick?.(child);
                      }}
                      disabled={childDisabled}
                      className={`sidebar-subnav-item ${
                        childActive ? "active" : ""
                      } ${childDisabled ? "disabled" : ""}`}
                    >
                      <span className="sidebar-subnav-dot" />
                      <span className="sidebar-subnav-label">{child.label}</span>

                      {childDisabled ? (
                        <span className="sidebar-soon-badge">Soon</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      ) : null}
    </div>
  );
}

function UserCard({
  displayName,
  initials,
  collapsed = false,
  onProfile,
  onSettings,
  onLogout,
}) {
  const [open, setOpen] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (cardRef.current && !cardRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="sidebar-user-wrapper" ref={cardRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`sidebar-user-card ${collapsed ? "collapsed" : ""}`}
      >
        <div className="sidebar-user-avatar">{initials}</div>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.16 }}
              className="sidebar-user-text"
            >
              <p className="sidebar-user-name">{displayName}</p>
              <p className="sidebar-user-role">Account</p>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="sidebar-user-menu"
          >
            <div className="sidebar-user-menu-head">
              <p className="sidebar-user-menu-label">Signed in as</p>
              <p className="sidebar-user-menu-name">{displayName}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                onProfile?.();
                setOpen(false);
              }}
              className="sidebar-menu-button"
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
              className="sidebar-menu-button"
            >
              <Settings size={16} />
              <span>Settings</span>
            </button>

            <div className="sidebar-user-menu-divider" />

            <button
              type="button"
              onClick={() => {
                onLogout?.();
                setOpen(false);
              }}
              className="sidebar-menu-button logout"
              data-testid="logout-button"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SideBarInner({
  navItems,
  activeSection,
  activeSubSection,
  onNavigate,
  displayName,
  onProfile,
  onSettings,
  onLogout,
  collapsed = false,
  isMobile = false,
  onToggleDesktopSidebar,
  onCloseMobileSidebar,
  darkMode = false,
}) {
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const [expandedIds, setExpandedIds] = useState(() => {
    const initial = {};
    navItems.forEach((item) => {
      if (item.id === activeSection && hasChildren(item)) {
        initial[item.id] = true;
      }
    });
    return initial;
  });

  useEffect(() => {
    if (!activeSection) return;

    setExpandedIds((prev) => ({
      ...prev,
      [activeSection]: true,
    }));
  }, [activeSection]);

  const handleToggleExpand = (id) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className={`sidebar-inner sidebar-theme ${darkMode ? "dark" : ""}`}>
      <div className="sidebar-top">
        <div
          className={`sidebar-top-row ${
            collapsed && !isMobile ? "collapsed" : ""
          }`}
        >
          <AnimatePresence initial={false}>
            {(!collapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.16 }}
                className="sidebar-logo"
              >
                <span style={{ color: "#1F75FE" }}>Teed</span>
                <span style={{ color: "#f2a705" }}>Hub</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={isMobile ? onCloseMobileSidebar : onToggleDesktopSidebar}
            className="sidebar-toggle-btn"
            aria-label={isMobile ? "Close sidebar" : "Toggle sidebar"}
          >
            {isMobile ? (
              <X size={18} />
            ) : collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-nav-list">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={activeSection === item.id}
              activeSubSection={activeSubSection}
              onClick={(selectedItem) => {
                onNavigate?.(selectedItem);
                if (isMobile) onCloseMobileSidebar?.();
              }}
              collapsed={collapsed && !isMobile}
              expanded={Boolean(expandedIds[item.id])}
              onToggleExpand={handleToggleExpand}
            />
          ))}
        </div>
      </nav>

      <div className="sidebar-bottom">
        <UserCard
          displayName={displayName}
          initials={initials}
          collapsed={collapsed && !isMobile}
          onProfile={onProfile}
          onSettings={onSettings}
          onLogout={onLogout}
        />
      </div>
    </div>
  );
}

export default function SideBar({
  navItems = [],
  activeSection = "",
  activeSubSection = "",
  onNavigate,
  displayName = "User",
  onProfile,
  onSettings,
  onLogout,
  isDesktopCollapsed = false,
  onToggleDesktopSidebar,
  isMobileOpen = false,
  onCloseMobileSidebar,
}) {
  const { darkMode } = useTheme();

  return (
    <>
      <aside
        className={`sidebar-desktop ${isDesktopCollapsed ? "collapsed" : ""} ${
          darkMode ? "dark" : ""
        }`}
      >
        <SideBarInner
          navItems={navItems}
          activeSection={activeSection}
          activeSubSection={activeSubSection}
          onNavigate={onNavigate}
          displayName={displayName}
          onProfile={onProfile}
          onSettings={onSettings}
          onLogout={onLogout}
          collapsed={isDesktopCollapsed}
          isMobile={false}
          onToggleDesktopSidebar={onToggleDesktopSidebar}
          darkMode={darkMode}
        />
      </aside>

      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              className="sidebar-mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobileSidebar}
            />

            <motion.aside
              className={`sidebar-mobile ${darkMode ? "dark" : ""}`}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <SideBarInner
                navItems={navItems}
                activeSection={activeSection}
                activeSubSection={activeSubSection}
                onNavigate={onNavigate}
                displayName={displayName}
                onProfile={onProfile}
                onSettings={onSettings}
                onLogout={onLogout}
                collapsed={false}
                isMobile
                onCloseMobileSidebar={onCloseMobileSidebar}
                darkMode={darkMode}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}