teedhub_frontend/
│
├── public/                  # Public assets (served as-is, no bundling)
│   ├── manifest.json        # PWA manifest
│   ├── favicon.ico          # Standard browser favicon
│   ├── icons/               # PWA install icons
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── (other sizes if needed, e.g., 72, 144, 384)
│   └── images/              # Optional static images (not processed by Vite)
│       └── og-banner.png    # Example (for SEO / OpenGraph sharing)
│
├── src/                     # Your actual React app
│   ├── assets/              # Imported images, styles, fonts
│   │   ├── logo.png
│   │   ├── main.css         # Tailwind output
│   │   └── input.css        # Tailwind input
│   │
│   ├── components/          # Reusable components
│   │   ├── Layout.jsx
│   │   ├── Navbar.jsx
│   │   └── DarkModeToggle.jsx
│   │
│   ├── pages/               # App pages
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   └── Dashboard.jsx
│   │
│   ├── App.jsx              # Root component
│   ├── main.jsx             # Entry point
│   └── sw.js                # Service worker (if custom)
│
├── vite.config.js
├── package.json
└── tailwind.config.js
