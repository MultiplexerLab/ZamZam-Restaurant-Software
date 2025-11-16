import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Layouts
import AdminLayout from "./AdminLayout";
import CashierLayout from "./CashierLayout";
import EmployeeLayout from "./EmployeeLayout";
import KitchenLayout from "./KitchenLayout";

// Pages
import Login from '../components/Login';
import TableLogin from '../components/TableLogin';
import Register from "../components/Register";
import Food from "../components/admin/Food";
import Branch from "../components/admin/Branch";
import OrderDetails from "../components/admin/OrderDetails";
import Category from '../components/admin/Cetegory';
import Employee from "../components/admin/Employee";
import Purchase from "../components/admin/Purchase";
import ProtectedRoute from '../components/ProtectedRoute';
import NotFound from '../components/NotFound';
import React from "react";
import Logout from "../components/Logout";
import CustomerMenu from "../components/customer/CustomerMenu";
import SetMenuFoods from "../components/admin/setmenu/SetMenuFoods";
import SetMenuV1 from "../components/admin/SetMenuV1";
import CashierOrderDashboard from "../components/admin/OrderDashboardV1";
import CashierSingleOrder from "../components/admin/CashierSingleOrder";
import TablePaymentPage from "../components/admin/TablePaymentPage";
import PaymentHistory from "../components/admin/PaymentHistory";
import PendingOrdersGrid from "../components/kitchen/PendingOrdersGrid";
import Invoice from "../components/Invoice";

export default function AppRouter() {
  const { user, loading } = useAuth(); // AuthContext must provide `loading` state

  // Show loading while auth state is being initialized
  if (loading) return <div className="text-center mt-5">Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/customer/login" element={<TableLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/invoice" element={<Invoice />} />

          <Route path="logout" element={
              <ProtectedRoute>
                  <Logout/>
              </ProtectedRoute>
          }/>

        {/* Admin Routes */}
        {user?.role === "admin" && (
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Branch />} />
            {/*<Route path="dashboard" element={<AdminDashboard />} />*/}
            <Route path="branch" element={<Branch />} />
            <Route path="category" element={<Category />} />
            <Route path="food" element={<Food />} />
            <Route path="setmenu" element={<SetMenuV1 />} />
            <Route path="setmenu-v1" element={<SetMenuV1 />} />
              <Route path="setmenu/:setmenu_id/:food_id" element={<SetMenuFoods />} />

              <Route path="purchase" element={
              <ProtectedRoute>
                <Purchase/>
              </ProtectedRoute>
            }/>

            <Route path="employee" element={
              <ProtectedRoute>
                <Employee/>
              </ProtectedRoute>
            }/>
          </Route>
        )}

        {/* Cashier Routes */}
        {user?.role === "cashier" && (
          <Route path="/cashier" element={<CashierLayout />}>
              <Route index element={<CashierOrderDashboard />} />
              <Route path="order" element={<CashierOrderDashboard />} />
              <Route path="order-details" element={<OrderDetails />} />
              {/* <Route path="order-detail" element={<CashierSingleOrder />} /> */}
              <Route path="payment" element={<TablePaymentPage />} />
              <Route path="payment-history" element={<PaymentHistory />} />
          </Route>
        )}
        {/* Employee Routes */}
        {user?.role === "employee" && (
          <Route path="" element={<EmployeeLayout />}>
            <Route index element={<CustomerMenu />} />
            <Route path='menu' element={<CustomerMenu />} />
          </Route>
        )}

      {/* Kitchen Routes */}
      {user?.role === "kichen" && (
        <Route path="" element={<KitchenLayout />}>
          <Route index element={<PendingOrdersGrid />} />
          <Route path="order-detail" element={<CashierSingleOrder />} />
        </Route>
      )}
        {/* Default Redirect */}
        <Route path="*" element={<Navigate to={user ? `/${user.role}` : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}
