import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  Users,
  Plus,
  X,
  LoaderCircle,
  Shield,
  Trash2,
  Power,
  Mail,
  Phone,
  CircleAlert,
  CircleCheck,
  UserCog,
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

function MemberRow({
  member,
  actionLoadingKey,
  onAssignRole,
  onRemove,
  onToggleActive,
}) {
  const isBusy = actionLoadingKey === member.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="member-card"
    >
      <div className="member-card__top">
        <div className="member-card__identity">
          <h3 className="member-card__name">
            {member.username || "Unknown user"}
          </h3>
        </div>

        <div className="member-card__badges">
          <span className="member-card__badge member-card__badge--role">
            {member.primary_role || "No role"}
          </span>

          <span
            className={`member-card__badge member-card__badge--status ${
              member.is_active ? "is-active" : "is-inactive"
            }`}
          >
            {member.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="member-card__body">
        <div className="member-card__field">
          <span className="member-card__label">Email</span>
          <span className="member-card__value">{member.email || "—"}</span>
        </div>

        <div className="member-card__field">
          <span className="member-card__label">Phone</span>
          <span className="member-card__value">{member.phone_number || "—"}</span>
        </div>
      </div>

      <div className="member-card__actions">
        {member.can_edit ? (
          <ActionButton
            size="sm"
            tooltip="Assign a role to this member"
            onClick={() => onAssignRole(member)}
            disabled={isBusy}
          >
            <Shield size={14} />
            Role
          </ActionButton>
        ) : null}

        {member.can_remove ? (
          <ActionButton
            size="sm"
            variant="secondary"
            tooltip="Remove this member from the business"
            onClick={() => onRemove(member)}
            disabled={isBusy}
          >
            {isBusy ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Remove
          </ActionButton>
        ) : null}

        {member.can_deactivate ? (
          <ActionButton
            size="sm"
            variant="secondary"
            tooltip="Deactivate this member"
            onClick={() => onToggleActive(member)}
            disabled={isBusy}
          >
            {isBusy ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : (
              <Power size={14} />
            )}
            Deactivate
          </ActionButton>
        ) : null}

        {member.can_activate ? (
          <ActionButton
            size="sm"
            tooltip="Activate this member again"
            onClick={() => onToggleActive(member)}
            disabled={isBusy}
          >
            {isBusy ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : (
              <Power size={14} />
            )}
            Activate
          </ActionButton>
        ) : null}
      </div>
    </motion.div>
  );
}

export default function MembersList() {
  const navigate = useNavigate();
  const toast = useAppToast();
  const { business } = useOutletContext();

  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);

  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [submittingRole, setSubmittingRole] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState(null);

  const [form, setForm] = useState({ email: "" });

  const totalMembers = members.length;
  const activeMembers = useMemo(
    () => members.filter((m) => m.is_active).length,
    [members]
  );
  const inactiveMembers = totalMembers - activeMembers;

  const loadData = useCallback(async () => {
    if (!business?.id) return;

    setLoading(true);
    setPageError("");

    try {
      const [mRes, rRes] = await Promise.all([
        apiGet(`/api/businesses/${business.id}/members/`),
        apiGet(`/api/businesses/${business.id}/roles/`),
      ]);

      if (!mRes.ok) {
        throw new Error(await parseApiError(mRes, "Failed to load members."));
      }

      if (!rRes.ok) {
        throw new Error(await parseApiError(rRes, "Failed to load roles."));
      }

      const mData = await mRes.json();
      const rData = await rRes.json();

      setMembers(Array.isArray(mData) ? mData : mData.results || []);
      setRoles(Array.isArray(rData) ? rData : rData.results || []);
      setPageError("");
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load members.");
      setPageError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [business?.id, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInvite = async (e) => {
    e.preventDefault();

    try {
      setSubmittingInvite(true);

      const res = await apiPost(
        `/api/businesses/${business.id}/members/invite/`,
        form
      );

      if (!res.ok) {
        throw new Error(await parseApiError(res, "Invite failed."));
      }

      toast.success("Invite sent.");
      setIsInviteOpen(false);
      setForm({ email: "" });
    } catch (error) {
      toast.error(getErrorMessage(error, "Invite failed."));
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();

    if (!selectedMember || !selectedRole) {
      toast.warning("Select a role first.");
      return;
    }

    try {
      setSubmittingRole(true);

      const res = await apiPost(
        `/api/businesses/${business.id}/members/${selectedMember.id}/roles/`,
        { role_id: selectedRole }
      );

      if (!res.ok) {
        throw new Error(await parseApiError(res, "Failed to assign role."));
      }

      toast.success("Role assigned.");
      setIsRoleOpen(false);
      setSelectedMember(null);
      setSelectedRole("");
      await loadData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to assign role."));
    } finally {
      setSubmittingRole(false);
    }
  };

  const handleRemove = async (member) => {
    if (!window.confirm(`Remove ${member.username} from this business?`)) {
      return;
    }

    try {
      setActionLoadingKey(member.id);

      const res = await apiDelete(
        `/api/businesses/${business.id}/members/${member.id}/`
      );

      if (!res.ok) {
        throw new Error(await parseApiError(res, "Failed to remove member."));
      }

      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      toast.success("Member removed.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to remove member."));
    } finally {
      setActionLoadingKey(null);
    }
  };

  const handleToggleActive = async (member) => {
    const activating = !member.is_active;
    const actionWord = activating ? "activate" : "deactivate";

    try {
      setActionLoadingKey(member.id);

      const url = activating
        ? `/api/businesses/${business.id}/members/${member.id}/activate/`
        : `/api/businesses/${business.id}/members/${member.id}/deactivate/`;

      const res = await apiPatch(url);

      if (!res.ok) {
        throw new Error(
          await parseApiError(res, `Failed to ${actionWord} member.`)
        );
      }

      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id
            ? {
                ...m,
                is_active: activating,
                can_deactivate: activating,
                can_activate: !activating,
              }
            : m
        )
      );

      toast.success(
        activating ? "Member activated." : "Member deactivated."
      );
    } catch (error) {
      toast.error(getErrorMessage(error, `Failed to ${actionWord} member.`));
    } finally {
      setActionLoadingKey(null);
    }
  };

  const statusCards = [
    {
      id: "total",
      title: "Total",
      value: String(totalMembers),
      icon: Users,
      tone: "blue",
    },
    {
      id: "active",
      title: "Active",
      value: String(activeMembers),
      icon: CircleCheck,
      tone: activeMembers > 0 ? "blue" : "gold",
    },
    {
      id: "inactive",
      title: "Inactive",
      value: String(inactiveMembers),
      icon: CircleAlert,
      tone: inactiveMembers > 0 ? "gold" : "blue",
    },
    {
      id: "roles",
      title: "Roles loaded",
      value: String(roles.length),
      icon: UserCog,
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
                    <Users size={34} />
                  </div>
                </div>

                <div className="profile-header-copy min-w-0">
                  <p className="profile-header-email truncate">
                       Manage workspace members and access
                 </p>
                </div>
              </div>
            </div>

            <div className="overview-hero-action">
              <div className="members-hero-actions">
                <TooltipPortal content="Invite a new person into this business">
                  <span className="members-hero-actions__item">
                    <Button
                      type="button"
                      onClick={() => setIsInviteOpen(true)}
                      className="members-hero-actions__button"
                    >
                      <Plus size={16} />
                      Invite member
                    </Button>
                  </span>
                </TooltipPortal>

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

          <div className="overview-status-strip" aria-label="Members status">
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
              title="Members list"
              className="overview-section-header"
            />

            <CardContent className="space-y-6">
              {loading ? (
                <StateMessage
                  icon={LoaderCircle}
                  title="Loading members"
                  message="Fetching member records, roles, and access state."
                />
              ) : pageError ? (
                <StateMessage
                  icon={CircleAlert}
                  title="Could not load this page"
                  message={pageError}
                  actionLabel="Try again"
                  onAction={() => loadData()}
                />
              ) : members.length === 0 ? (
                <StateMessage
                  icon={Users}
                  title="No members found"
                  message="This business has no visible members yet."
                />
              ) : (
                <div className="members-list-stack">
                  {members.map((member) => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      actionLoadingKey={actionLoadingKey}
                      onAssignRole={(target) => {
                        setSelectedMember(target);
                        setSelectedRole("");
                        setIsRoleOpen(true);
                      }}
                      onRemove={handleRemove}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
                </div>
              )}
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
            onClick={() => setIsRoleOpen(false)}
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
                    Assign role
                    {selectedMember ? ` — ${selectedMember.username}` : ""}
                  </h2>
                  <p className="profile-edit-panel-subtitle">
                    Choose the role you want to assign to this member.
                  </p>
                </div>

                <button
                  type="button"
                  className="profile-edit-close"
                  onClick={() => setIsRoleOpen(false)}
                  aria-label="Close role popup"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="profile-edit-panel-body">
                <Form onSubmit={handleAssignRole}>
                  <FormSection title="Role assignment">
                    <FormRow>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1F75FE] dark:border-[#323232] dark:bg-[#1f1f1f] dark:text-gray-100"
                      >
                        <option value="">Select role</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </FormRow>
                  </FormSection>

                  <FormActions>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsRoleOpen(false)}
                    >
                      Cancel
                    </Button>

                    <Button type="submit" disabled={submittingRole}>
                      {submittingRole ? (
                        <>
                          <LoaderCircle size={16} className="animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        "Assign role"
                      )}
                    </Button>
                  </FormActions>
                </Form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isInviteOpen && (
          <motion.div
            className="profile-edit-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsInviteOpen(false)}
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
                  <h2 className="profile-edit-panel-title">Invite member</h2>
                  <p className="profile-edit-panel-subtitle">
                    Enter the email address of the person you want to invite.
                  </p>
                </div>

                <button
                  type="button"
                  className="profile-edit-close"
                  onClick={() => setIsInviteOpen(false)}
                  aria-label="Close invite popup"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="profile-edit-panel-body">
                <Form onSubmit={handleInvite}>
                  <FormSection title="Invitation">
                    <FormRow>
                      <Input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ email: e.target.value })}
                        placeholder="member@example.com"
                      />
                    </FormRow>
                  </FormSection>

                  <FormActions>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsInviteOpen(false)}
                    >
                      Cancel
                    </Button>

                    <Button type="submit" disabled={submittingInvite}>
                      {submittingInvite ? (
                        <>
                          <LoaderCircle size={16} className="animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send invite"
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