import React from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserCircle2,
  Globe,
  Bell,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/button";

function SettingsNavCard({
  icon: Icon,
  title,
  description,
  onClick,
  index = 0,
  disabled = false,
  meta = "",
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

function FlowStep({ step, title, text }) {
  return (
    <div className="settings-flow-item">
      <span className="settings-flow-step">{step}</span>

      <div>
        <h4 className="settings-flow-title">{title}</h4>
        <p className="settings-flow-text">{text}</p>
      </div>
    </div>
  );
}

export default function UserProfileSettingPage() {
  const navigate = useNavigate();

  return (
    <div className="account-overview-page account-settings-page">
      <Card
        variant="default"
        padding="md"
        contentSpacing="md"
        className="card-rect overview-hero-card"
      >
        <div className="overview-hero-row">
          <CardHeader
            title="Account settings"
            className="overview-hero-header"
          />

          <div className="overview-hero-action">
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                size="md"
                emphasis="medium"
                onClick={() => navigate("/account/profile")}
              >
                View Profile
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                emphasis="medium"
                onClick={() => navigate("/account/home")}
              >
                Account Home
              </Button>
            </div>
          </div>
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
            title="Settings sections"
            className="overview-section-header"
          />

          <CardContent className="overview-nav-grid">
            <SettingsNavCard
              index={0}
              icon={UserCircle2}
              title="Profile"
              description="Update account identity details such as name, username, country, avatar, and visible personal information."
              onClick={() => navigate("/account/profile")}
              meta="Available"
            />

            <SettingsNavCard
              index={1}
              icon={ShieldCheck}
              title="Security"
              description="Manage password, account verification, recovery options, and sensitive access controls."
              onClick={() => navigate("/account/security")}
              meta="Available"
            />

            <SettingsNavCard
              index={2}
              icon={LockKeyhole}
              title="Recovery"
              description="Access account recovery tools from the security area where sensitive account protection belongs."
              onClick={() => navigate("/account/security")}
              meta="Inside Security"
            />

            <SettingsNavCard
              index={3}
              icon={KeyRound}
              title="Password"
              description="Change or review password controls from the security section, not from profile settings."
              onClick={() => navigate("/account/security")}
              meta="Inside Security"
            />

            <SettingsNavCard
              index={4}
              icon={Globe}
              title="Preferences"
              description="Theme and language controls are handled at shell level, not inside this account settings page."
              disabled
              meta="Shell controlled"
            />

            <SettingsNavCard
              index={5}
              icon={Bell}
              title="Notifications"
              description="Notification settings should only appear here when the backend and product logic actually support them."
              disabled
              meta="Not active"
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
            title="Recommended flow"
            className="overview-section-header"
          />

          <CardContent className="settings-flow-stack">
            <FlowStep
              step="1"
              title="Update profile details"
              text="Start with account identity details such as name, username, country, avatar, and other user-facing profile information."
            />

            <FlowStep
              step="2"
              title="Review account security"
              text="Then move to password, verification status, and recovery controls to strengthen account protection."
            />

            <FlowStep
              step="3"
              title="Keep business settings separate"
              text="Leave workspace, business roles, and business configuration under business routes to avoid mixing personal and operational settings."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}