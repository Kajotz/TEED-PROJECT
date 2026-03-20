import React, { useState, useEffect } from "react";
import { Sun, Moon, Menu, ChevronRight, X, User } from "lucide-react";

export default function Layout({ children }) {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState(null);
  const [language, setLanguage] = useState("en");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Fetch user info when component mounts
  useEffect(() => {
    fetchUser();
  }, []);

  // Listen for logout event and clear user state
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
    };
    window.addEventListener('logout', handleLogout);
    return () => window.removeEventListener('logout', handleLogout);
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        return;
      }

      const resp = await fetch("http://localhost:8000/dj-rest-auth/user/", {
        headers: { Authorization: `Bearer ${token}` },
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

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    window.dispatchEvent(new CustomEvent("changeLanguage", { detail: lang }));
  };

  const getInitials = (email) => {
    return email.substring(0, 2).toUpperCase();
  };

  const navigationItems = {
    products: {
      title: "Products",
      items: [
        { name: "Payments", desc: "Accept payments globally" },
        { name: "Billing", desc: "Automate your billing" },
        { name: "Connect", desc: "Send payouts worldwide" },
        { name: "Analytics", desc: "Real-time insights" },
      ],
    },
    resources: {
      title: "Resources",
      items: [
        { name: "Documentation", desc: "API guides and docs" },
        { name: "Tutorials", desc: "Video tutorials" },
        { name: "Blog", desc: "Latest news" },
        { name: "Support", desc: "Contact support" },
      ],
    },
    company: {
      title: "Company",
      items: [
        { name: "About", desc: "About TEED Hub" },
        { name: "Careers", desc: "Join our team" },
        { name: "Press", desc: "Press kit" },
        { name: "Partners", desc: "Become a partner" },
      ],
    },
  };

  return (
    <>
      {/* HEADER - Full Width Independent */}
      <header className="fixed top-0 left-0 right-0 w-full bg-white dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-[#3A3A3A] z-50 transition-colors duration-300 m-0 p-0">
        <div className="my-0 mx-4 sm:mx-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Logo */}
            <div className="flex-shrink-0">
           <a
              href="/"
              className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight"
  >
              <span style={{ color: '#1F75FE' }}>Teed</span>
               <span style={{ color: '#f2a705' }}>Hub</span>
           </a>
         </div>


            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center justify-center gap-6 xl:gap-8 font-medium flex-1">
              <a
                href="/"
                className="text-[#1E1E1E] dark:text-[#D4D4D4] hover:text-[#1F75FE] dark:hover:text-[#1F75FE] transition-colors duration-200 text-sm"
              >
                Home
              </a>

              {/* Products Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-1 text-[#1E1E1E] dark:text-[#D4D4D4] hover:text-[#1F75FE] dark:hover:text-[#1F75FE] transition-colors duration-200 text-sm">
                  Products
                  <ChevronRight size={14} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 mt-0 w-96 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3A3A3A] rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      {navigationItems.products.items.map((item, idx) => (
                        <a
                          key={idx}
                          href="#"
                          className="group/item p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors"
                        >
                          <div className="font-medium text-[#1E1E1E] dark:text-[#D4D4D4] text-sm group-hover/item:text-[#1F75FE]">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {item.desc}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Resources Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-1 text-[#1E1E1E] dark:text-[#D4D4D4] hover:text-[#1F75FE] dark:hover:text-[#1F75FE] transition-colors duration-200 text-sm">
                  Resources
                  <ChevronRight size={14} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 mt-0 w-96 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3A3A3A] rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      {navigationItems.resources.items.map((item, idx) => (
                        <a
                          key={idx}
                          href="#"
                          className="group/item p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors"
                        >
                          <div className="font-medium text-[#1E1E1E] dark:text-[#D4D4D4] text-sm group-hover/item:text-[#1F75FE]">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {item.desc}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <a
                href="/dashboard"
                className="text-[#1E1E1E] dark:text-[#D4D4D4] hover:text-[#1F75FE] dark:hover:text-[#1F75FE] transition-colors duration-200 text-sm"
              >
                Dashboard
              </a>

              {/* Company Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-1 text-[#1E1E1E] dark:text-[#D4D4D4] hover:text-[#1F75FE] dark:hover:text-[#1F75FE] transition-colors duration-200 text-sm">
                  Company
                  <ChevronRight size={14} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 mt-0 w-96 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3A3A3A] rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      {navigationItems.company.items.map((item, idx) => (
                        <a
                          key={idx}
                          href="#"
                          className="group/item p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors"
                        >
                          <div className="font-medium text-[#1E1E1E] dark:text-[#D4D4D4] text-sm group-hover/item:text-[#1F75FE]">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {item.desc}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
              <div className="hidden lg:flex items-center gap-2 md:gap-3">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#3A3A3A] transition-colors flex-shrink-0"
                >
                  {darkMode ? (
                    <Sun size={16} className="text-yellow-400" />
                  ) : (
                    <Moon size={16} className="text-[#1E1E1E]" />
                  )}
                </button>

                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="border border-gray-300 dark:border-[#3A3A3A] rounded-md px-2 py-1 text-xs bg-white dark:bg-[#1E1E1E] text-[#1E1E1E] dark:text-[#D4D4D4] cursor-pointer flex-shrink-0"
                >
                  <option value="en">EN</option>
                  <option value="sw">SW</option>
                </select>

                {!loading && user ? (
                  <button
                    onClick={() => window.location.href = "/profile"}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1F75FE] to-blue-600 text-white font-bold flex items-center justify-center hover:shadow-lg transition-shadow duration-200 cursor-pointer flex-shrink-0"
                    title={user.email}
                  >
                    {getInitials(user.email)}
                  </button>
                ) : !loading ? (
                  <a
                    href="/login"
                    className="bg-[#1F75FE] hover:bg-[#1F75FE]/90 text-white px-4 py-1.5 rounded-md transition-colors duration-200 font-medium text-sm whitespace-nowrap flex-shrink-0"
                  >
                    Sign In
                  </a>
                ) : null}
              </div>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="lg:hidden p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#3A3A3A] transition-colors flex-shrink-0"
              >
                {darkMode ? (
                  <Sun size={16} className="text-yellow-400" />
                ) : (
                  <Moon size={16} className="text-[#1E1E1E]" />
                )}
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(!mobileMenuOpen);
                  setMobileSubmenuOpen(null);
                }}
                className="lg:hidden p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-[#3A3A3A] transition-colors flex-shrink-0"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-3 pb-3 border-t border-gray-200 dark:border-[#3A3A3A] pt-3">
              <div className="flex flex-col space-y-1">
                <a
                  href="/"
                  className="text-[#1E1E1E] dark:text-[#D4D4D4] hover:text-[#1F75FE] transition-colors duration-200 block py-2 px-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-[#3A3A3A]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </a>

                {mobileSubmenuOpen !== "products" ? (
                  <button
                    onClick={() => setMobileSubmenuOpen("products")}
                    className="w-full text-left text-[#1E1E1E] dark:text-[#D4D4D4] hover:text-[#1F75FE] transition-colors duration-200 py-2 px-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-[#3A3A3A] flex items-center justify-between"
                  >
                    <span>Products</span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <div className="fixed inset-0 z-50 animate-slide-in">
                    <div className="w-full h-full bg-white dark:bg-[#252526] overflow-y-auto">
                      <div className="px-3 sm:px-5 md:px-8 lg:px-12 py-4">
                        <button
                          onClick={() => setMobileSubmenuOpen(null)}
                          className="flex items-center gap-2 text-[#1F75FE] hover:text-[#155fca] transition-colors mb-6 text-sm"
                        >
                          <ChevronRight size={16} className="rotate-180" />
                          Back
                        </button>

                        <h3 className="text-lg font-semibold text-[#1E1E1E] dark:text-[#D4D4D4] mb-4">
                          Products
                        </h3>

                        <div className="space-y-3">
                          {navigationItems.products.items.map((item, idx) => (
                            <a
                              key={idx}
                              href="#"
                              className="block p-3 rounded-lg bg-gray-50 dark:bg-[#1E1E1E] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors"
                              onClick={() => {
                                setMobileSubmenuOpen(null);
                                setMobileMenuOpen(false);
                              }}
                            >
                              <div className="font-medium text-[#1E1E1E] dark:text-[#D4D4D4] text-sm">
                                {item.name}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {item.desc}
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {mobileSubmenuOpen !== "resources" ? (
                  <button
                    onClick={() => setMobileSubmenuOpen("resources")}
                    className="w-full text-left text-[#1E1E1E] dark:text-[#D4D4D4] hover:text-[#1F75FE] transition-colors duration-200 py-2 px-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-[#3A3A3A] flex items-center justify-between"
                  >
                    <span>Resources</span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <div className="fixed inset-0 z-50 animate-slide-in">
                    <div className="w-full h-full bg-white dark:bg-[#252526] overflow-y-auto">
                      <div className="px-3 sm:px-5 md:px-8 lg:px-12 py-4">
                        <button
                          onClick={() => setMobileSubmenuOpen(null)}
                          className="flex items-center gap-2 text-[#1F75FE] hover:text-[#155fca] transition-colors mb-6 text-sm"
                        >
                          <ChevronRight size={16} className="rotate-180" />
                          Back
                        </button>

                        <h3 className="text-lg font-semibold text-[#1E1E1E] dark:text-[#D4D4D4] mb-4">
                          Resources
                        </h3>

                        <div className="space-y-3">
                          {navigationItems.resources.items.map((item, idx) => (
                            <a
                              key={idx}
                              href="#"
                              className="block p-3 rounded-lg bg-gray-50 dark:bg-[#1E1E1E] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors"
                              onClick={() => {
                                setMobileSubmenuOpen(null);
                                setMobileMenuOpen(false);
                              }}
                            >
                              <div className="font-medium text-[#1E1E1E] dark:text-[#D4D4D4] text-sm">
                                {item.name}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {item.desc}
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <a
                  href="/dashboard"
                  className="text-[#1E1E1E] dark:text-[#D4D4D4] hover:text-[#1F75FE] transition-colors duration-200 block py-2 px-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-[#3A3A3A]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </a>

                {mobileSubmenuOpen !== "company" ? (
                  <button
                    onClick={() => setMobileSubmenuOpen("company")}
                    className="w-full text-left text-[#1E1E1E] dark:text-[#D4D4D4] hover:text-[#1F75FE] transition-colors duration-200 py-2 px-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-[#3A3A3A] flex items-center justify-between"
                  >
                    <span>Company</span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <div className="fixed inset-0 z-50 animate-slide-in">
                    <div className="w-full h-full bg-white dark:bg-[#252526] overflow-y-auto">
                      <div className="px-3 sm:px-5 md:px-8 lg:px-12 py-4">
                        <button
                          onClick={() => setMobileSubmenuOpen(null)}
                          className="flex items-center gap-2 text-[#1F75FE] hover:text-[#155fca] transition-colors mb-6 text-sm"
                        >
                          <ChevronRight size={16} className="rotate-180" />
                          Back
                        </button>

                        <h3 className="text-lg font-semibold text-[#1E1E1E] dark:text-[#D4D4D4] mb-4">
                          Company
                        </h3>

                        <div className="space-y-3">
                          {navigationItems.company.items.map((item, idx) => (
                            <a
                              key={idx}
                              href="#"
                              className="block p-3 rounded-lg bg-gray-50 dark:bg-[#1E1E1E] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors"
                              onClick={() => {
                                setMobileSubmenuOpen(null);
                                setMobileMenuOpen(false);
                              }}
                            >
                              <div className="font-medium text-[#1E1E1E] dark:text-[#D4D4D4] text-sm">
                                {item.name}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {item.desc}
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <a
                  href="/contact"
                  className="text-[#1E1E1E] dark:text-[#D4D4D4] hover:text-[#1F75FE] transition-colors duration-200 block py-2 px-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-[#3A3A3A]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact Us
                </a>

                {!loading && user && (
                  <button
                    onClick={() => {
                      window.location.href = "/profile";
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left text-[#1E1E1E] dark:text-[#D4D4D4] hover:text-[#1F75FE] transition-colors duration-200 py-2 px-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-[#3A3A3A] flex items-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1F75FE] to-blue-600 text-white font-bold flex items-center justify-center text-xs">
                      {getInitials(user.email)}
                    </div>
                    <span>My Profile</span>
                  </button>
                )}

                {!loading && !user && (
                  <a
                    href="/login"
                    className="w-full text-center bg-[#1F75FE] hover:bg-[#1F75FE]/90 text-white px-4 py-2 rounded-md transition-colors duration-200 font-medium text-sm block"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </a>
                )}

                <div className="pt-3 border-t border-gray-200 dark:border-[#3A3A3A]">
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1.5">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="w-full border border-gray-300 dark:border-[#3A3A3A] rounded-md px-2 py-1 text-xs bg-white dark:bg-[#1E1E1E] text-[#1E1E1E] dark:text-[#D4D4D4] cursor-pointer"
                  >
                    <option value="en">English</option>
                    <option value="sw">Swahili</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

 <main className="w-full mx-auto bg-white dark:bg-[#1E1E1E] transition-colors duration-300 pt-16 sm:pt-20">
    {children}
</main>



      {/* FOOTER - Full Width Independent */}
      <footer className="w-full bg-white dark:bg-[#1E1E1E] border-t border-gray-200 dark:border-[#3A3A3A] text-[#1E1E1E] dark:text-[#D4D4D4] py-3 sm:py-4 text-xs sm:text-sm transition-colors duration-300">
        <div className="">
          © {new Date().getFullYear()}{" "}
          <span className="font-semibold text-[#1F75FE]">TEED Hub</span>. All
          rights reserved.
        </div>
      </footer>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}