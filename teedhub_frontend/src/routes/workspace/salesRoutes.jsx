import InventoryPage from "@/pages/workspace/sales/InventoryPage";

export const salesRoutes = [
  {
    path: "sales",
    handle: { title: "Sales" },
    children: [
      {
        path: "inventory",
        handle: { title: "Inventory" },
        element: <InventoryPage />,
      },
      {
        path: "inventory/products",
        handle: { title: "Products" },
        // plug ProductsPage here when ready
      },
      {
        path: "inventory/adjustments",
        handle: { title: "Stock Adjustments" },
        // plug AdjustmentsPage here when ready
      },
    ],
  },
];