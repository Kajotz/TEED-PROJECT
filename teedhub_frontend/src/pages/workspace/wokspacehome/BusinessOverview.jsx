import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ShoppingCart,
  TrendingUp,
  Users,
  ArrowRight,
  BarChart3,
  CreditCard,
} from "lucide-react";

import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import TooltipPortal from "@/components/ui/tooltip/TooltipPortal";
import { useAppToast } from "@/components/ui/toast/AppToastProvider";

import "@/styles/global/GlobalUi.css";

function OverviewStatusPill({ title, value, icon: Icon, tone = "blue" }) {
  return (
    <div className={`overview-status-pill overview-status-pill-${tone}`}>
      <div className="overview-status-pill-icon">
        <Icon size={14} strokeWidth={2.1} />
      </div>

      <div className="overview-status-pill-body">
        <span className="overview-status-pill-label">{title}</span>
        <span className="overview-status-pill-value">{value}</span>
      </div>
    </div>
  );
}

function NavigationCard({
  icon: Icon,
  title,
  description,
  meta,
  footerLabel = "View",
  accent = "blue",
  onClick,
  disabled = false,
  index = 0,
}) {
  const orangeAccent =
    accent === "orange"
      ? {
          background: "rgba(226, 149, 4, 0.14)",
          color: "#e29504",
        }
      : undefined;

  const accentTextColor =
    accent === "orange" ? { color: "#e29504" } : { color: "#1F75FE" };

  return (
    <motion.button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`overview-nav-card ${disabled ? "is-disabled" : ""}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.05 }}
      whileHover={
        disabled
          ? undefined
          : {
              y: -3,
              scale: 1.01,
              transition: { duration: 0.18 },
            }
      }
      whileTap={disabled ? undefined : { scale: 0.995 }}
    >
      <div className="overview-nav-card-main">
        <div className="overview-nav-card-top">
          <div className="overview-nav-card-icon" style={orangeAccent}>
            <Icon size={18} strokeWidth={2} />
          </div>

          <div className="overview-nav-card-arrow" style={accentTextColor}>
            {!disabled ? <ChevronRight size={16} strokeWidth={2} /> : null}
          </div>
        </div>

        <div className="overview-nav-card-body">
          <h3 className="overview-nav-card-title">{title}</h3>
          <p className="overview-nav-card-text">{description}</p>
        </div>
      </div>

      <div className="overview-nav-card-meta">
        <div className="flex items-center justify-between gap-3">
          <span>{meta}</span>

          {!disabled ? (
            <span
              className="inline-flex items-center gap-1 text-[13px] font-semibold"
              style={accentTextColor}
            >
              {footerLabel}
              <ArrowRight size={14} />
            </span>
          ) : null}
        </div>
      </div>
    </motion.button>
  );
}

function SummaryRow({ label, value, verified = null }) {
  return (
    <div className="overview-checklist-row">
      <div className="overview-checklist-left">
        <div
          className={`overview-checklist-mark ${
            verified === true ? "done" : ""
          }`}
        >
          {verified === true ? (
            <CheckCircle2 size={14} strokeWidth={2.4} />
          ) : (
            <Building2 size={14} strokeWidth={2.2} />
          )}
        </div>

        <span className="overview-checklist-label">{label}</span>
      </div>

      <div className="flex items-center gap-2 min-w-0">
        <span className="overview-checklist-label truncate max-w-[180px] sm:max-w-[220px] text-right">
          {value || "—"}
        </span>

        {verified !== null ? (
          <span
            className={`overview-checklist-badge ${
              verified ? "is-done" : "is-pending"
            }`}
          >
            {verified ? "Ready" : "Pending"}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function MetricRow({ label, value, icon: Icon, tone = "blue" }) {
  return (
    <div className="overview-checklist-row">
      <div className="overview-checklist-left">
        <div
          className={`overview-checklist-mark ${
            tone === "blue" ? "done" : ""
          }`}
        >
          <Icon size={14} strokeWidth={2.2} />
        </div>

        <span className="overview-checklist-label">{label}</span>
      </div>

      <div className="flex items-center gap-2 min-w-0">
        <span className="overview-checklist-label truncate max-w-[180px] sm:max-w-[220px] text-right">
          {value || "—"}
        </span>
      </div>
    </div>
  );
}

export default function BusinessOverview() {
  const navigate = useNavigate();
  const toast = useAppToast();
  const { business, membership } = useOutletContext();

  const normalizedRole = useMemo(() => {
    return String(membership?.role || "member").toLowerCase();
  }, [membership]);

  const roleLabel = membership?.role || "member";
  const businessTypeLabel = business?.business_type || "Not set";

  const businessChecklist = [
    {
      label: "Business created",
      done: Boolean(business?.id),
    },
    {
      label: "Workspace access",
      done: Boolean(membership?.role),
    },
    {
      label: "Business type set",
      done: Boolean(business?.business_type),
    },
    {
      label: "Profile route ready",
      done: Boolean(business?.id),
    },
  ];

  const readyItemsCount = businessChecklist.filter((item) => item.done).length;

  const workspaceStatus = useMemo(() => {
    if (readyItemsCount === 4) return "Active";
    if (readyItemsCount >= 2) return "In progress";
    return "Pending";
  }, [readyItemsCount]);

  const profileCompletion = useMemo(() => {
    return `${Math.round((readyItemsCount / businessChecklist.length) * 100)}%`;
  }, [readyItemsCount, businessChecklist.length]);

  const statusCards = [
    {
      id: "business-type",
      title: "Business type",
      value: businessTypeLabel,
      icon: Building2,
      tone: business?.business_type ? "blue" : "gold",
    },
    {
      id: "workspace-role",
      title: "Workspace role",
      value: roleLabel,
      icon: Users,
      tone:
        normalizedRole === "owner" || normalizedRole === "admin"
          ? "blue"
          : "gold",
    },
    {
      id: "profile-completion",
      title: "Profile completion",
      value: profileCompletion,
      icon: BadgeCheck,
      tone: readyItemsCount >= 3 ? "blue" : "gold",
    },
    {
      id: "status",
      title: "Status",
      value: workspaceStatus,
      icon: Clock3,
      tone: workspaceStatus === "Active" ? "blue" : "gold",
    },
  ];

  const quickActions = [
    {
      id: "sale",
      icon: ShoppingCart,
      title: "Create Sale",
      description: "Start recording sales activity.",
      meta: "Coming soon",
      footerLabel: "View",
      accent: "blue",
      onClick: () => toast.warning("Sales feature coming soon."),
    },
    {
      id: "analytics",
      icon: TrendingUp,
      title: "View Analytics",
      description: "Open business performance analytics.",
      meta: "Coming soon",
      footerLabel: "View",
      accent: "orange",
      onClick: () => toast.warning("Analytics feature coming soon."),
    },
    {
      id: "profile",
      icon: Building2,
      title: "Profile",
      description: "Open business profile details and presentation data.",
      meta: "Ready",
      footerLabel: "View",
      accent: "blue",
      onClick: () => navigate(`/business/${business?.id}/profile`),
    },
    {
      id: "members",
      icon: Users,
      title: "Members",
      description: "Manage workspace members, roles, invites, and access.",
      meta: "Ready",
      footerLabel: "View",
      accent: "orange",
      onClick: () => navigate(`/business/${business?.id}/members`),
    },
  ];

  return (
    <div className="account-overview-page">
      <Card
        variant="default"
        padding="md"
        contentSpacing="md"
        className="card-rect overview-hero-card"
      >
        <div className="overview-hero-row">
          <div className="overview-hero-header min-w-0">
            <div className="profile-header-minimal">
              <div className="profile-header-avatar-wrap">
                <div className="profile-header-avatar-fallback">
                  <Building2 size={34} />
                </div>
              </div>

              <div className="profile-header-copy min-w-0">
                <p className="profile-header-email truncate">
                  This is a full business overview
                </p>
              </div>
            </div>
          </div>

          <div className="overview-hero-action">
            <div className="members-hero-actions">
              <TooltipPortal content="Open business profile">
                <span className="members-hero-actions__item">
                  <button
                    type="button"
                    className="btn btn-primary members-hero-actions__button"
                    onClick={() => navigate(`/business/${business?.id}/profile`)}
                  >
                    <Building2 size={16} />
                    Profile
                  </button>
                </span>
              </TooltipPortal>

              <TooltipPortal content="Open workspace members">
                <span className="members-hero-actions__item">
                  <button
                    type="button"
                    className="btn btn-secondary members-hero-actions__button"
                    onClick={() => navigate(`/business/${business?.id}/members`)}
                  >
                    <Users size={16} />
                    Members
                  </button>
                </span>
              </TooltipPortal>
            </div>
          </div>
        </div>

        <div
          className="overview-status-strip"
          aria-label="Business quick status"
        >
          {statusCards.map((item) => (
            <OverviewStatusPill
              key={item.id}
              icon={item.icon}
              title={item.title}
              value={item.value}
              tone={item.tone}
            />
          ))}
        </div>
      </Card>

      <div className="overview-main-grid">
        <Card
          variant="default"
          padding="sm"
          contentSpacing="sm"
          className="card-rect"
        >
          <CardHeader
            title="Workspace actions"
            className="overview-section-header"
          />
          <CardContent className="overview-nav-grid">
            {quickActions.map((action, index) => (
              <NavigationCard
                key={action.id}
                index={index}
                icon={action.icon}
                title={action.title}
                description={action.description}
                meta={action.meta}
                footerLabel={action.footerLabel}
                accent={action.accent}
                onClick={action.onClick}
              />
            ))}
          </CardContent>
        </Card>

        <Card
          variant="default"
          padding="sm"
          contentSpacing="sm"
          className="card-rect"
        >
          <CardHeader
            title="Business summary"
            className="overview-section-header"
          />
          <CardContent className="overview-checklist">
            <SummaryRow label="Business type" value={businessTypeLabel} />
            <SummaryRow label="Workspace role" value={roleLabel} />
            <SummaryRow
              label="Profile area"
              value="Ready"
              verified={Boolean(business?.id)}
            />
            <SummaryRow
              label="Members area"
              value="Ready"
              verified={Boolean(business?.id)}
            />
            <SummaryRow
              label="Workspace readiness"
              value={workspaceStatus}
              verified={readyItemsCount === businessChecklist.length}
            />
          </CardContent>
        </Card>
      </div>

      <div className="overview-main-grid">
        <Card
          variant="default"
          padding="sm"
          contentSpacing="sm"
          className="card-rect"
        >
          <CardHeader
            title="Business setup"
            className="overview-section-header"
          />
          <CardContent className="overview-checklist">
            {businessChecklist.map((item) => (
              <SummaryRow
                key={item.label}
                label={item.label}
                value={item.done ? "Ready" : "Pending"}
                verified={item.done}
              />
            ))}
          </CardContent>
        </Card>

        <Card
          variant="default"
          padding="sm"
          contentSpacing="sm"
          className="card-rect"
        >
          <CardHeader
            title="Business metrics"
            className="overview-section-header"
          />
          <CardContent className="overview-checklist">
            <MetricRow
              label="Sales"
              value="0"
              icon={ShoppingCart}
              tone="blue"
            />
            <MetricRow
              label="Revenue"
              value="$0"
              icon={CreditCard}
              tone="orange"
            />
            <MetricRow
              label="Members"
              value="1"
              icon={Users}
              tone="blue"
            />
            <MetricRow
              label="Activity"
              value="New"
              icon={BarChart3}
              tone="orange"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}