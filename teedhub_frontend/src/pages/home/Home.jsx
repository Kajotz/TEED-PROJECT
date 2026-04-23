import React, { useEffect, useState } from "react";
import Header from "@/components/homeUI/Header";
import HeroSection from "@/components/homeUI/HeroSection";
import PlatformsSection from "@/components/homeUI/PlatformsSection";
import HeroLiquidCanvas from "@/components/homeUI/canvas/HeroLiquidCanvas";
import AuthStaticCanvas from "@/components/homeUI/canvas/AuthStaticCanvas";
import { useTheme } from "@/components/ui/theme/ThemeProvider";
import "@/styles/homeUI/Home.css";

export default function Home() {
  const { darkMode, toggleTheme } = useTheme();

  const [language, setLanguage] = useState("en");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 1024;
  });

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    const handleLogout = () => setUser(null);
    window.addEventListener("logout", handleLogout);

    return () => {
      window.removeEventListener("logout", handleLogout);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const handleViewportChange = (event) => {
      setIsDesktop(event.matches);
    };

    setIsDesktop(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleViewportChange);
    } else {
      mediaQuery.addListener(handleViewportChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleViewportChange);
      } else {
        mediaQuery.removeListener(handleViewportChange);
      }
    };
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setLoading(false);
        return;
      }

      const resp = await fetch("http://localhost:8000/dj-rest-auth/user/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resp.ok) {
        const data = await resp.json();
        setUser(data);
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="home-shared-shell">
        <div className="home-shared-shell__left-surface" aria-hidden="true" />

        <div
          className={`home-shared-shell__canvas-surface ${
            isDesktop
              ? "home-shared-shell__canvas-surface--desktop"
              : "home-shared-shell__canvas-surface--mobile"
          }`}
          aria-hidden="true"
        >
          {isDesktop ? (
            <HeroLiquidCanvas />
          ) : (
            <AuthStaticCanvas darkMode={darkMode} />
          )}
        </div>

        <div className="home-shared-shell__seam" aria-hidden="true" />

        <div className="home-shared-shell__content">
          <div className="home-page-shell">
            <div className="home-page-shell__section home-page-shell__section--header">
              <Header
                darkMode={darkMode}
                setDarkMode={toggleTheme}
                language={language}
                setLanguage={setLanguage}
                user={user}
                loading={loading}
              />
            </div>

            <main className="home-main">
              <section className="home-page-shell__section home-page-shell__section--hero">
                <HeroSection />
              </section>

              <section className="home-page-shell__section home-page-shell__section--platforms">
                <PlatformsSection />
              </section>
            </main>
          </div>
        </div>
      </div>

      <section className="bg-white py-24 dark:bg-[#111111]">
        <div
          style={{
            maxWidth: "72rem",
            margin: "0 auto",
            padding: "0 48px",
            textAlign: "center",
          }}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Everything your business needs
          </h2>
          <p
            className="text-gray-500 dark:text-gray-400"
            style={{
              maxWidth: "480px",
              margin: "16px auto 0",
              fontSize: "1rem",
              lineHeight: "1.75",
            }}
          >
            From sales and inventory to analytics and social growth — TEED Hub
            brings it all into one clean workspace.
          </p>
        </div>
      </section>

      <section className="bg-gray-50 py-24 dark:bg-[#181818]">
        <div
          style={{
            maxWidth: "72rem",
            margin: "0 auto",
            padding: "0 48px",
            textAlign: "center",
          }}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Built for real work
          </h2>
          <p
            className="text-gray-500 dark:text-gray-400"
            style={{
              maxWidth: "480px",
              margin: "16px auto 0",
              fontSize: "1rem",
              lineHeight: "1.75",
            }}
          >
            No bloat, no steep learning curves. Just the tools that matter,
            designed to move as fast as your team does.
          </p>
        </div>
      </section>

      <footer
        className="border-t border-gray-200 bg-white dark:border-[#2A2A2A] dark:bg-[#111111]"
        style={{ padding: "24px 48px" }}
      >
        <div
          style={{
            maxWidth: "72rem",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <a
              href="/pricing"
              className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Pricing
            </a>
            <a
              href="/company"
              className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Company
            </a>
            <a
              href="/resources"
              className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Resources
            </a>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} TEED Hub. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}