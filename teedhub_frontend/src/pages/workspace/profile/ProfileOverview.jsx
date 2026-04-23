import { useMemo } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  Palette,
  Globe,
  FileText,
  RefreshCw,
  ShieldCheck,
  BadgeCheck,
  CheckCircle2,
  Settings,
  ChevronRight,
  UserCircle2,
  Clock3,
} from "lucide-react";

import Card, { CardHeader, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/button";
import TooltipPortal from "@/components/ui/tooltip/TooltipPortal";

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
  onClick,
  index = 0,
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="overview-nav-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.05 }}
      whileHover={{
        y: -3,
        scale: 1.01,
        transition: { duration: 0.18 },
      }}
      whileTap={{ scale: 0.995 }}
    >
      <div className="overview-nav-card-main">
        <div className="overview-nav-card-top">
          <div className="overview-nav-card-icon">
            <Icon size={18} strokeWidth={2} />
          </div>

          <div className="overview-nav-card-arrow">
            <ChevronRight size={16} strokeWidth={2} />
          </div>
        </div>

        <div className="overview-nav-card-body">
          <h3 className="overview-nav-card-title">{title}</h3>
          <p className="overview-nav-card-text">{description}</p>
        </div>
      </div>

      {meta ? <div className="overview-nav-card-meta">{meta}</div> : null}
    </motion.button>
  );
}

