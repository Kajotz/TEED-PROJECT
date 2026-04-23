import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Loader2,
  Repeat,
  ShieldCheck,
} from "lucide-react";

import AuthLayout from "@/components/layouts/AuthLayout";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

import { apiGet, apiPost } from "@/utils/api";
import {
  useAuthState,
  notifyAuthStateChanged,
} from "@/context/AuthStateContext";

import "@/styles/AccountShell/SwitchBusinessPage.css";

export default function SwitchBusinessPage() {
  const navigate = useNavigate();
  const { authState, refreshAuthState } = useAuthState();

  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [switchingId, setSwitchingId] = useState(null);
  const [error, setError] = useState("");

  const activeBusinessId = authState?.active_business_id || null;

  const handleSwitch = useCallback(
    async (businessId, options = {}) => {
      const { silent = false, force = false } = options;

      if (!businessId || switchingId) return;

      if (!force && businessId === activeBusinessId) {
        navigate(`/business/${businessId}`, { replace: true });
        return;
      }

      setSwitchingId(businessId);
      setError("");

      try {
        const response = await apiPost(
          `/api/businesses/${businessId}/activate/`,
          {}
        );

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(
            data?.detail || `Failed to switch (${response.status})`
          );
        }

        notifyAuthStateChanged();
        await refreshAuthState();

        navigate(`/business/${businessId}`, { replace: true });
      } catch (err) {
        console.error("Switch failed:", err);

        if (!silent) {
          setError(err?.message || "Failed to switch business.");
        }
      } finally {
        setSwitchingId(null);
      }
    },
    [activeBusinessId, navigate, refreshAuthState, switchingId]
  );

  useEffect(() => {
    const loadBusinesses = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await apiGet("/api/businesses/");

        if (!response.ok) {
          throw new Error(`Failed to load businesses (${response.status})`);
        }

        const data = await response.json();
        const items = Array.isArray(data) ? data : data?.results || [];

        setBusinesses(items);

        if (items.length === 0) {
          navigate("/account/create-business", { replace: true });
          return;
        }

        if (items.length === 1) {
          await handleSwitch(items[0].id, { silent: true, force: true });
          return;
        }
      } catch (err) {
        console.error("Failed to load businesses:", err);
        setError(err?.message || "Failed to load businesses.");
      } finally {
        setLoading(false);
      }
    };

    loadBusinesses();
  }, [handleSwitch, navigate]);

  const sortedBusinesses = useMemo(() => {
    return [...businesses].sort((a, b) => {
      if (a.id === activeBusinessId) return -1;
      if (b.id === activeBusinessId) return 1;
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
  }, [businesses, activeBusinessId]);

  return (
    <AuthLayout>
      <div className="switch-business-page">
        <div className="switch-business-page__inner">
          <div className="switch-business-page__hero">
            <div className="switch-business-page__top-bar">
              <button
                type="button"
                onClick={() => navigate("/account/home")}
                className="switch-business-page__back-btn"
              >
                <ArrowLeft size={16} />
                <span>Back to account home</span>
              </button>
            </div>

            <div className="switch-business-page__hero-icon">
              <Repeat size={24} />
            </div>

            <div className="switch-business-page__hero-copy">
              <h1>Choose a business workspace</h1>
              <p>
                Select the business you want to operate in and go straight into
                its workspace.
              </p>
            </div>
          </div>

          {error && (
            <div className="switch-business-page__alert" role="alert">
              {error}
            </div>
          )}

          {loading ? (
            <Card
              variant="soft"
              padding="xl"
              className="switch-business-page__loading-card"
            >
              <CardContent>
                <div className="switch-business-page__loading-state">
                  <Loader2 className="switch-business-page__spinner" />
                  <p>Loading your workspaces...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="switch-business-page__grid">
              {sortedBusinesses.map((business) => {
                const isActive = business.id === activeBusinessId;
                const isSwitching = switchingId === business.id;

                const roleText =
                  Array.isArray(business.roles) && business.roles.length > 0
                    ? business.roles.join(", ")
                    : "member";

                return (
                  <Card
                    key={business.id}
                    variant="soft"
                    padding="lg"
                    className="switch-business-page__card"
                  >
                    <CardHeader>
                      <div className="switch-business-page__card-top">
                        <div className="switch-business-page__card-icon">
                          <Building2 size={20} />
                        </div>

                        <div className="switch-business-page__card-head">
                          <h2>{business.name}</h2>

                          <div className="switch-business-page__badges">
                            <span className="switch-business-page__badge switch-business-page__badge--type">
                              {business.business_type || "business"}
                            </span>

                            {isActive && (
                              <span className="switch-business-page__badge switch-business-page__badge--active">
                                <CheckCircle2 size={12} />
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="switch-business-page__card-body">
                        <div className="switch-business-page__role-box">
                          <div className="switch-business-page__role-label">
                            <ShieldCheck size={14} />
                            <span>Member role</span>
                          </div>

                          <p className="switch-business-page__role-text">
                            {roleText}
                          </p>
                        </div>

                        <div className="switch-business-page__button-wrap">
                          <Button
                            fullWidth
                            onClick={() => handleSwitch(business.id)}
                            disabled={isSwitching || switchingId !== null}
                            className="switch-business-page__button"
                          >
                            {isSwitching ? (
                              <span className="switch-business-page__button-content">
                                <Loader2
                                  size={14}
                                  className="switch-business-page__button-spinner"
                                />
                                Opening workspace...
                              </span>
                            ) : isActive ? (
                              "Open workspace"
                            ) : (
                              "Choose workspace"
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}