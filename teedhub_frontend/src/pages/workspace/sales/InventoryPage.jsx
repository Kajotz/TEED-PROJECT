import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  Package,
  Boxes,
  AlertTriangle,
  TrendingUp,
  Plus,
  X,
} from "lucide-react";

import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/button";
import Input from "@/components/ui/Input";
import Form, { FormRow, FormSection, FormActions } from "@/components/ui/Forms";
import TooltipPortal from "@/components/ui/tooltip/TooltipPortal";
import { useAppToast } from "@/components/ui/toast/AppToastProvider";
import { apiGet, apiPost } from "@/utils/api";

import "@/styles/global/GlobalUi.css";
import "@/styles/global/PopUpMenu.css";

/* ---------- STATUS PILL ---------- */
function StatusPill({ title, value, icon: Icon, tone = "blue" }) {
  return (
    <div className={`overview-status-pill overview-status-pill-${tone}`}>
      <div className="overview-status-pill-icon">
        <Icon size={14} />
      </div>
      <div className="overview-status-pill-body">
        <span className="overview-status-pill-label">{title}</span>
        <span className="overview-status-pill-value">{value}</span>
      </div>
    </div>
  );
}

/* ---------- NAV CARD ---------- */
function NavCard({ icon: Icon, title, description, onClick }) {
  return (
    <motion.button
      className="overview-nav-card"
      onClick={onClick}
      whileHover={{ y: -3 }}
    >
      <div className="overview-nav-card-main">
        <div className="overview-nav-card-icon">
          <Icon size={18} />
        </div>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
    </motion.button>
  );
}

export default function InventoryPage() {
  const navigate = useNavigate();
  const toast = useAppToast();
  const { business } = useOutletContext();

  const [products, setProducts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    selling_price: "",
    cost_price: "",
  });

  /* ---------- LOAD DATA ---------- */
  const fetchProducts = async () => {
  try {
    const res = await apiGet(
      `/api/businesses/${business.id}/inventory/products/`
    );
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : data.results || []);  // 👈 this line
  } catch {
    toast.error("Failed to load inventory");
  }
  };

  useEffect(() => {
    if (business?.id) fetchProducts();
  }, [business]);

  /* ---------- METRICS ---------- */
  const totalProducts = products.length;

  const totalStock = useMemo(
    () => products.reduce((acc, p) => acc + p.stock_quantity, 0),
    [products]
  );

  const lowStock = useMemo(
    () => products.filter((p) => p.is_low_stock).length,
    [products]
  );

  /* ---------- SUBMIT ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await apiPost(
        `/api/businesses/${business.id}/inventory/products/`,
        form
      );

      if (!res.ok) throw new Error();

      toast.success("Product created");
      setIsOpen(false);
      fetchProducts();
    } catch {
      toast.error("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <>
      <div className="account-overview-page">
        {/* HERO */}
        <Card className="overview-hero-card">
          <div className="overview-hero-row">
            <div>
              <h2>Inventory</h2>
              <p>Manage products, stock and tracking</p>
            </div>

            <Button onClick={() => setIsOpen(true)}>
              <Plus size={16} />
              Add Product
            </Button>
          </div>

          <div className="overview-status-strip">
            <StatusPill title="Products" value={totalProducts} icon={Package} />
            <StatusPill title="Stock" value={totalStock} icon={Boxes} />
            <StatusPill
              title="Low stock"
              value={lowStock}
              icon={AlertTriangle}
              tone="gold"
            />
          </div>
        </Card>

        {/* ACTIONS */}
        <div className="overview-main-grid">
          <Card>
            <CardHeader title="Inventory actions" />
            <CardContent className="overview-nav-grid">
              <NavCard
                icon={Package}
                title="Products"
                description="View and manage products"
                onClick={() =>
                  navigate(`/business/${business.id}/sales/inventory/products`)
                }
              />

              <NavCard
                icon={TrendingUp}
                title="Stock adjustments"
                description="Track stock changes"
                onClick={() =>
                  navigate(`/business/${business.id}/sales/inventory/adjustments`)
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* POPUP FORM */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="profile-edit-overlay"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="profile-edit-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="profile-edit-panel-header">
                <h2>Add product</h2>
                <button onClick={() => setIsOpen(false)}>
                  <X />
                </button>
              </div>

              <Form onSubmit={handleSubmit}>
                <FormSection title="Product info">
                  <FormRow>
                    <Input
                      name="name"
                      label="Product name"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />

                    <Input
                      name="selling_price"
                      label="Selling price"
                      value={form.selling_price}
                      onChange={(e) =>
                        setForm({ ...form, selling_price: e.target.value })
                      }
                    />
                  </FormRow>

                  <FormRow>
                    <Input
                      name="cost_price"
                      label="Cost price"
                      value={form.cost_price}
                      onChange={(e) =>
                        setForm({ ...form, cost_price: e.target.value })
                      }
                    />
                  </FormRow>
                </FormSection>

                <FormActions>
                  <Button type="button" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>

                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Create"}
                  </Button>
                </FormActions>
              </Form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}