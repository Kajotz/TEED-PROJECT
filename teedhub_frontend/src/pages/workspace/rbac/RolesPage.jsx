import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  Shield,
  Plus,
  X,
  LoaderCircle,
  Trash2,
  Pencil,
  CircleAlert,
  CircleCheck,
  Users,
  Lock,
  KeyRound,
} from "lucide-react";

import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/button";
import Input from "@/components/ui/Input";
import TooltipPortal from "@/components/ui/tooltip/TooltipPortal";
import Form, {
  FormActions,
  FormRow,
  FormSection,
} from "@/components/ui/Forms";

import { useAppToast } from "@/components/ui/toast/AppToastProvider";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/utils/api";

import "@/styles/global/GlobalUi.css";
import "@/styles/global/PopUpMenu.css";
import "@/styles/workspace/rbac/MembersList.css";

const TASK_OPTIONS = [
  { key: "manage_business", label: "Manage Business" },
  { key: "manage_team", label: "Manage Team" },
  { key: "manage_roles", label: "Manage Roles" },
  { key: "manage_content", label: "Manage Content" },
  { key: "view_reports", label: "View Reports" },
  { key: "manage_inventory", label: "Manage Inventory" },
  { key: "view_inventory", label: "View Inventory" },
];

function getErrorMessage(error, fallback) {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (error.message) return error.message;
  return fallback;
}

