import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  Mail,
  Send,
  UserPlus,
  X,
  ShieldCheck,
  Clock3,
  CheckCircle2,
  Building2,
  RefreshCw,
  Search,
  Briefcase,
  Check,
} from "lucide-react";

import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/button";
import Input from "@/components/ui/Input";
import Form, {
  FormActions,
  FormRow,
  FormSection,
} from "@/components/ui/Forms";
import { useAppToast } from "@/components/ui/toast/AppToastProvider";
import { apiGet, apiPost } from "@/utils/api";

import "@/styles/global/GlobalUi.css";
import "@/styles/global/PopUpMenu.css";

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

function SummaryRow({ label, value, done = null }) {
  return (
    <div className="overview-checklist-row">
      <div className="overview-checklist-left">
        <div className={`overview-checklist-mark ${done ? "done" : ""}`}>
          {done ? (
            <ShieldCheck size={14} strokeWidth={2.4} />
          ) : (
            <Clock3 size={14} strokeWidth={2.2} />
          )}
        </div>

        <span className="overview-checklist-label">{label}</span>
      </div>

      <span className="overview-checklist-state">{value || "—"}</span>
    </div>
  );
}

function ResolverResults({
  items,
  emptyText,
  onSelect,
  getKey,
  getLabel,
}) {
  if (!items.length) {
    return (
      <div className="mt-2 rounded-2xl border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-500 dark:border-[#323232] dark:text-gray-400">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-2xl border border-gray-200 bg-white p-2 dark:border-[#323232] dark:bg-[#1f1f1f]">
      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={getKey(item)}
            type="button"
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
            onClick={() => onSelect(item)}
          >
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {getLabel(item)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Select
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ResolverPreview({ title, rows }) {
  return (
    <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 dark:border-[#323232] dark:bg-[#181818]">
      <div className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </div>

      <div className="space-y-1">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="text-gray-500 dark:text-gray-400">{row.label}</span>
            <span className="truncate text-right font-medium text-gray-900 dark:text-gray-100">
              {row.value || "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const INITIAL_INVITE_FORM = {
  targetType: "email",
  email: "",
  username: "",
  user_id: "",
  role_id: "",
};

const INITIAL_REQUEST_FORM = {
  searchType: "business_name",
  business_name: "",
  business_id: "",
};

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function getBusinessLabel(invite, fallbackBusiness) {
  if (invite?.business_name) return invite.business_name;
  if (fallbackBusiness?.name) return fallbackBusiness.name;
  return "Business";
}

function getRoleLabel(invite) {
  return invite?.role_name || invite?.role || "—";
}

function getTargetLabel(invite) {
  if (invite?.target_username) return `@${invite.target_username}`;
  if (invite?.email) return invite.email;
  if (invite?.target_user_id) return invite.target_user_id;
  if (invite?.target_user) return String(invite.target_user);
  return "—";
}

function getDeliveryLabel(invite) {
  if (invite?.delivery === "local") return "In-app";
  if (invite?.delivery === "email") return "Email";
  return "—";
}

export default function InvitesPage() {
  const navigate = useNavigate();
  const toast = useAppToast();

  const outletContext = useOutletContext() || {};
  const business = outletContext.business || null;
  const membership = outletContext.membership || null;
  const refreshWorkspaceContext = outletContext.refreshWorkspaceContext || null;

  const isWorkspaceMode = Boolean(business?.id);
  const isAccountMode = !isWorkspaceMode;

  const permissions = membership?.permissions || [];
  const canInvite =
    isWorkspaceMode &&
    (permissions.includes("members.invite") ||
      String(membership?.role || "").toLowerCase() === "owner");

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  const [inviteForm, setInviteForm] = useState(INITIAL_INVITE_FORM);
  const [requestForm, setRequestForm] = useState(INITIAL_REQUEST_FORM);

  const [myInvites, setMyInvites] = useState([]);
  const [workspaceInvites, setWorkspaceInvites] = useState([]);
  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [approveRoleMap, setApproveRoleMap] = useState({});

  const [userResults, setUserResults] = useState([]);
  const [userSearching, setUserSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [businessResults, setBusinessResults] = useState([]);
  const [businessSearching, setBusinessSearching] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  const roleLabel = membership?.role || "member";
  const headerTitle = isWorkspaceMode ? business?.name || "Invitations" : "Invitations";
  const headerSubtitle = isWorkspaceMode
    ? "Invite members and approve access requests"
    : "Accept invites and request access to businesses";

  const fetchMyInvites = useCallback(async () => {
    const response = await apiGet("/api/invites/me/");
    if (!response.ok) {
      throw new Error(`Failed to load my invites (${response.status})`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }, []);

  const fetchWorkspaceInvites = useCallback(async () => {
    if (!business?.id) return [];
    const response = await apiGet(`/api/businesses/${business.id}/invites/`);
    if (!response.ok) {
      throw new Error(`Failed to load workspace invites (${response.status})`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }, [business?.id]);

  const fetchRoles = useCallback(async () => {
    if (!business?.id) return [];
    const response = await apiGet(`/api/businesses/${business.id}/roles/`);
    if (!response.ok) {
      throw new Error(`Failed to load roles (${response.status})`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }, [business?.id]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [mine, workspaceData, roleData] = await Promise.all([
        fetchMyInvites(),
        isWorkspaceMode ? fetchWorkspaceInvites() : Promise.resolve([]),
        isWorkspaceMode ? fetchRoles() : Promise.resolve([]),
      ]);

      setMyInvites(mine);
      setWorkspaceInvites(workspaceData);
      setRoles(roleData);
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Failed to load invitation data.");
      setMyInvites([]);
      setWorkspaceInvites([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [fetchMyInvites, fetchWorkspaceInvites, fetchRoles, isWorkspaceMode, toast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const searchUsers = useCallback(async (query) => {
    const normalized = String(query || "").trim();

    if (!normalized) {
      setUserResults([]);
      return;
    }

    setUserSearching(true);

    try {
      const response = await apiGet(
        `/api/users/search/?q=${encodeURIComponent(normalized)}`
      );

      if (!response.ok) {
        throw new Error("User lookup failed.");
      }

      const data = await response.json();
      setUserResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setUserResults([]);
    } finally {
      setUserSearching(false);
    }
  }, []);

  const searchBusinesses = useCallback(async (query) => {
    const normalized = String(query || "").trim();

    if (!normalized) {
      setBusinessResults([]);
      return;
    }

    setBusinessSearching(true);

    try {
      const response = await apiGet(
        `/api/businesses/search/?q=${encodeURIComponent(normalized)}`
      );

      if (!response.ok) {
        throw new Error("Business lookup failed.");
      }

      const data = await response.json();
      setBusinessResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setBusinessResults([]);
    } finally {
      setBusinessSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!isInviteOpen) return;
    if (inviteForm.targetType === "email") {
      setUserResults([]);
      return;
    }

    const query =
      inviteForm.targetType === "username"
        ? inviteForm.username
        : inviteForm.user_id;

    if (!String(query || "").trim()) {
      setUserResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchUsers(query);
    }, 250);

    return () => clearTimeout(timer);
  }, [
    inviteForm.targetType,
    inviteForm.username,
    inviteForm.user_id,
    isInviteOpen,
    searchUsers,
  ]);

  useEffect(() => {
    if (!isRequestOpen) return;

    const query =
      requestForm.searchType === "business_name"
        ? requestForm.business_name
        : requestForm.business_id;

    if (!String(query || "").trim()) {
      setBusinessResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchBusinesses(query);
    }, 250);

    return () => clearTimeout(timer);
  }, [
    requestForm.searchType,
    requestForm.business_name,
    requestForm.business_id,
    isRequestOpen,
    searchBusinesses,
  ]);

  const closeInviteModal = () => {
    setIsInviteOpen(false);
    setInviteForm(INITIAL_INVITE_FORM);
    setUserResults([]);
    setSelectedUser(null);
    setUserSearching(false);
  };

  const closeRequestModal = () => {
    setIsRequestOpen(false);
    setRequestForm(INITIAL_REQUEST_FORM);
    setBusinessResults([]);
    setSelectedBusiness(null);
    setBusinessSearching(false);
  };

  const handleInviteChange = (event) => {
    const { name, value } = event.target;

    setInviteForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "targetType") {
        next.email = "";
        next.username = "";
        next.user_id = "";
        setSelectedUser(null);
        setUserResults([]);
      }

      if (name === "username") {
        next.user_id = "";
        setSelectedUser(null);
      }

      if (name === "user_id") {
        next.username = "";
        setSelectedUser(null);
      }

      return next;
    });
  };

  const handleRequestChange = (event) => {
    const { name, value } = event.target;

    setRequestForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "searchType") {
        next.business_name = "";
        next.business_id = "";
        setSelectedBusiness(null);
        setBusinessResults([]);
      }

      if (name === "business_name" || name === "business_id") {
        setSelectedBusiness(null);
      }

      return next;
    });
  };

  const handleApproveRoleChange = (inviteId, roleId) => {
    setApproveRoleMap((prev) => ({
      ...prev,
      [inviteId]: roleId,
    }));
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setInviteForm((prev) => ({
      ...prev,
      username: user.username || "",
      user_id: String(user.id),
    }));
    setUserResults([]);
  };

  const handleSelectBusiness = (entry) => {
    setSelectedBusiness(entry);
    setRequestForm((prev) => ({
      ...prev,
      business_name: entry.name || "",
      business_id: String(entry.id),
    }));
    setBusinessResults([]);
  };

  const incomingInvites = useMemo(() => {
    return (myInvites || []).filter((item) => item.type === "invite");
  }, [myInvites]);

  const myRequests = useMemo(() => {
    return (myInvites || []).filter((item) => item.type === "request");
  }, [myInvites]);

  const workspaceDirectInvites = useMemo(() => {
    return (workspaceInvites || []).filter((item) => item.type === "invite");
  }, [workspaceInvites]);

  const workspaceAccessRequests = useMemo(() => {
    return (workspaceInvites || []).filter((item) => item.type === "request");
  }, [workspaceInvites]);

  const pendingCount = useMemo(() => {
    if (isWorkspaceMode) {
      return (workspaceInvites || []).filter((item) => item.status === "pending").length;
    }
    return (myInvites || []).filter((item) => item.status === "pending").length;
  }, [isWorkspaceMode, workspaceInvites, myInvites]);

  const statusCards = useMemo(() => {
    return [
      {
        id: "mode",
        title: "Mode",
        value: isWorkspaceMode ? "Workspace" : "Account",
        icon: Building2,
        tone: "blue",
      },
      {
        id: "pending",
        title: "Pending",
        value: String(pendingCount),
        icon: Clock3,
        tone: pendingCount > 0 ? "gold" : "blue",
      },
      {
        id: "invite-access",
        title: "Invite access",
        value: canInvite ? "Allowed" : isWorkspaceMode ? "Restricted" : "Open",
        icon: ShieldCheck,
        tone: canInvite || isAccountMode ? "blue" : "gold",
      },
      {
        id: "role",
        title: "Your role",
        value: isWorkspaceMode ? roleLabel : "verified user",
        icon: UserPlus,
        tone: "blue",
      },
    ];
  }, [isWorkspaceMode, pendingCount, canInvite, roleLabel]);

  const quickActions = useMemo(() => {
    if (isWorkspaceMode) {
      return [
        {
          icon: Send,
          title: "Invite Member",
          description: "Invite by email, username, or user id and assign role.",
          meta: canInvite ? "Live" : "Restricted",
          onClick: () => {
            if (!canInvite) {
              toast.warning("You do not have permission to invite members.");
              return;
            }
            setIsInviteOpen(true);
          },
          disabled: false,
        },
        {
          icon: RefreshCw,
          title: "Refresh",
          description: "Reload invites, requests, and role options.",
          meta: "Live",
          onClick: loadAll,
          disabled: false,
        },
      ];
    }

    return [
      {
        icon: Briefcase,
        title: "Request Access",
        description: "Request to join a business by name or business id.",
        meta: "Live",
        onClick: () => setIsRequestOpen(true),
        disabled: false,
      },
      {
        icon: RefreshCw,
        title: "Refresh",
        description: "Reload invites and request statuses.",
        meta: "Live",
        onClick: loadAll,
        disabled: false,
      },
    ];
  }, [isWorkspaceMode, canInvite, loadAll, toast]);

  const submitInvite = async (event) => {
    event.preventDefault();

    if (!isWorkspaceMode || !canInvite) {
      toast.warning("You do not have permission to invite members.");
      return;
    }

    if (!inviteForm.role_id) {
      toast.warning("Choose a role first.");
      return;
    }

    const payload = { role_id: inviteForm.role_id };

    if (inviteForm.targetType === "email") {
      if (!inviteForm.email.trim()) {
        toast.warning("Email is required.");
        return;
      }
      payload.email = inviteForm.email.trim();
    }

    if (inviteForm.targetType === "username" || inviteForm.targetType === "user_id") {
      if (!inviteForm.user_id.trim()) {
        toast.warning("Resolve and select a valid user first.");
        return;
      }
      payload.user_id = inviteForm.user_id.trim();
    }

    setInviteSubmitting(true);

    try {
      const response = await apiPost(`/api/businesses/${business.id}/invites/`, payload);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || data?.detail || "Failed to create invite.");
      }

      toast.success("Invite created.");
      closeInviteModal();
      await loadAll();
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Failed to create invite.");
    } finally {
      setInviteSubmitting(false);
    }
  };

  const submitRequest = async (event) => {
    event.preventDefault();

    if (!requestForm.business_id.trim()) {
      toast.warning("Resolve and select a valid business first.");
      return;
    }

    const payload = {
      business_id: requestForm.business_id.trim(),
    };

    setRequestSubmitting(true);

    try {
      const response = await apiPost("/api/invites/request/", payload);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || data?.detail || "Failed to send request.");
      }

      toast.success("Access request sent.");
      closeRequestModal();
      await loadAll();
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Failed to send access request.");
    } finally {
      setRequestSubmitting(false);
    }
  };

  const acceptInvite = async (invite) => {
    setActionLoadingId(invite.id);

    try {
      const response = await apiPost("/api/invites/accept/", {
        invite_id: invite.id,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || `Failed to accept invite (${response.status})`);
      }

      const data = await response.json().catch(() => ({}));

      toast.success("Invite accepted.");
      await loadAll();

      if (typeof refreshWorkspaceContext === "function") {
        await refreshWorkspaceContext();
      }

      const acceptedBusinessId =
        data?.business_id || invite?.business || invite?.business_id || null;

      if (acceptedBusinessId) {
        navigate(`/business/${acceptedBusinessId}`);
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Failed to accept invite.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const declineInvite = async (inviteId) => {
    setActionLoadingId(inviteId);

    try {
      const response = await apiPost("/api/invites/decline/", {
        invite_id: inviteId,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || `Failed to decline invite (${response.status})`);
      }

      toast.success("Invite declined.");
      await loadAll();
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Failed to decline invite.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const revokeItem = async (inviteId) => {
    if (!business?.id) return;

    setActionLoadingId(inviteId);

    try {
      const response = await apiPost(`/api/businesses/${business.id}/invites/revoke/`, {
        invite_id: inviteId,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || `Failed to revoke item (${response.status})`);
      }

      toast.success("Entry revoked.");
      await loadAll();
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Failed to revoke entry.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const approveRequest = async (invite) => {
    const roleId = approveRoleMap[invite.id];

    if (!roleId) {
      toast.warning("Choose a role before approval.");
      return;
    }

    setActionLoadingId(invite.id);

    try {
      const response = await apiPost(`/api/businesses/${business.id}/invites/approve/`, {
        invite_id: invite.id,
        role_id: roleId,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || `Failed to approve request (${response.status})`);
      }

      toast.success("Request approved.");
      await loadAll();

      if (typeof refreshWorkspaceContext === "function") {
        await refreshWorkspaceContext();
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Failed to approve request.");
    } finally {
      setActionLoadingId(null);
    }
  };

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
                    <Mail size={34} />
                  </div>
                </div>

                <div className="profile-header-copy min-w-0">
                  <p className="profile-header-username truncate">
                    @{isWorkspaceMode ? business?.slug || "workspace" : "account"}
                  </p>
                  <p className="profile-header-email truncate">
                    {headerTitle} · {headerSubtitle}
                  </p>
                </div>
              </div>
            </div>

            <div className="overview-hero-action">
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                {quickActions.map((item) => (
                  <Button
                    key={item.title}
                    type="button"
                    variant={item.title === "Refresh" ? "secondary" : "primary"}
                    size="md"
                    emphasis="medium"
                    onClick={item.onClick}
                    disabled={item.disabled}
                  >
                    <span className="inline-flex items-center gap-2">
                      <item.icon size={16} />
                      {item.title}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="overview-status-strip" aria-label="Invitation status">
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

        <div className="overview-main-grid">
          <Card
            variant="default"
            padding="sm"
            contentSpacing="sm"
            className="card-rect"
          >
            <CardHeader title="Actions" className="overview-section-header" />
            <CardContent className="overview-nav-grid">
              {quickActions.map((item, index) => (
                <NavigationCard
                  key={item.title}
                  index={index}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  meta={item.meta}
                  onClick={item.onClick}
                  disabled={item.disabled}
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
            <CardHeader title="Summary" className="overview-section-header" />
            <CardContent className="overview-checklist">
              <SummaryRow
                label="View mode"
                value={isWorkspaceMode ? "Workspace" : "Account"}
                done
              />
              <SummaryRow
                label="Pending entries"
                value={String(pendingCount)}
                done={pendingCount > 0}
              />
              <SummaryRow
                label="Invite rights"
                value={canInvite ? "Allowed" : isWorkspaceMode ? "Restricted" : "Available"}
                done={canInvite || isAccountMode}
              />
              <SummaryRow
                label="Role source"
                value={isWorkspaceMode ? `${roles.length} roles loaded` : "Not required"}
                done={isAccountMode || roles.length > 0}
              />
            </CardContent>
          </Card>
        </div>

        {isAccountMode ? (
          <div className="overview-main-grid">
            <Card
              variant="default"
              padding="sm"
              contentSpacing="sm"
              className="card-rect"
            >
              <CardHeader title="Incoming invites" className="overview-section-header" />
              <CardContent className="overview-checklist">
                {loading ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500 dark:border-[#323232] dark:text-gray-400">
                    Loading incoming invites...
                  </div>
                ) : incomingInvites.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500 dark:border-[#323232] dark:text-gray-400">
                    No incoming invites.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incomingInvites.map((invite) => {
                      const isBusy = actionLoadingId === invite.id;
                      return (
                        <div key={invite.id} className="rounded-2xl border px-4 py-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold">
                                {getBusinessLabel(invite)}
                              </div>
                              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Role: {getRoleLabel(invite)}
                              </div>
                              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Delivery: {getDeliveryLabel(invite)}
                              </div>
                              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Created: {formatDate(invite.created_at)}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border px-3 py-1 text-xs capitalize">
                                {invite.status}
                              </span>

                              {invite.status === "pending" ? (
                                <>
                                  <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    onClick={() => acceptInvite(invite)}
                                    disabled={isBusy}
                                  >
                                    <span className="inline-flex items-center gap-2">
                                      <CheckCircle2 size={14} />
                                      Accept
                                    </span>
                                  </Button>

                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => declineInvite(invite.id)}
                                    disabled={isBusy}
                                  >
                                    Decline
                                  </Button>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card
              variant="default"
              padding="sm"
              contentSpacing="sm"
              className="card-rect"
            >
              <CardHeader title="My access requests" className="overview-section-header" />
              <CardContent className="overview-checklist">
                {loading ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500 dark:border-[#323232] dark:text-gray-400">
                    Loading request status...
                  </div>
                ) : myRequests.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500 dark:border-[#323232] dark:text-gray-400">
                    No access requests yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myRequests.map((invite) => (
                      <div key={invite.id} className="rounded-2xl border px-4 py-4">
                        <div className="text-sm font-semibold">
                          {getBusinessLabel(invite)}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Status: {invite.status}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Created: {formatDate(invite.created_at)}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Assigned role: {getRoleLabel(invite)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="overview-main-grid">
            <Card
              variant="default"
              padding="sm"
              contentSpacing="sm"
              className="card-rect"
            >
              <CardHeader title="Direct invites" className="overview-section-header" />
              <CardContent className="overview-checklist">
                {loading ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500 dark:border-[#323232] dark:text-gray-400">
                    Loading direct invites...
                  </div>
                ) : workspaceDirectInvites.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500 dark:border-[#323232] dark:text-gray-400">
                    No direct invites yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workspaceDirectInvites.map((invite) => {
                      const isBusy = actionLoadingId === invite.id;
                      return (
                        <div key={invite.id} className="rounded-2xl border px-4 py-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold">
                                {getTargetLabel(invite)}
                              </div>
                              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Role: {getRoleLabel(invite)}
                              </div>
                              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Delivery: {getDeliveryLabel(invite)}
                              </div>
                              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Created: {formatDate(invite.created_at)}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border px-3 py-1 text-xs capitalize">
                                {invite.status}
                              </span>

                              {canInvite && invite.status === "pending" ? (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => revokeItem(invite.id)}
                                  disabled={isBusy}
                                >
                                  Revoke
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card
              variant="default"
              padding="sm"
              contentSpacing="sm"
              className="card-rect"
            >
              <CardHeader title="Access requests to approve" className="overview-section-header" />
              <CardContent className="overview-checklist">
                {loading ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500 dark:border-[#323232] dark:text-gray-400">
                    Loading access requests...
                  </div>
                ) : workspaceAccessRequests.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500 dark:border-[#323232] dark:text-gray-400">
                    No access requests to approve.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workspaceAccessRequests.map((invite) => {
                      const isBusy = actionLoadingId === invite.id;
                      return (
                        <div key={invite.id} className="rounded-2xl border px-4 py-4">
                          <div className="flex flex-col gap-4">
                            <div>
                              <div className="text-sm font-semibold">
                                {getTargetLabel(invite)}
                              </div>
                              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Status: {invite.status}
                              </div>
                              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Created: {formatDate(invite.created_at)}
                              </div>
                            </div>

                            {invite.status === "pending" ? (
                              <>
                                <div>
                                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    Assign role before approval
                                  </label>
                                  <select
                                    value={approveRoleMap[invite.id] || ""}
                                    onChange={(event) =>
                                      handleApproveRoleChange(invite.id, event.target.value)
                                    }
                                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1F75FE] dark:border-[#323232] dark:bg-[#1f1f1f] dark:text-gray-100"
                                  >
                                    <option value="">Choose role</option>
                                    {roles.map((role) => (
                                      <option key={role.id} value={role.id}>
                                        {role.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    onClick={() => approveRequest(invite)}
                                    disabled={isBusy}
                                  >
                                    <span className="inline-flex items-center gap-2">
                                      <Check size={14} />
                                      Approve
                                    </span>
                                  </Button>

                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => revokeItem(invite.id)}
                                    disabled={isBusy}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Assigned role: {getRoleLabel(invite)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isInviteOpen && isWorkspaceMode ? (
          <motion.div
            className="profile-edit-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeInviteModal}
          >
            <motion.div
              className="profile-edit-panel"
              initial={{ opacity: 0, y: -28, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.985 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="profile-edit-panel-header">
                <div className="profile-edit-panel-copy">
                  <h2 className="profile-edit-panel-title">Invite member</h2>
                  <p className="profile-edit-panel-subtitle">
                    Resolve the target first, then assign the role and send the invite.
                  </p>
                </div>

                <button
                  type="button"
                  className="profile-edit-close"
                  onClick={closeInviteModal}
                  aria-label="Close invite popup"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="profile-edit-panel-body">
                <Form onSubmit={submitInvite} spacing="md">
                  <FormSection title="Invite method">
                    <FormRow>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Search by
                      </label>
                      <select
                        name="targetType"
                        value={inviteForm.targetType}
                        onChange={handleInviteChange}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1F75FE] dark:border-[#323232] dark:bg-[#1f1f1f] dark:text-gray-100"
                      >
                        <option value="email">Email</option>
                        <option value="username">Username</option>
                        <option value="user_id">User ID</option>
                      </select>
                    </FormRow>

                    {inviteForm.targetType === "email" ? (
                      <FormRow>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          label="Enter email"
                          value={inviteForm.email}
                          onChange={handleInviteChange}
                          placeholder="member@example.com"
                          size="lg"
                        />
                      </FormRow>
                    ) : null}

                    {inviteForm.targetType === "username" ? (
                      <FormRow>
                        <Input
                          id="username"
                          name="username"
                          type="text"
                          label="Enter username"
                          value={inviteForm.username}
                          onChange={handleInviteChange}
                          placeholder="kajotz"
                          size="lg"
                        />

                        {userSearching ? (
                          <div className="mt-2 rounded-2xl border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-500 dark:border-[#323232] dark:text-gray-400">
                            Searching users...
                          </div>
                        ) : inviteForm.username.trim() && !selectedUser ? (
                          <ResolverResults
                            items={userResults}
                            emptyText="No matching users found."
                            getKey={(item) => item.id}
                            getLabel={(item) => item.username}
                            onSelect={handleSelectUser}
                          />
                        ) : null}

                        {selectedUser ? (
                          <ResolverPreview
                            title="Resolved user"
                            rows={[
                              { label: "Username", value: selectedUser.username },
                              { label: "User ID", value: selectedUser.id },
                            ]}
                          />
                        ) : null}
                      </FormRow>
                    ) : null}

                    {inviteForm.targetType === "user_id" ? (
                      <FormRow>
                        <Input
                          id="user_id"
                          name="user_id"
                          type="text"
                          label="Enter user ID"
                          value={inviteForm.user_id}
                          onChange={handleInviteChange}
                          placeholder="User ID"
                          size="lg"
                        />

                        {userSearching ? (
                          <div className="mt-2 rounded-2xl border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-500 dark:border-[#323232] dark:text-gray-400">
                            Resolving user...
                          </div>
                        ) : inviteForm.user_id.trim() && !selectedUser ? (
                          <ResolverResults
                            items={userResults}
                            emptyText="No matching users found."
                            getKey={(item) => item.id}
                            getLabel={(item) => `${item.username} · ${item.id}`}
                            onSelect={handleSelectUser}
                          />
                        ) : null}

                        {selectedUser ? (
                          <ResolverPreview
                            title="Resolved user"
                            rows={[
                              { label: "Username", value: selectedUser.username },
                              { label: "User ID", value: selectedUser.id },
                            ]}
                          />
                        ) : null}
                      </FormRow>
                    ) : null}

                    <FormRow>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Assign role
                      </label>
                      <select
                        name="role_id"
                        value={inviteForm.role_id}
                        onChange={handleInviteChange}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1F75FE] dark:border-[#323232] dark:bg-[#1f1f1f] dark:text-gray-100"
                      >
                        <option value="">Choose role</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </FormRow>
                  </FormSection>

                  <FormActions className="profile-edit-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      emphasis="medium"
                      onClick={closeInviteModal}
                      disabled={inviteSubmitting}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      emphasis="medium"
                      disabled={inviteSubmitting}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Send size={16} />
                        {inviteSubmitting ? "Sending..." : "Send Invite"}
                      </span>
                    </Button>
                  </FormActions>
                </Form>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isRequestOpen && isAccountMode ? (
          <motion.div
            className="profile-edit-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeRequestModal}
          >
            <motion.div
              className="profile-edit-panel"
              initial={{ opacity: 0, y: -28, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.985 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="profile-edit-panel-header">
                <div className="profile-edit-panel-copy">
                  <h2 className="profile-edit-panel-title">Request access</h2>
                  <p className="profile-edit-panel-subtitle">
                    Resolve the business first, then send the request.
                  </p>
                </div>

                <button
                  type="button"
                  className="profile-edit-close"
                  onClick={closeRequestModal}
                  aria-label="Close request popup"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="profile-edit-panel-body">
                <Form onSubmit={submitRequest} spacing="md">
                  <FormSection title="Business search">
                    <FormRow>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Search by
                      </label>
                      <select
                        name="searchType"
                        value={requestForm.searchType}
                        onChange={handleRequestChange}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1F75FE] dark:border-[#323232] dark:bg-[#1f1f1f] dark:text-gray-100"
                      >
                        <option value="business_name">Business name</option>
                        <option value="business_id">Business ID</option>
                      </select>
                    </FormRow>

                    {requestForm.searchType === "business_name" ? (
                      <FormRow>
                        <Input
                          id="business_name"
                          name="business_name"
                          type="text"
                          label="Enter business name"
                          value={requestForm.business_name}
                          onChange={handleRequestChange}
                          placeholder="teedhub-store"
                          size="lg"
                        />

                        {businessSearching ? (
                          <div className="mt-2 rounded-2xl border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-500 dark:border-[#323232] dark:text-gray-400">
                            Searching businesses...
                          </div>
                        ) : requestForm.business_name.trim() && !selectedBusiness ? (
                          <ResolverResults
                            items={businessResults}
                            emptyText="No matching businesses found."
                            getKey={(item) => item.id}
                            getLabel={(item) => item.name}
                            onSelect={handleSelectBusiness}
                          />
                        ) : null}

                        {selectedBusiness ? (
                          <ResolverPreview
                            title="Resolved business"
                            rows={[
                              { label: "Business", value: selectedBusiness.name },
                              { label: "Business ID", value: selectedBusiness.id },
                            ]}
                          />
                        ) : null}
                      </FormRow>
                    ) : null}

                    {requestForm.searchType === "business_id" ? (
                      <FormRow>
                        <Input
                          id="business_id"
                          name="business_id"
                          type="text"
                          label="Enter business ID"
                          value={requestForm.business_id}
                          onChange={handleRequestChange}
                          placeholder="UUID"
                          size="lg"
                        />

                        {businessSearching ? (
                          <div className="mt-2 rounded-2xl border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-500 dark:border-[#323232] dark:text-gray-400">
                            Resolving business...
                          </div>
                        ) : requestForm.business_id.trim() && !selectedBusiness ? (
                          <ResolverResults
                            items={businessResults}
                            emptyText="No matching businesses found."
                            getKey={(item) => item.id}
                            getLabel={(item) => `${item.name} · ${item.id}`}
                            onSelect={handleSelectBusiness}
                          />
                        ) : null}

                        {selectedBusiness ? (
                          <ResolverPreview
                            title="Resolved business"
                            rows={[
                              { label: "Business", value: selectedBusiness.name },
                              { label: "Business ID", value: selectedBusiness.id },
                            ]}
                          />
                        ) : null}
                      </FormRow>
                    ) : null}
                  </FormSection>

                  <FormActions className="profile-edit-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      emphasis="medium"
                      onClick={closeRequestModal}
                      disabled={requestSubmitting}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      emphasis="medium"
                      disabled={requestSubmitting}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Search size={16} />
                        {requestSubmitting ? "Sending..." : "Send Request"}
                      </span>
                    </Button>
                  </FormActions>
                </Form>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}