import { useMemo } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  BadgeCheck,
  ShieldCheck,
  FileText,
  Settings,
  CheckCircle2,
  ChevronRight,
  UserCircle2,
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
            "overview-checklist-label truncate max-w-[180px] sm:max-w-[260px] text-right",
            mono ? "font-mono text-[12px] sm:text-[12.5px]" : "",
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

export default function ProfileDetails() {
  const navigate = useNavigate();
  const { businessId } = useParams();
  const outletContext = useOutletContext() || {};

  const business = outletContext.business || null;
  const membership = outletContext.membership || null;
  const profile = outletContext.profile || null;

  const createdAtLabel = useMemo(() => {
    if (!business?.created_at) return "—";
    try {
      return new Date(business.created_at).toLocaleString();
    } catch {
      return business.created_at;
    }
  }, [business]);

  const updatedAtLabel = useMemo(() => {
    if (!business?.updated_at) return "—";
    try {
      return new Date(business.updated_at).toLocaleString();
    } catch {
      return business.updated_at;
    }
  }, [business]);

  const joinedAtLabel = useMemo(() => {
    if (!membership?.joined_at) return "—";
    try {
      return new Date(membership.joined_at).toLocaleString();
    } catch {
      return membership.joined_at;
    }
  }, [membership]);

  const businessTypeLabel = business?.business_type || "Not set";
  const businessStatusLabel = business?.is_active ? "Active" : "Inactive";
  const membershipRoleLabel = membership?.role || "member";
  const membershipStatusLabel = membership?.is_active ? "Active" : "Inactive";
  const businessSlug = business?.slug || "not-available";
  const displayLogo = profile?.logo || null;

  const detailsChecklist = useMemo(
    () => [
      {
        label: "Business record",
        done: Boolean(business?.id && business?.name && business?.slug),
      },
      {
        label: "Membership record",
        done: Boolean(membership?.id && membership?.role),
      },
      {
        label: "Branding record",
        done: Boolean(
          profile?.primary_color || profile?.secondary_color || profile?.theme
        ),
      },
      {
        label: "Contact record",
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

  const readyItemsCount = detailsChecklist.filter((item) => item.done).length;

  const detailsCompletion = useMemo(() => {
    const fields = [
      business?.name,
      business?.slug,
      business?.business_type,
      membership?.role,
      membership?.id,
      profile?.primary_color,
      profile?.secondary_color,
      profile?.theme,
      profile?.contact_email,
      profile?.contact_phone,
      profile?.website,
      profile?.instagram,
      profile?.facebook,
      profile?.tiktok,
      profile?.whatsapp,
    ];

    const done = fields.filter(Boolean).length;
    return Math.round((done / fields.length) * 100);
  }, [business, membership, profile]);

  const detailsStatus = useMemo(() => {
    if (detailsCompletion >= 80) return "Complete";
    if (detailsCompletion >= 30) return "In progress";
    return "Pending";
  }, [detailsCompletion]);

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
      value: membershipRoleLabel,
      icon: ShieldCheck,
      tone: membership?.role ? "blue" : "gold",
    },
    {
      id: "business-status",
      title: "Business status",
      value: businessStatusLabel,
      icon: BadgeCheck,
      tone: business?.is_active ? "blue" : "gold",
    },
    {
      id: "record-coverage",
      title: "Record coverage",
      value: `${detailsCompletion}%`,
      icon: FileText,
      tone: detailsCompletion >= 60 ? "blue" : "gold",
    },
  ];

  const quickActions = [
    {
      id: "back-overview",
      icon: ArrowLeft,
      title: "Back to Overview",
      description: "Return to the profile summary page.",
      meta: "Overview",
      onClick: () => navigate(`/business/${businessId}/profile`),
    },
    {
      id: "edit-profile",
      icon: Settings,
      title: "Edit Profile",
      description: "Update business and presentation data.",
      meta: membership?.role || "Manage data",
      onClick: () => navigate(`/business/${businessId}/profile/edit`),
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
            title="Unable to load profile details"
            subtitle="Business context is missing."
          />

          <CardContent>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => navigate(`/business/${businessId}/profile`)}
            >
              Back to profile overview
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
                  {business?.name || "Profile details"}
                </p>
              </div>
            </div>
          </div>

          <div className="overview-hero-action">
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <TooltipPortal content="Return to profile overview">
                <div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    emphasis="medium"
                    onClick={() => navigate(`/business/${businessId}/profile`)}
                  >
                    <span className="inline-flex items-center gap-2">
                      <ArrowLeft size={16} />
                      Back to Overview
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
          aria-label="Profile details quick status"
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
            title="Business core record"
            className="overview-section-header"
          />

          <CardContent className="overview-checklist">
            <SummaryRow label="Business name" value={business?.name} />
            <SummaryRow label="Slug" value={business?.slug} mono />
            <SummaryRow label="Business type" value={businessTypeLabel} />
            <SummaryRow label="Active status" value={businessStatusLabel} />
            <SummaryRow label="Created at" value={createdAtLabel} />
            <SummaryRow label="Updated at" value={updatedAtLabel} />
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
            title="Membership record"
            className="overview-section-header"
          />

          <CardContent className="overview-checklist">
            <SummaryRow
              label="Your role"
              value={membershipRoleLabel}
              capitalize
            />
            <SummaryRow
              label="Membership status"
              value={membershipStatusLabel}
            />
            <SummaryRow label="Joined at" value={joinedAtLabel} />
            <SummaryRow label="Membership ID" value={membership?.id} mono />
          </CardContent>
        </Card>

        <Card
          variant="default"
          padding="sm"
          contentSpacing="sm"
          className="card-rect"
        >
          <CardHeader
            title="Profile branding"
            className="overview-section-header"
          />

          <CardContent className="overview-checklist">
            <SummaryRow
              label="Logo"
              value={profile?.logo ? "Uploaded" : "No logo uploaded"}
            />
            <SummaryRow
              label="Primary color"
              value={profile?.primary_color}
              mono
            />
            <SummaryRow
              label="Secondary color"
              value={profile?.secondary_color}
              mono
            />
            <SummaryRow label="Theme" value={profile?.theme} />
            <SummaryRow label="About" value={profile?.about} />
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
            title="Profile contact and social"
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

        <Card
          variant="default"
          padding="sm"
          contentSpacing="sm"
          className="card-rect"
        >
          <CardHeader
            title="Record notes"
            className="overview-section-header"
          />

          <CardContent className="overview-checklist">
            <SummaryRow label="Page purpose" value="Readable inspection" />
            <SummaryRow label="Editing flow" value="Handled in edit page" />
            <SummaryRow
              label="Overview flow"
              value="Summary remains separate"
            />
            <SummaryRow
              label="Readiness"
              value={detailsStatus}
              verified={readyItemsCount === detailsChecklist.length}
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
            title="Record coverage"
            className="overview-section-header"
          />

          <CardContent className="overview-checklist">
            {detailsChecklist.map((item) => (
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
            title="Identifiers"
            className="overview-section-header"
          />

          <CardContent className="overview-checklist">
            <SummaryRow label="Business slug" value={businessSlug} mono />
            <SummaryRow label="Membership ID" value={membership?.id} mono />
            <SummaryRow
              label="Profile theme"
              value={profile?.theme || "—"}
            />
            <SummaryRow
              label="Record coverage"
              value={`${detailsCompletion}%`}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}