async function parseApiError(res, fallback) {
  try {
    const data = await res.json();

    if (typeof data?.error === "string") return data.error;
    if (typeof data?.detail === "string") return data.detail;
    if (typeof data?.message === "string") return data.message;

    if (data?.error && typeof data.error === "object") {
      const firstKey = Object.keys(data.error)[0];
      const value = data.error[firstKey];
      if (Array.isArray(value)) return value[0];
      if (typeof value === "string") return value;
    }

    if (data && typeof data === "object") {
      const firstKey = Object.keys(data)[0];
      const value = data[firstKey];
      if (Array.isArray(value)) return value[0];
      if (typeof value === "string") return value;
    }
  } catch {
    // ignore json parse failure
  }

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

function StateMessage({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  loading = false,
}) {
  const Icon = icon;

  return (
    <div className="rounded-2xl border border-dashed border-gray-200 px-5 py-5 text-sm text-gray-500 dark:border-[#323232] dark:text-gray-400">
      <div className="flex items-start gap-3">
        <div className="shrink-0 opacity-80">
          <Icon size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {title}
          </div>
          <div className="mt-1.5 leading-6">{message}</div>

          {actionLabel && onAction ? (
            <div className="mt-4">
              <Button onClick={onAction} disabled={loading}>
                {loading ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Working...
                  </>
                ) : (
                  actionLabel
                )}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  tooltip,
  children,
  disabled = false,
  ...props
}) {
  return (
    <TooltipPortal content={tooltip}>
      <span className="inline-flex">
        <Button {...props} disabled={disabled}>
          {children}
        </Button>
      </span>
    </TooltipPortal>
  );
}

function RoleCard({
  role,
  canUpdate,
  canDelete,
  actionLoadingKey,
  onEdit,
  onDelete,
}) {
  const isBusy = actionLoadingKey === role.id;
  const isLocked = Boolean(role.is_locked);

  const taskPreview = Array.isArray(role.task_labels)
    ? role.task_labels.slice(0, 3).map((task) => task.label)
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="member-card"
    >
      <div className="member-card__top">
        <div className="member-card__identity">
          <h3 className="member-card__name">{role.name || "Unnamed role"}</h3>
        </div>

        <div className="member-card__badges">
          <span className="member-card__badge member-card__badge--role">
            {isLocked ? "System" : "Custom"}
          </span>

          <span
            className={`member-card__badge member-card__badge--status ${
              isLocked ? "is-active" : "is-inactive"
            }`}
          >
            {isLocked ? "Locked" : "Editable"}
          </span>
        </div>
      </div>

      <div className="member-card__body">
        <div className="member-card__field">
          <span className="member-card__label">Members</span>
          <span className="member-card__value">
            {role.member_count ?? 0}
          </span>
        </div>

        <div className="member-card__field">
          <span className="member-card__label">Tasks</span>
          <span className="member-card__value">
            {Array.isArray(role.tasks) ? role.tasks.length : 0}
          </span>
        </div>

        <div className="member-card__field">
          <span className="member-card__label">Task preview</span>
          <span className="member-card__value">
            {taskPreview.length > 0 ? taskPreview.join(", ") : "No tasks selected"}
          </span>
        </div>
      </div>

      <div className="member-card__actions">
        {canUpdate ? (
          <ActionButton
            size="sm"
            tooltip={
              isLocked
                ? "Locked default roles should not be renamed here."
                : "Edit this custom role"
            }
            onClick={() => onEdit(role)}
            disabled={isBusy || isLocked}
          >
            {isBusy ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : (
              <Pencil size={14} />
            )}
            Edit
          </ActionButton>
        ) : null}

        {canDelete ? (
          <ActionButton
            size="sm"
            variant="secondary"
            tooltip={
              isLocked
                ? "Locked default roles cannot be deleted."
                : "Delete this custom role"
            }
            onClick={() => onDelete(role)}
            disabled={isBusy || isLocked}
          >
            {isBusy ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Delete
          </ActionButton>
        ) : null}
      </div>
    </motion.div>
  );
}

export default function RolesPage() {
  const navigate = useNavigate();
  const toast = useAppToast();
  const { business, membership } = useOutletContext();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [submittingRole, setSubmittingRole] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState(null);

  const [form, setForm] = useState({ name: "", tasks: [] });

  const canCreate =
    membership?.permissions?.includes("roles.create") ||
    membership?.role === "owner";

  const canUpdate =
    membership?.permissions?.includes("roles.update") ||
    membership?.role === "owner";

  const canDelete =
    membership?.permissions?.includes("roles.delete") ||
    membership?.role === "owner";

  const totalRoles = roles.length;
  const lockedRoles = useMemo(
    () => roles.filter((role) => role.is_locked).length,
    [roles]
  );
  const customRoles = totalRoles - lockedRoles;
  const totalAssignments = useMemo(
    () =>
      roles.reduce((sum, role) => sum + Number(role.member_count || 0), 0),
    [roles]
  );

  const loadData = useCallback(async () => {
    if (!business?.id) return;

    setLoading(true);
    setPageError("");

    try {
      const res = await apiGet(`/api/businesses/${business.id}/roles/`);

      if (!res.ok) {
        throw new Error(await parseApiError(res, "Failed to load roles."));
      }

      const data = await res.json();
      setRoles(Array.isArray(data) ? data : data.results || []);
      setPageError("");
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load roles.");
      setPageError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [business?.id, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditingRole(null);
    setForm({ name: "", tasks: [] });
    setIsRoleOpen(true);
  };

  const openEdit = (role) => {
    if (role?.is_locked) {
      toast.warning("Locked default roles are not edited here.");
      return;
    }

    setEditingRole(role);
    setForm({
      name: role.name || "",
      tasks: Array.isArray(role.tasks) ? role.tasks : [],
    });
    setIsRoleOpen(true);
  };

  const closeRoleModal = () => {
    setIsRoleOpen(false);
    setEditingRole(null);
    setForm({ name: "", tasks: [] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const roleName = form.name.trim();
    if (!roleName) {
      toast.warning("Role name is required.");
      return;
    }

    try {
      setSubmittingRole(true);

      let res;

      if (editingRole) {
        res = await apiPatch(
          `/api/businesses/${business.id}/roles/${editingRole.id}/`,
          { name: roleName, tasks: form.tasks }
        );
      } else {
        res = await apiPost(`/api/businesses/${business.id}/roles/`, {
          name: roleName,
          tasks: form.tasks,
        });
      }

      if (!res.ok) {
        throw new Error(
          await parseApiError(
            res,
            editingRole ? "Failed to update role." : "Failed to create role."
          )
        );
      }

      const data = await res.json();

      if (editingRole) {
        setRoles((prev) =>
          prev.map((role) => (role.id === data.id ? data : role))
        );
        toast.success("Role updated.");
      } else {
        setRoles((prev) => [...prev, data]);
        toast.success("Role created.");
      }

      closeRoleModal();
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          editingRole ? "Failed to update role." : "Failed to create role."
        )
      );
    } finally {
      setSubmittingRole(false);
    }
  };

  const handleDelete = async (role) => {
    if (role?.is_locked) {
      toast.warning("Locked default roles cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${role.name}? This only works if the role has no member assignments and no attached permissions.`
    );

    if (!confirmed) return;

    try {
      setActionLoadingKey(role.id);

      const res = await apiDelete(
        `/api/businesses/${business.id}/roles/${role.id}/`
      );

      if (!res.ok) {
        throw new Error(await parseApiError(res, "Failed to delete role."));
      }

      setRoles((prev) => prev.filter((item) => item.id !== role.id));
      toast.success("Role deleted.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete role."));
    } finally {
      setActionLoadingKey(null);
    }
  };

  const toggleTask = (taskKey) => {
    setForm((prev) => {
      const hasTask = prev.tasks.includes(taskKey);
      return {
        ...prev,
        tasks: hasTask
          ? prev.tasks.filter((item) => item !== taskKey)
          : [...prev.tasks, taskKey],
      };
    });
  };

  const statusCards = [
    {
      id: "total",
      title: "Total roles",
      value: String(totalRoles),
      icon: Shield,
      tone: "blue",
    },
    {
      id: "locked",
      title: "Default locked",
      value: String(lockedRoles),
      icon: Lock,
      tone: lockedRoles > 0 ? "blue" : "gold",
    },
    {
      id: "custom",
      title: "Custom roles",
      value: String(customRoles),
      icon: Plus,
      tone: customRoles > 0 ? "gold" : "blue",
    },
    {
      id: "assigned",
      title: "Assignments",
      value: String(totalAssignments),
      icon: Users,
      tone: "blue",
    },
  ];

  return (
    <>
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
                    <Shield size={34} />
                  </div>
                </div>

                <div className="profile-header-copy min-w-0">
                  <p className="profile-header-email truncate">
                    Manage workspace roles and access structure
                  </p>
                </div>
              </div>
            </div>

            <div className="overview-hero-action">
              <div className="members-hero-actions">
                {canCreate ? (
                  <TooltipPortal content="Create a new custom role for this business">
                    <span className="members-hero-actions__item">
                      <Button
                        type="button"
                        onClick={openCreate}
                        className="members-hero-actions__button"
                      >
                        <Plus size={16} />
                        New role
                      </Button>
                    </span>
                  </TooltipPortal>
                ) : null}

                <TooltipPortal content="Return to workspace members area">
                  <span className="members-hero-actions__item">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => navigate(`/business/${business.id}/members`)}
                      className="members-hero-actions__button"
                    >
                      Back
                    </Button>
                  </span>
                </TooltipPortal>
              </div>
            </div>
          </div>

          <div className="overview-status-strip" aria-label="Roles status">
            {statusCards.map((item) => (
              <StatusPill
                key={item.id}
                icon={item.icon}
                title={item.title}
                value={item.value}
                tone={item.tone}
              />
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card
            variant="default"
            padding="sm"
            contentSpacing="sm"
            className="card-rect w-full"
          >
            <CardHeader
              title="Roles list"
              className="overview-section-header"
            />

            <CardContent className="space-y-6">
              {loading ? (
                <StateMessage
                  icon={LoaderCircle}
                  title="Loading roles"
                  message="Fetching role definitions, permission counts, and assignment totals."
                />
              ) : pageError ? (
                <StateMessage
                  icon={CircleAlert}
                  title="Could not load this page"
                  message={pageError}
                  actionLabel="Try again"
                  onAction={loadData}
                />
              ) : roles.length === 0 ? (
                <StateMessage
                  icon={Shield}
                  title="No roles found"
                  message="This business has no visible roles yet."
                />
              ) : (
                <div className="members-list-stack">
                  {roles.map((role) => (
                    <RoleCard
                      key={role.id}
                      role={role}
                      canUpdate={canUpdate}
                      canDelete={canDelete}
                      actionLoadingKey={actionLoadingKey}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            variant="default"
            padding="sm"
            contentSpacing="sm"
            className="card-rect w-full"
          >
            <CardHeader
              title="How this page should work"
              className="overview-section-header"
            />
            <CardContent>
              <div className="rounded-2xl border border-dashed border-gray-200 px-5 py-5 text-sm text-gray-600 dark:border-[#323232] dark:text-gray-400">
                Locked default roles stay here as role definitions.
                Member role changes belong on the members page, where one member
                can be moved from admin to staff or manager cleanly without
                pretending that the role itself is being edited.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {isRoleOpen && (
          <motion.div
            className="profile-edit-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeRoleModal}
          >
            <motion.div
              className="profile-edit-panel"
              initial={{ opacity: 0, y: -28, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.985 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="profile-edit-panel-header">
                <div className="profile-edit-panel-copy">
                  <h2 className="profile-edit-panel-title">
                    {editingRole ? "Edit custom role" : "Create custom role"}
                  </h2>
                  <p className="profile-edit-panel-subtitle">
                    {editingRole
                      ? "Rename this custom role. Default locked roles are not edited here."
                      : "Create a new role definition for this business."}
                  </p>
                </div>

                <button
                  type="button"
                  className="profile-edit-close"
                  onClick={closeRoleModal}
                  aria-label="Close role popup"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="profile-edit-panel-body">
                <Form onSubmit={handleSubmit}>
                  <FormSection title="Role details">
                    <FormRow>
                      <Input
                        name="name"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ name: e.target.value })
                        }
                        placeholder="e.g. analyst"
                      />
                    </FormRow>
                  </FormSection>

                  <FormSection title="Role tasks">
                    <div className="space-y-2">
                      {TASK_OPTIONS.map((task) => {
                        const checked = form.tasks.includes(task.key);
                        return (
                          <label
                            key={task.key}
                            className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-[#323232]"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleTask(task.key)}
                            />
                            <span>{task.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </FormSection>

                  <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-4 text-sm text-gray-600 dark:border-[#323232] dark:text-gray-400">
                    <div className="flex items-start gap-3">
                      <KeyRound size={16} className="mt-0.5 shrink-0" />
                      <div>
                        Roles are configured with human-friendly tasks. The
                        backend expands tasks into internal granular permissions.
                      </div>
                    </div>
                  </div>

                  <FormActions>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={closeRoleModal}
                    >
                      Cancel
                    </Button>

                    <Button type="submit" disabled={submittingRole}>
                      {submittingRole ? (
                        <>
                          <LoaderCircle size={16} className="animate-spin" />
                          {editingRole ? "Saving..." : "Creating..."}
                        </>
                      ) : editingRole ? (
                        "Save changes"
                      ) : (
                        "Create role"
                      )}
                    </Button>
                  </FormActions>
                </Form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}