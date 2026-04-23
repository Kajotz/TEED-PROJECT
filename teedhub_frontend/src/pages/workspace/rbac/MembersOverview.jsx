import { motion } from "framer-motion";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Users, Shield, Key, User, RefreshCw } from "lucide-react";

import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/button";

import "@/styles/global/GlobalUi.css";

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="overview-status-pill overview-status-pill-blue">
      <div className="overview-status-pill-icon">
        <Icon size={14} />
      </div>
      <div className="overview-status-pill-body">
        <span className="overview-status-pill-label">{label}</span>
        <span className="overview-status-pill-value">{value}</span>
      </div>
    </div>
  );
}

function NavCard({ icon: Icon, title, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="overview-nav-card"
      whileHover={{ y: -3 }}
    >
      <div className="overview-nav-card-icon">
        <Icon size={18} />
      </div>
      <h3 className="overview-nav-card-title">{title}</h3>
    </motion.button>
  );
}

export default function MembersOverview() {
  const navigate = useNavigate();
  const {
    business,
    membership,
    rbacSummary,
    rbacSummaryLoading,
    refreshRbacSummary,
  } = useOutletContext();

  const membersCount = rbacSummary?.members_count ?? 0;
  const rolesCount = rbacSummary?.roles_count ?? 0;
  const permissionsCount = rbacSummary?.permissions_count ?? 0;
  const myRole = rbacSummary?.my_role || membership?.role || "—";

  return (
    <div className="account-overview-page">
      <Card className="card-rect overview-hero-card">
        <div className="overview-hero-row">
          <div>
            <p className="profile-header-username">@{business?.slug}</p>
            <p className="profile-header-email">Members & Access Control</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              onClick={() => navigate(`/business/${business.id}/members/list`)}
            >
              Members
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/business/${business.id}/members/roles`)}
            >
              Roles
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={refreshRbacSummary}
              disabled={rbacSummaryLoading}
            >
              <span className="inline-flex items-center gap-2">
                <RefreshCw
                  size={14}
                  className={rbacSummaryLoading ? "animate-spin" : ""}
                />
                Refresh
              </span>
            </Button>
          </div>
        </div>

        <div className="overview-status-strip">
          <Stat
            icon={Users}
            label="Members"
            value={rbacSummaryLoading ? "..." : membersCount}
          />
          <Stat
            icon={Shield}
            label="Roles"
            value={rbacSummaryLoading ? "..." : rolesCount}
          />
          <Stat
            icon={Key}
            label="Permissions"
            value={rbacSummaryLoading ? "..." : permissionsCount}
          />
          <Stat
            icon={User}
            label="Your role"
            value={rbacSummaryLoading ? "..." : myRole}
          />
        </div>
      </Card>

      <div className="overview-main-grid">
        <Card className="card-rect">
          <CardHeader title="Access management" />
          <CardContent className="overview-nav-grid">
            <NavCard
              icon={Users}
              title="Members"
              onClick={() => navigate(`/business/${business.id}/members/list`)}
            />
            <NavCard
              icon={Shield}
              title="Roles"
              onClick={() => navigate(`/business/${business.id}/members/roles`)}
            />
            <NavCard
              icon={Key}
              title="Permissions"
              onClick={() =>
                navigate(`/business/${business.id}/members/permissions`)
              }
            />
            <NavCard
              icon={User}
              title="Invites"
              onClick={() =>
                navigate(`/business/${business.id}/members/invites`)
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}