import { useState, useEffect } from "react";
import { Clock, Calendar, Users, Eye, MessageCircle } from "lucide-react";

export default function Home() {
  const [time, setTime] = useState(new Date());
  const [followers, setFollowers] = useState(0);
  const [profileVisits, setProfileVisits] = useState(0);
  const [viewers, setViewers] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Animate counters on mount
  useEffect(() => {
    const animateCounter = (setValue, targetValue) => {
      let current = 0;
      const increment = Math.ceil(targetValue / 30);
      const interval = setInterval(() => {
        current += increment;
        if (current >= targetValue) {
          setValue(targetValue);
          clearInterval(interval);
        } else {
          setValue(current);
        }
      }, 50);
    };

    animateCounter(setFollowers, 12847);
    animateCounter(setProfileVisits, 3642);
    animateCounter(setViewers, 5291);
  }, []);

  const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative w-full bg-white dark:bg-[#252526] transition-colors duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] via-[#d946ef] via-[#ec4899] via-[#f97316] to-[#eab308] dark:from-[#4338ca] dark:via-[#7c3aed] dark:via-[#c026d3] dark:via-[#be123c] dark:to-[#a16207]"></div>
        
        {/* Animated lava blobs */}
        <div className="absolute inset-0">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-500/40 to-transparent blur-3xl animate-lava-blob-1" style={{top: '10%', left: '10%'}}></div>
          <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-br from-pink-500/40 to-transparent blur-3xl animate-lava-blob-2" style={{top: '60%', right: '10%'}}></div>
          <div className="absolute w-[700px] h-[700px] rounded-full bg-gradient-to-br from-orange-500/30 to-transparent blur-3xl animate-lava-blob-3" style={{top: '40%', left: '40%'}}></div>
          <div className="absolute w-[450px] h-[450px] rounded-full bg-gradient-to-br from-yellow-500/30 to-transparent blur-3xl animate-lava-blob-4" style={{bottom: '10%', left: '20%'}}></div>
        </div>
        
        <div className="flex flex-col lg:flex-row items-center justify-between px-4 sm:px-8 md:px-12 lg:px-16 py-0 gap-y-16 lg:gap-x-16 xl:gap-x-20 relative z-10 max-w-[100vw] w-full">
          {/* LEFT: Content (50%) */}
          <div
            className="flex-[0_0_50%] text-left z-10 opacity-0 animate-fadeInLeft max-w-[620px] mr-0 lg:mr-8"
            style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}
          >
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#1E1E1E] dark:text-[#D4D4D4] leading-tight mb-6 opacity-0 animate-slideUp"
              style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}
            >
              Build, Grow & Sell Online Safely
            </h1>

            <p
              className="text-lg sm:text-xl text-[#4A4A4A] dark:text-[#A0A0A0] mb-8 opacity-0 animate-slideUp"
              style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}
            >
              TEED Hub empowers African digital entrepreneurs with real tools to grow on social media, create ads that convert, manage payments securely, and scale their online business. No fluff—just what works.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-3 opacity-0 animate-slideUp"
              style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}
            >
              <a
                href="/login"
                className="px-5 py-2 rounded-md bg-[#1F75FE] text-white text-sm font-semibold hover:bg-[#155fca] transition-all duration-200 shadow-md hover:shadow-lg text-center"
              >
                Get Started Free
              </a>
              <a
                href="#features"
                className="px-5 py-2 rounded-md bg-[#f2a705] text-white text-sm font-semibold hover:bg-[#d98d04] transition-all duration-200 shadow-md hover:shadow-lg text-center"
              >
                Learn More
              </a>
            </div>


          </div>

          {/* RIGHT: Device Mockups (50%) */}
          <div
            className="w-full lg:flex-[0_0_50%] relative flex justify-center lg:justify-end items-center opacity-0 animate-fadeInRight mt-8 lg:mt-0 h-auto lg:h-[500px]"
            style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}
          >
            {/* Monitor Mockup */}
            <div className="relative w-[300px] lg:w-[560px] h-[240px] lg:h-[440px] bg-gradient-to-b from-gray-100 to-gray-200 dark:from-[#2A2A2A] dark:to-[#1F1F1F] rounded-2xl shadow-2xl border border-gray-300 dark:border-[#3A3A3A] overflow-hidden">
              
              {/* Screen content */}
              <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-white/95 to-gray-50/95 dark:from-[#1A1A2E] dark:to-[#0F0F1E] p-4 lg:p-6">
                
                {/* Header with enhanced styling */}
                <div className="mb-4 lg:mb-6">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-xs lg:text-sm font-semibold text-gray-700 dark:text-gray-200">Analytics Dashboard</h3>
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-[8px] lg:text-xs text-gray-600 dark:text-gray-400">Live</span>
                    </div>
                  </div>
                  {/* Subtle animated line */}
                  <div className="h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/40 to-blue-500/0 rounded-full"></div>
                </div>

                {/* Charts Container */}
                <div className="flex-1 flex gap-3 lg:gap-6 items-end justify-between relative">
                  
                  {/* Followers Chart */}
                  <div className="flex-1 flex flex-col items-center gap-2 relative">
                    <div className="w-full flex gap-1 items-end justify-center h-20 lg:h-28 relative">
                      <div className="w-2 lg:w-3 bg-gradient-to-t from-[#1F75FE] to-[#1F75FE]/60 rounded-sm transition-all" style={{ height: '40%' }}></div>
                      <div className="w-2 lg:w-3 bg-gradient-to-t from-[#1F75FE] to-[#1F75FE]/60 rounded-sm transition-all" style={{ height: '55%' }}></div>
                      <div className="w-2 lg:w-3 bg-gradient-to-t from-[#1F75FE] to-[#1F75FE]/60 rounded-sm transition-all" style={{ height: '72%' }}></div>
                      <div className="w-2 lg:w-3 bg-gradient-to-t from-[#1F75FE] to-[#1F75FE]/60 rounded-sm transition-all" style={{ height: '88%' }}></div>
                      <div className="w-2 lg:w-3 bg-gradient-to-t from-[#1F75FE] to-[#1F75FE]/60 rounded-sm transition-all" style={{ height: '100%' }}></div>

                      {/* Mini Line Overlay for Followers */}
                      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" fill="none">
                        <polyline points="5,80 20,60 35,70 50,45 65,55 80,30 95,40" stroke="#1F75FE" strokeWidth="0.8" strokeLinecap="round" />
                        <polygon points="95,40 92,36 98,36" fill="#1F75FE" />
                      </svg>
                    </div>
                    <span className="text-[9px] lg:text-xs text-gray-600 dark:text-gray-400 font-medium">Followers</span>
                  </div>
                  
                  {/* Inquiries Chart */}
                  <div className="flex-1 flex flex-col items-center gap-2 relative">
                    <div className="w-full flex gap-1 items-end justify-center h-20 lg:h-28 relative">
                      <div className="w-2 lg:w-3 bg-gradient-to-t from-[#f2a705] to-[#f2a705]/60 rounded-sm transition-all" style={{ height: '35%' }}></div>
                      <div className="w-2 lg:w-3 bg-gradient-to-t from-[#f2a705] to-[#f2a705]/60 rounded-sm transition-all" style={{ height: '50%' }}></div>
                      <div className="w-2 lg:w-3 bg-gradient-to-t from-[#f2a705] to-[#f2a705]/60 rounded-sm transition-all" style={{ height: '68%' }}></div>
                      <div className="w-2 lg:w-3 bg-gradient-to-t from-[#f2a705] to-[#f2a705]/60 rounded-sm transition-all" style={{ height: '85%' }}></div>
                      <div className="w-2 lg:w-3 bg-gradient-to-t from-[#f2a705] to-[#f2a705]/60 rounded-sm transition-all" style={{ height: '95%' }}></div>

                      {/* Mini Line Overlay for Inquiries */}
                      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" fill="none">
                        <polyline points="5,85 20,65 35,75 50,50 65,60 80,35 95,45" stroke="#f2a705" strokeWidth="0.8" strokeLinecap="round" />
                        <polygon points="95,45 92,41 98,41" fill="#f2a705" />
                      </svg>
                    </div>
                    <span className="text-[9px] lg:text-xs text-gray-600 dark:text-gray-400 font-medium">Inquiries</span>
                  </div>
                </div>

                {/* Live Metrics - Between Charts */}
                <div className="flex gap-2 lg:gap-3 mt-3 lg:mt-4 px-2 lg:px-3 py-2 lg:py-3 bg-gradient-to-r from-blue-50/50 to-orange-50/50 dark:from-blue-950/20 dark:to-orange-950/20 rounded-lg border border-blue-200/30 dark:border-gray-700/50">
                  
                  {/* Followers Counter */}
                  <div className="flex-1 flex items-center gap-1.5 lg:gap-2">
                    <div className="p-1.5 lg:p-2 bg-gradient-to-br from-[#1F75FE]/20 to-[#1F75FE]/10 rounded-md">
                      <Users className="w-3 lg:w-4 h-3 lg:h-4" style={{ color: '#1F75FE' }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[9px] lg:text-[10px] text-gray-600 dark:text-gray-400">Followers</div>
                      <div className="text-[10px] lg:text-xs font-bold" style={{ color: '#1F75FE' }}>{formatNumber(followers)}</div>
                    </div>
                  </div>

                  {/* Profile Visits Counter */}
                  <div className="flex-1 flex items-center gap-1.5 lg:gap-2">
                    <div className="p-1.5 lg:p-2 bg-gradient-to-br from-[#f2a705]/20 to-[#f2a705]/10 rounded-md">
                      <Eye className="w-3 lg:w-4 h-3 lg:h-4" style={{ color: '#f2a705' }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[9px] lg:text-[10px] text-gray-600 dark:text-gray-400">Profile Visits</div>
                      <div className="text-[10px] lg:text-xs font-bold" style={{ color: '#f2a705' }}>{formatNumber(profileVisits)}</div>
                    </div>
                  </div>

                  {/* Viewers Counter */}
                  <div className="flex-1 flex items-center gap-1.5 lg:gap-2">
                    <div className="p-1.5 lg:p-2 bg-gradient-to-br from-[#1F75FE]/20 to-[#f2a705]/10 rounded-md">
                      <MessageCircle className="w-3 lg:w-4 h-3 lg:h-4" style={{ color: '#1F75FE' }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[9px] lg:text-[10px] text-gray-600 dark:text-gray-400">Viewers</div>
                      <div className="text-[10px] lg:text-xs font-bold" style={{ color: '#f2a705' }}>{formatNumber(viewers)}</div>
                    </div>
                  </div>
                </div>

                {/* Stats Footer with Graph Indicators */}
                <div className="flex gap-4 lg:gap-6 mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex flex-col items-center">
                      <div className="text-[10px] lg:text-xs font-semibold" style={{ color: '#f2a705' }}>24%</div>
                      <svg className="w-5 lg:w-6 h-5 lg:h-6" viewBox="0 0 24 24" fill="none" stroke="" strokeWidth="2">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 17"></polyline>
                        <polyline points="17 6 23 6 23 12"></polyline>
                      </svg>
                    </div>
                    <div>
                      <div className="text-[10px] lg:text-xs font-semibold" style={{ color: '#f2a705' }}>24%</div>
                      <div className="text-[9px] lg:text-xs text-gray-600 dark:text-gray-300">Today</div>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex flex-col items-center">
                      <svg className="w-5 lg:w-6 h-5 lg:h-6" viewBox="0 0 24 24" fill="none" stroke="#1F75FE" strokeWidth="2">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 17"></polyline>
                        <polyline points="17 6 23 6 23 12"></polyline>
                      </svg>
                    </div>
                    <div>
                      <div className="text-[10px] lg:text-xs font-semibold" style={{ color: '#1F75FE' }}>18%</div>
                      <div className="text-[9px] lg:text-xs text-gray-600 dark:text-gray-300">This week</div>
                    </div>
                  </div>

                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex flex-col items-center">
                      <svg className="w-5 lg:w-6 h-5 lg:h-6" viewBox="0 0 24 24" fill="none" stroke="#f2a705" strokeWidth="2">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 17"></polyline>
                        <polyline points="17 6 23 6 23 12"></polyline>
                      </svg>
                    </div>
                    <div>
                      <div className="text-[10px] lg:text-xs font-semibold" style={{ color: '#f2a705' }}>100%</div>
                      <div className="text-[9px] lg:text-xs text-gray-600 dark:text-gray-300">This Month</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monitor stand */}
              <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 w-24 lg:w-32 h-8 lg:h-10 bg-gray-300 dark:bg-[#2F2F2F] rounded-b-xl"></div>

              {/* Time and Date Display - Below Monitor */}
              <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-full flex flex-col items-center gap-2 text-center">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">{formatTime(time)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs">{formatDate(time)}</span>
                </div>
              </div>
            </div>

            {/* Mobile Mockup - Repositioned for responsive */}
            <div className="relative md:absolute md:left-[-60px] lg:left-[-100px] md:top-1/2 md:-translate-y-1/2 w-[140px] sm:w-[160px] md:w-[190px] h-[280px] sm:h-[320px] md:h-[380px] bg-gradient-to-b from-gray-100 to-gray-200 dark:from-[#2A2A2A] dark:to-[#1F1F1F] rounded-[2rem] shadow-2xl border border-gray-300 dark:border-[#3A3A3A] overflow-hidden">
              
              {/* Screen content (Unified Inbox) */}
              <div className="absolute inset-0 flex flex-col gap-1.5 px-2 pt-6 pb-3 bg-gradient-to-b from-white/90 to-gray-100/70 dark:from-[#2A2A2A]/80 dark:to-[#1F1F1F]/80">
                
                {/* Header Bar with Logo */}
                <div className="text-center mb-1">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-bold text-xs" style={{ color: '#1F75FE' }}>Teed</span>
                    <span className="font-bold text-xs" style={{ color: '#f2a705' }}>Hub</span>
                  </div>
                  <div className="text-[9px] text-gray-500 dark:text-gray-400">Inbox</div>
                </div>

                {/* Post 1 - Facebook */}
                <div className="flex items-start bg-white/90 dark:bg-[#2F2F2F]/90 rounded-md px-2 py-1 shadow-sm border-l-4 border-[#1877F2]">
                  <div className="flex-1 text-[10px] text-gray-700 dark:text-gray-300 truncate">
                    <span className="font-semibold text-[#1877F2]">Facebook:</span> New comment on your post!
                  </div>
                </div>

                {/* Post 2 - Instagram */}
                <div className="flex items-start bg-white/90 dark:bg-[#2F2F2F]/90 rounded-md px-2 py-1 shadow-sm border-l-4 border-[#E4405F]">
                  <div className="flex-1 text-[10px] text-gray-700 dark:text-gray-300 truncate">
                    <span className="font-semibold text-[#E4405F]">Instagram:</span> New like on your photo.
                  </div>
                </div>

                {/* Post 3 - TikTok */}
                <div className="flex items-start bg-white/90 dark:bg-[#2F2F2F]/90 rounded-md px-2 py-1 shadow-sm border-l-4 border-[#000000]">
                  <div className="flex-1 text-[10px] text-gray-700 dark:text-gray-300 truncate">
                    <span className="font-semibold text-[#000000]">TikTok:</span> New follower joined!
                  </div>
                </div>

                {/* Post 4 - Mixed Platform */}
                <div className="flex items-start bg-white/80 dark:bg-[#2F2F2F]/80 rounded-md px-2 py-1 shadow-sm border-l-4 border-[#FFA94D]">
                  <div className="flex-1 text-[10px] text-gray-700 dark:text-gray-300 truncate">
                    <span className="font-semibold text-[#FFA94D]">Unified:</span> 3 unread messages.
                  </div>
                </div>

                {/* Animated Vertical Dashed Arrow Down with Breathing */}
                <div className="flex flex-col items-center justify-center gap-1.5 my-3">
                  <style>{`
                    @keyframes breathe {
                      0%, 100% { opacity: 1; }
                      50% { opacity: 0.4; }
                    }
                  `}</style>
                  {/* Upper dashes - Blue */}
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#1F75FE', animation: 'breathe 2s ease-in-out infinite' }}></div>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#1F75FE', animation: 'breathe 2s ease-in-out infinite 0.3s' }}></div>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#1F75FE', animation: 'breathe 2s ease-in-out infinite 0.6s' }}></div>
                  {/* Lower dashes - Gold */}
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#f2a705', animation: 'breathe 2s ease-in-out infinite 0.3s' }}></div>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#f2a705', animation: 'breathe 2s ease-in-out infinite 0.6s' }}></div>
                  {/* Triangle Arrow Point */}
                  <div style={{
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '8px solid #f2a705',
                    animation: 'breathe 2s ease-in-out infinite'
                  }}></div>
                </div>

                {/* Bottom Action Buttons - Vertical Stack */}
                <div className="flex flex-col gap-1.5 mt-auto">
                  <button className="w-full text-[9px] font-semibold py-1.5 rounded-md transition-all hover:scale-105" style={{ backgroundColor: '#1F75FE', color: 'white' }}>
                    Advertise Now
                  </button>
                  <button className="w-full text-[9px] font-semibold py-1.5 rounded-md transition-all hover:scale-105" style={{ backgroundColor: '#f2a705', color: 'white' }}>
                    New Post
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

        {/* Supported Platforms Section */}
<section className="w-full bg-gradient-to-b from-gray-50 to-white dark:from-[#1F1F1F] dark:to-[#252526] transition-colors duration-300 py-16 lg:py-24">
  <div className="mx-2 sm:mx-4 lg:mx-16">
    <div className="text-center mb-12 lg:mb-16">
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1E1E1E] dark:text-[#D4D4D4] mb-4">
        Integrated Platforms
      </h2>
      <p className="text-lg text-[#4A4A4A] dark:text-[#A0A0A0]">
        Manage all your digital presence in one powerful dashboard
      </p>
    </div>

    {/* Platforms Grid */}
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-8 lg:gap-10 items-center justify-items-center">
      
      {/* Instagram */}
      <div className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-white/50 dark:hover:bg-[#2F2F2F]/50 transition-all duration-300 group">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg bg-gradient-to-br from-[#f2a705] via-[#d946ef] to-[#1F75FE]">
          <img
            src="/src/assets/icons/Instagram.png"
            alt="Instagram"
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
          />
        </div>
        <span className="text-sm font-semibold text-[#1E1E1E] dark:text-[#D4D4D4]">Instagram</span>
      </div>

      {/* TikTok */}
      <div className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-white/50 dark:hover:bg-[#2F2F2F]/50 transition-all duration-300 group">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg bg-gradient-to-br from-black to-[#25f4ee]">
          <img
            src="/src/assets/icons/tiktok.png"
            alt="TikTok"
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
          />
        </div>
        <span className="text-sm font-semibold text-[#1E1E1E] dark:text-[#D4D4D4]">TikTok</span>
      </div>

      {/* Facebook */}
      <div className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-white/50 dark:hover:bg-[#2F2F2F]/50 transition-all duration-300 group">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg bg-gradient-to-br from-[#1877F2] to-[#0A66C2]">
          <img
            src="/src/assets/icons/facebook.png"
            alt="Facebook"
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
          />
        </div>
        <span className="text-sm font-semibold text-[#1E1E1E] dark:text-[#D4D4D4]">Facebook</span>
      </div>

      {/* YouTube */}
      <div className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-white/50 dark:hover:bg-[#2F2F2F]/50 transition-all duration-300 group">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg bg-gradient-to-br from-[#FF0000] to-[#CC0000]">
          <img
            src="/src/assets/icons/youtube.png"
            alt="YouTube"
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
          />
        </div>
        <span className="text-sm font-semibold text-[#1E1E1E] dark:text-[#D4D4D4]">YouTube</span>
      </div>

      {/* Twitter */}
      <div className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-white/50 dark:hover:bg-[#2F2F2F]/50 transition-all duration-300 group">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg bg-black">
          <img
            src="/src/assets/icons/twitter.png"
            alt="Twitter"
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
          />
        </div>
        <span className="text-sm font-semibold text-[#1E1E1E] dark:text-[#D4D4D4]">Twitter</span>
      </div>

      {/* Shopify */}
      <div className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-white/50 dark:hover:bg-[#2F2F2F]/50 transition-all duration-300 group">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg bg-gradient-to-br from-[#96bf48] to-[#6eaa3b]">
          <img
            src="/src/assets/icons/shopify.png"
            alt="Shopify"
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
          />
        </div>
        <span className="text-sm font-semibold text-[#1E1E1E] dark:text-[#D4D4D4]">Shopify</span>
      </div>
    </div>
  </div>
</section>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeInLeft {
          animation: fadeInLeft 0.8s ease-out forwards;
        }

        .animate-fadeInRight {
          animation: fadeInRight 0.8s ease-out forwards;
        }

        .animate-slideUp {
          animation: slideUp 0.8s ease-out forwards;
        }

        .animate-fadeUp {
          animation: fadeUp 0.6s ease-out forwards;
        }
      `}</style>
    </>
  );
}