function SummaryRow({
  label,
  value,
  verified = null,
  mono = false,
  capitalize = false,
}) {
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
        <span
          className={[
            "overview-checklist-label truncate max-w-[180px] sm:max-w-[220px] text-right",
            mono ? "font-mono text-[13px]" : "",
            capitalize ? "capitalize" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          title={value || "—"}
        >
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

export default function ProfileOverview() {
  const navigate = useNavigate();
  const { businessId } = useParams();
  const outletContext = useOutletContext() || {};

  const business = outletContext.business || null;
  const membership = outletContext.membership || null;
  const profile = outletContext.profile || null;

  const createdAtLabel = useMemo(() => {
    if (!business?.created_at) return "—";
    try {
      return new Date(business.created_at).toLocaleDateString();
    } catch {
      return business.created_at;
    }
  }, [business]);

  const joinedAtLabel = useMemo(() => {
    if (!membership?.joined_at) return "—";
    try {
      return new Date(membership.joined_at).toLocaleDateString();
    } catch {
      return membership.joined_at;
    }
  }, [membership]);

  const completionScore = useMemo(() => {
    if (!profile) return 0;

    const fields = [
      profile.logo,
      profile.primary_color,
      profile.secondary_color,
      profile.theme,
      profile.about,
      profile.contact_email,
      profile.contact_phone,
      profile.website,
      profile.instagram,
      profile.facebook,
      profile.tiktok,
      profile.whatsapp,
    ];

    const done = fields.filter(Boolean).length;
    return Math.round((done / fields.length) * 100);
  }, [profile]);

  const statusLabel = business?.is_active ? "Active" : "Inactive";
  const roleLabel = membership?.role || "member";
  const businessTypeLabel = business?.business_type || "Not set";
  const businessSlug = business?.slug || "not-available";

  const displayLogo = profile?.logo || null;

  const profileChecklist = useMemo(
    () => [
      {
        label: "Business linked",
        done: Boolean(business?.id),
      },
      {
        label: "Workspace role assigned",
        done: Boolean(membership?.role),
      },
      {
        label: "Primary color set",
        done: Boolean(profile?.primary_color),
      },
      {
        label: "Contact channel added",
        done: Boolean(
          profile?.contact_email ||
            profile?.contact_phone ||
            profile?.website ||
            profile?.instagram ||
            profile?.facebook ||
            profile?.tiktok ||
            profile?.whatsapp
        ),
      },
    ],
    [business, membership, profile]
  );

  const readyItemsCount = profileChecklist.filter((item) => item.done).length;

  const profileStatus = useMemo(() => {
    if (completionScore >= 80 && business?.is_active) return "Active";
    if (completionScore >= 30) return "In progress";
    return "Pending";
  }, [completionScore, business]);

  const publicLinksStatus = useMemo(() => {
    return profile?.website ||
      profile?.instagram ||
      profile?.facebook ||
      profile?.tiktok
      ? "Available"
      : "Missing";
  }, [profile]);

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
      icon: ShieldCheck,
      tone: membership?.role ? "blue" : "gold",
    },
    {
      id: "profile-completion",
      title: "Profile completion",
      value: `${completionScore}%`,
      icon: BadgeCheck,
      tone: completionScore >= 60 ? "blue" : "gold",
    },
    {
      id: "status",
      title: "Status",
      value: profileStatus || statusLabel,
      icon: Clock3,
      tone: business?.is_active ? "blue" : "gold",
    },
  ];

  const quickActions = [
    {
      id: "details",
      icon: FileText,
      title: "Open Details",
      description: "View the full business and profile record.",
      meta: "Readable view",
      onClick: () => navigate(`/business/${businessId}/profile/details`),
    },
    {
      id: "edit",
      icon: Settings,
      title: "Edit Profile",
      description: "Update business profile and contact presentation data.",
      meta: membership?.role || "Manage profile",
      onClick: () => navigate(`/business/${businessId}/profile/edit`),
    },
    {
      id: "refresh",
      icon: RefreshCw,
      title: "Refresh Data",
      description: "Reload only if context somehow falls behind.",
      meta: "Fallback",
      onClick: () => window.location.reload(),
    },
    {
      id: "account-home",
      icon: UserCircle2,
      title: "Account Home",
      description: "Return to your account home overview.",
      meta: "Live",
      onClick: () => navigate("/account/home"),
    },
  ];

  if (!business || !membership) {
    return (
      <div className="account-overview-page">
        <Card
          variant="default"
          padding="md"
          contentSpacing="md"
          className="card-rect"
        >
          <CardHeader
            title="Unable to load profile overview"
            subtitle="Business context is missing."
          />

          <CardContent>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => navigate("/account/home")}
            >
              Back to account home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                {displayLogo ? (
                  <img
                    src={displayLogo}
                    alt={business?.name || "Business logo"}
                    className="profile-header-avatar-image"
                  />
                ) : (
                  <div className="profile-header-avatar-fallback">
                    <Building2 size={34} />
                  </div>
                )}
              </div>

              <div className="profile-header-copy min-w-0">
                <p className="profile-header-username truncate">@{businessSlug}</p>
                <p className="profile-header-email truncate">
                  {business?.name || "Profile overview"}
                </p>
              </div>
            </div>
          </div>

          <div className="overview-hero-action">
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <TooltipPortal content="Reload profile overview">
                <div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    emphasis="medium"
                    onClick={() => window.location.reload()}
                  >
                    <span className="inline-flex items-center gap-2">
                      <RefreshCw size={16} />
                      Refresh
                    </span>
                  </Button>
                </div>
              </TooltipPortal>

              <Button
                type="button"
                variant="primary"
                size="md"
                emphasis="medium"
                onClick={() => navigate(`/business/${businessId}/profile/edit`)}
              >
                <span className="inline-flex items-center gap-2">
                  <Settings size={16} />
                  Edit Profile
                </span>
              </Button>
            </div>
          </div>
        </div>

        <div
          className="overview-status-strip"
          aria-label="Profile quick status"
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
            title="Quick actions"
            className="overview-section-header"
          />
          <CardContent className="overview-nav-grid">
            {quickActions.map((item, index) => (
              <NavigationCard
                key={item.id}
                index={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                meta={item.meta}
                onClick={item.onClick}
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
            title="Business details"
            className="overview-section-header"
          />
          <CardContent className="overview-checklist">
            <SummaryRow label="Business name" value={business?.name} />
            <SummaryRow label="Slug" value={businessSlug} mono />
            <SummaryRow label="Business type" value={businessTypeLabel} />
            <SummaryRow label="Status" value={statusLabel} />
            <SummaryRow label="Created at" value={createdAtLabel} />
            <SummaryRow
              label="Your workspace role"
              value={roleLabel}
              capitalize
            />
            <SummaryRow label="Joined at" value={joinedAtLabel} />
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
            title="Profile identity"
            className="overview-section-header"
          />
          <CardContent className="overview-checklist">
            <SummaryRow
              label="Logo"
              value={profile?.logo ? "Uploaded" : "Not uploaded"}
            />
            <SummaryRow
              label="Primary color"
              value={profile?.primary_color || "—"}
              mono
            />
            <SummaryRow
              label="Secondary color"
              value={profile?.secondary_color || "—"}
              mono
            />
            <SummaryRow label="Theme" value={profile?.theme || "—"} />
            <SummaryRow
              label="About"
              value={profile?.about || "No description added yet."}
            />
          </CardContent>
        </Card>

        <Card
          variant="default"
          padding="sm"
          contentSpacing="sm"
          className="card-rect"
        >
          <CardHeader
            title="Contact and social"
            className="overview-section-header"
          />
          <CardContent className="overview-checklist">
            <SummaryRow label="Contact email" value={profile?.contact_email} />
            <SummaryRow label="Contact phone" value={profile?.contact_phone} />
            <SummaryRow label="Website" value={profile?.website} />
            <SummaryRow label="Instagram" value={profile?.instagram} />
            <SummaryRow label="Facebook" value={profile?.facebook} />
            <SummaryRow label="TikTok" value={profile?.tiktok} />
            <SummaryRow label="WhatsApp" value={profile?.whatsapp} />
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
            title="Profile status"
            className="overview-section-header"
          />
          <CardContent className="overview-checklist">
            {profileChecklist.map((item) => (
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
            title="Profile assets"
            className="overview-section-header"
          />
          <CardContent className="overview-checklist">
            <SummaryRow
              label="Brand identity"
              value={profile?.primary_color ? "Configured" : "Pending"}
            />
            <SummaryRow
              label="Media presence"
              value={profile?.logo ? "Logo uploaded" : "No logo yet"}
            />
            <SummaryRow
              label="Public links"
              value={publicLinksStatus}
            />
            <SummaryRow
              label="Readiness"
              value={`${readyItemsCount}/${profileChecklist.length} ready`}
              verified={readyItemsCount === profileChecklist.length}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}