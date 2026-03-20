import "./assets/main.css";
import "./App.css";
import { useTranslation } from "react-i18next";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import { useEffect } from "react";

// Pages - Landing
import Home from "./pages/Home";

// Pages - Auth
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Recovery from "./pages/auth/Recovery";

// Pages - Profile
import Profile from "./pages/profile/Profile";
import UserProfilePage from "./pages/profile/UserProfilePage";

// Pages - Business
import CreateBusinessPage from "./pages/business/CreateBusinessPage";
import BusinessWorkspace from "./pages/business/BusinessWorkspace";
import BusinessOverview from "./pages/business/workspace/BusinessOverview";
import BusinessCustomize from "./pages/business/workspace/BusinessCustomize";

function App() {
  const { i18n } = useTranslation();

  // Set up language change listener
  useEffect(() => {
    const handleLanguageChange = (event) => {
      i18n.changeLanguage(event.detail);
    };
    window.addEventListener('changeLanguage', handleLanguageChange);
    return () => window.removeEventListener('changeLanguage', handleLanguageChange);
  }, [i18n]);

  return (
    <Router>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/recover" element={<Recovery />} />
          <Route path="/profile-old" element={<Profile />} />
          
          {/* Protected Routes - User Profile */}
          <Route path="/profile" element={<UserProfilePage />} />
          
          {/* Protected Routes - Business */}
          <Route path="/business/create" element={<CreateBusinessPage />} />
          
          {/* Protected Routes - Business Workspace (Tenant-Scoped Layout) */}
          <Route path="/business/:businessId" element={<BusinessWorkspace />}>
            <Route path="overview" element={<BusinessOverview />} />
            <Route path="customize" element={<BusinessCustomize />} />
            {/* Future routes: sales, analytics, members, social, settings */}
          </Route>
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;





