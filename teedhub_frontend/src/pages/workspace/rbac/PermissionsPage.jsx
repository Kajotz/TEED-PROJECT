import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Key, Shield, Users, CircleAlert, Lock } from "lucide-react";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/button";
import { useAppToast } from "@/components/ui/toast/AppToastProvider";
import { apiGet } from "@/utils/api";
import "@/styles/global/GlobalUi.css";
import "@/styles/workspace/rbac/MembersList.css";

function getErrorMessage(error, fallback) {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (error.message) return error.message;
  return fallback;
}

function StatusPill({ title, value, icon: Icon, tone = "blue" }) {
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

export default function PermissionsPage() {
  const navigate = useNavigate();
  const toast = useAppToast();
  const { business } = useOutletContext();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const loadData = useCallback(async () => {
    if (!business?.id) return;
    setLoading(true);
    setPageError("");
    try {
      const res = await apiGet(`/api/businesses/${business.id}/roles/`);
      if (!res.ok) {
        throw new Error("Failed to load roles.");
      }
      const data = await res.json();
      setRoles(Array.isArray(data) ? data : data?.results || []);
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load role tasks.");
      setPageError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [business?.id, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const lockedCount = useMemo(
    () => roles.filter((role) => role.is_locked).length,
    [roles]
  );

  return (
    <div className="account-overview-page">
      <Card variant="default" padding="md" contentSpacing="md" className="card-rect overview-hero-card">
        <div className="overview-hero-row">
          <div className="overview-hero-header min-w-0">
            <div className="profile-header-minimal">
              <div className="profile-header-avatar-wrap">
                <div className="profile-header-avatar-fallback">
                  <Key size={34} />
                </div>
              </div>
              <div className="profile-header-copy min-w-0">
                <p className="profile-header-email truncate">
                  Role tasks (human-facing permissions)
                </p>
              </div>
            </div>
          </div>
          <div className="overview-hero-action">
            <Button type="button" variant="secondary" onClick={() => navigate(`/business/${business.id}/members`)}>
              Back
            </Button>
          </div>
        </div>
        <div className="overview-status-strip" aria-label="Task permission status">
          <StatusPill title="Roles" value={String(roles.length)} icon={Shield} />
          <StatusPill title="Locked" value={String(lockedCount)} icon={Lock} tone={lockedCount ? "blue" : "gold"} />
          <StatusPill
            title="Total Tasks"
            value={String(roles.reduce((sum, role) => sum + (Array.isArray(role.tasks) ? role.tasks.length : 0), 0))}
            icon={Users}
          />
        </div>
      </Card>

      <Card variant="default" padding="sm" contentSpacing="sm" className="card-rect w-full">
        <CardHeader title="Role task mapping" className="overview-section-header" />
        <CardContent className="space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-dashed border-gray-200 px-5 py-5 text-sm text-gray-500 dark:border-[#323232] dark:text-gray-400">
              Loading role tasks...
            </div>
          ) : pageError ? (
            <div className="rounded-2xl border border-dashed border-gray-200 px-5 py-5 text-sm text-gray-500 dark:border-[#323232] dark:text-gray-400">
              <CircleAlert size={16} className="inline mr-2" />
              {pageError}
            </div>
          ) : roles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 px-5 py-5 text-sm text-gray-500 dark:border-[#323232] dark:text-gray-400">
              No roles found.
            </div>
          ) : (
            roles.map((role) => (
              <div key={role.id} className="rounded-2xl border border-gray-200 px-4 py-4 dark:border-[#323232]">
                <div className="text-sm font-semibold">{role.name}</div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {Array.isArray(role.task_labels) && role.task_labels.length
                    ? role.task_labels.map((item) => item.label).join(", ")
                    : "No tasks selected"}
                </div>
                {role.has_unmapped_permissions ? (
                  <div className="mt-2 text-xs text-amber-600">
                    Contains legacy permissions not mapped to task labels.
                  </div>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}