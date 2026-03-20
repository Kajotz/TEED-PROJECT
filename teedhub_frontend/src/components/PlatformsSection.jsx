export default function PlatformsSection() {
  const platforms = [
    {
      name: "Instagram",
      icon: "/src/assets/icons/Instagram.png",
      gradient: "from-[#f2a705] via-[#d946ef] to-[#1F75FE]"
    },
    {
      name: "TikTok",
      icon: "/src/assets/icons/tiktok.png",
      gradient: "from-black to-[#25f4ee]"
    },
    {
      name: "Facebook",
      icon: "/src/assets/icons/facebook.png",
      gradient: "from-[#1877F2] to-[#0A66C2]"
    },
    {
      name: "YouTube",
      icon: "/src/assets/icons/youtube.png",
      gradient: "from-[#FF0000] to-[#CC0000]"
    },
    {
      name: "Twitter",
      icon: "/src/assets/icons/twitter.png",
      gradient: "from-black to-black"
    },
    {
      name: "Shopify",
      icon: "/src/assets/icons/shopify.png",
      gradient: "from-[#96bf48] to-[#6eaa3b]"
    }
  ];

  return (
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
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-white/50 dark:hover:bg-[#2F2F2F]/50 transition-all duration-300 group"
            >
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg bg-gradient-to-br ${platform.gradient}`}>
                <img
                  src={platform.icon}
                  alt={platform.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                />
              </div>
              <span className="text-sm font-semibold text-[#1E1E1E] dark:text-[#D4D4D4]">
                {platform.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
