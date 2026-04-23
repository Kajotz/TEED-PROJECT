import { useMemo, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  Clock3,
  Settings,
  ShieldCheck,
  UserCircle2,
  Users,
  CheckCircle2,
  ChevronRight,
  Globe,
  Phone,
  LoaderCircle,
  LockKeyhole,
  Repeat,
} from "lucide-react";

import { apiPost } from "@/utils/api";
import { useAuthState } from "@/context/AuthStateContext";
import Card, { CardHeader, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/button";

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
  disabled = false,
  index = 0,
}) {
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
          <div className="overview-nav-card-icon">
            <Icon size={18} strokeWidth={2} />
          </div>

          <div className="overview-nav-card-arrow">
            {!disabled ? <ChevronRight size={16} strokeWidth={2} /> : null}
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

export default function AccountHomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authState, authStateLoading } = useAuthState();

  const [invitePrompt, setInvitePrompt] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const businessId = params.get("invite_business_id");
    const token = params.get("invite_token");

    if (businessId && token) {
      setInvitePrompt({ businessId, token });
    } else {
      setInvitePrompt(null);
    }
  }, [location.search]);

  const handleAcceptInvite = async () => {
    if (!invitePrompt) return;

    if (!authState?.authenticated) {
      navigate(
        `/account/login?next=${encodeURIComponent(
          location.pathname + location.search
        )}`
      );
      return;
    }

    if (!authState?.identity_verified) {
      navigate("/account/settings/security");
      return;
    }

    try {
      const resp = await apiPost(
        `/api/businesses/${invitePrompt.businessId}/invites/${invitePrompt.token}/accept/`,
        {}
      );

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.detail || `Failed to accept invite (${resp.status})`);
      }

      const data = await resp.json();
      navigate(`/business/${data.business_id}`);
    } catch (err) {
      console.error("Accept invite failed:", err);
      alert(err?.message || "Failed to accept invite.");
    }
  };

  const inviteCount = useMemo(() => {
    return authState?.pending_invites_count || 0;
  }, [authState]);

  const accessibleBusinessIds = Array.isArray(authState?.accessible_business_ids)
    ? authState.accessible_business_ids
    : [];

  const activeBusinessId = authState?.active_business_id || null;
  const businessCount = accessibleBusinessIds.length;

  const hasBusinessAccess = Boolean(authState?.has_business_access);
  const hasPendingMembership = Boolean(authState?.has_pending_membership);

  const missingFields = Array.isArray(authState?.missing_fields)
    ? authState.missing_fields
    : [];

  const phoneDone = !missingFields.includes("phone_number");
  const countryDone = !missingFields.includes("country");
  const identityVerified = Boolean(authState?.identity_verified);
  const accountCompleted = Boolean(authState?.account_completed);

  const workspaceLabel = hasBusinessAccess
    ? businessCount > 1
      ? "Multi"
      : "Ready"
    : hasPendingMembership
    ? "Pending"
    : "Locked";

  const heroTitle = hasBusinessAccess
    ? businessCount > 1
      ? "Choose a workspace."
      : "Your workspace is ready."
    : "Your account is ready.";

  const heroSubtitle = hasBusinessAccess
    ? businessCount > 1
      ? "You belong to multiple businesses. Choose which workspace to operate in."
      : "Open your workspace and continue building."
    : "Complete setup and create a business to unlock your workspace.";

  const securityReadiness = useMemo(() => {
    let score = 0;
    if (identityVerified) score += 1;
    if (phoneDone) score += 1;

    if (score === 2) return "Strong";
    if (score === 1) return "Partial";
    return "Weak";
  }, [identityVerified, phoneDone]);

  const checklist = [
    {
      label: "Identity verified",
      done: identityVerified,
      icon: ShieldCheck,
      action: "/account/settings/security",
    },
    {
      label: "Phone number added",
      done: phoneDone,
      icon: Phone,
      action: "/account/settings/security",
    },
    {
      label: "Country added",
      done: countryDone,
      icon: Globe,
      action: "/account/profile",
    },
    {
      label: "Account completed",
      done: accountCompleted,
      icon: UserCircle2,
      action: "/account/profile",
    },
    {
      label: hasPendingMembership ? "Invitation pending" : "Business access",
      done: hasBusinessAccess || hasPendingMembership,
      icon: Building2,
      action: hasBusinessAccess ? "/account/switch-business" : "/account/create-business",
    },
  ];

  const handlePrimaryAction = () => {
    if (!hasBusinessAccess || businessCount === 0) {
      navigate("/account/create-business");
      return;
    }

    if (businessCount === 1) {
      const businessId = activeBusinessId || accessibleBusinessIds[0];
      navigate(`/business/${businessId}`);
      return;
    }

    navigate("/account/switch-business");
  };

  const primaryButtonLabel = !hasBusinessAccess
    ? "Create Business"
    : businessCount > 1
    ? "Switch Workspace"
    : "Open Workspace";

  const primaryButtonIcon = !hasBusinessAccess
    ? Building2
    : businessCount > 1
    ? Repeat
    : Building2;

  return (
    <div className="account-overview-page">
      <Card
        variant="default"
        padding="md"
        contentSpacing="md"
        className="card-rect overview-hero-card"
      >
        <div className="overview-hero-row">
          <CardHeader
            title={heroTitle}
            subtitle={heroSubtitle}
            className="overview-hero-header"
          />

          <div className="overview-hero-action">
            <Button
              type="button"
              variant="primary"
              size="md"
              emphasis="medium"
              onClick={handlePrimaryAction}
              leftIcon={
                authStateLoading ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  (() => {
                    const Icon = primaryButtonIcon;
                    return <Icon size={16} />;
                  })()
                )
              }
            >
              {primaryButtonLabel}
            </Button>
          </div>
        </div>

        <div className="overview-status-strip" aria-label="Account quick status">
          <OverviewStatusPill
            icon={ShieldCheck}
            title="Identity"
            value={identityVerified ? "Verified" : "Pending"}
            tone={identityVerified ? "blue" : "gold"}
          />

          <OverviewStatusPill
            icon={UserCircle2}
            title="Account"
            value={accountCompleted ? "Completed" : "Incomplete"}
            tone={accountCompleted ? "blue" : "gold"}
          />

          <OverviewStatusPill
            icon={Users}
            title="Invites"
            value={String(inviteCount)}
            tone={inviteCount > 0 ? "gold" : "blue"}
          />

          <OverviewStatusPill
            icon={Building2}
            title="Workspace"
            value={workspaceLabel}
            tone={hasBusinessAccess ? "blue" : "gold"}
          />
        </div>
      </Card>

      {invitePrompt ? (
        <Card className="card-rect mt-4">
          <CardHeader title="Invitation" />
          <CardContent>
            <p className="mb-3">You have an invitation to join a workspace.</p>
            <div className="flex gap-2">
              <Button onClick={handleAcceptInvite} variant="primary">
                Accept Invite
              </Button>
              <Button onClick={() => setInvitePrompt(null)} variant="secondary">
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="overview-main-grid">
        <Card
          variant="default"
          padding="sm"
          contentSpacing="sm"
          className="card-rect"
        >
          <CardHeader title="Next actions" className="overview-section-header" />
          <CardContent className="overview-nav-grid">
            <NavigationCard
              index={0}
              icon={!hasBusinessAccess ? Building2 : businessCount > 1 ? Repeat : Building2}
              title={primaryButtonLabel}
              description={
                !hasBusinessAccess
                  ? "Open business setup and unlock workspace access."
                  : businessCount > 1
                  ? "Choose which business workspace you want to operate in."
                  : "Enter your business workspace."
              }
              onClick={handlePrimaryAction}
              meta={businessCount > 1 ? `${businessCount} workspaces` : "Live"}
            />

            <NavigationCard
              index={1}
              icon={Clock3}
              title="Access Pending"
              description="Check invitations and membership access."
              meta={inviteCount > 0 ? `${inviteCount} pending` : "No pending invites"}
              onClick={() => navigate("/account/access-pending")}
            />

            <NavigationCard
              index={2}
              icon={Settings}
              title="Account Settings"
              description="Open the account settings hub."
              onClick={() => navigate("/account/settings")}
              meta="Live"
            />

            <NavigationCard
              index={3}
              icon={UserCircle2}
              title="Profile"
              description="Manage personal identity details like username and country."
              onClick={() => navigate("/account/profile")}
              meta="Live"
            />

            <NavigationCard
              index={4}
              icon={ShieldCheck}
              title="Security"
              description="Manage password, verification, phone change, and recovery."
              onClick={() => navigate("/account/settings/security")}
              meta={securityReadiness}
            />

            <NavigationCard
              index={5}
              icon={LockKeyhole}
              title="Recovery"
              description="Manage recovery email and phone methods."
              onClick={() => navigate("/account/settings/security/recovery")}
              meta="Nested"
            />
          </CardContent>
        </Card>

        <Card
          variant="default"
          padding="sm"
          contentSpacing="sm"
          className="card-rect"
        >
          <CardHeader title="Setup status" className="overview-section-header" />
          <CardContent className="overview-checklist">
            {checklist.map((item) => {
              const ItemIcon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  className={`overview-checklist-row ${item.action ? "is-clickable" : ""}`}
                  onClick={() => {
                    if (item.action) navigate(item.action);
                  }}
                  disabled={!item.action}
                >
                  <div className="overview-checklist-left">
                    <div
                      className={`overview-checklist-mark ${item.done ? "done" : ""}`}
                    >
                      {item.done ? (
                        <CheckCircle2 size={14} strokeWidth={2.4} />
                      ) : (
                        <ItemIcon size={14} strokeWidth={2.2} />
                      )}
                    </div>

                    <span className="overview-checklist-label">{item.label}</span>
                  </div>

                  <span className="overview-checklist-state">
                    {item.done ? "Done" : "Pending"}
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}