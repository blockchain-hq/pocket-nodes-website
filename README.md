# x402test Landing Page

This is the official landing page for [x402test](https://x402test.xyz/) - a free, open-source, and fast interactive UI based testing tool for Solana Anchor programs.

## 🚀 About x402test

x402test brings testing directly to your Solana Anchor programs, wherever they are. Unlike other testing platforms that require you to move your code to their IDE or playground, x402test works seamlessly with your existing development environment.

**Value Proposition:** _Bring testing to your program rather than moving your program to the test suite._

## 🛠️ Tech Stack

- **Astro** - Fast static site generator
- **TailwindCSS v4** - Utility-first CSS framework
- **TypeScript** - Type safety and better DX

## 📦 Project Structure

```
/
├── public/
│   └── favicon.svg          # Custom x402test logo
├── src/
│   ├── components/
│   │   ├── Header.astro     # Navigation bar
│   │   ├── Hero.astro       # Hero section with CTA
│   │   ├── Features.astro   # Features grid
│   │   ├── Timeline.astro   # Release timeline/roadmap
│   │   ├── QuickStart.astro # Quick start guide
│   │   └── Footer.astro     # Footer with links
│   ├── layouts/
│   │   └── main.astro       # Base layout
│   ├── pages/
│   │   └── index.astro      # Landing page
│   └── styles/
│       └── global.css       # Global styles and custom CSS
└── package.json
```

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd x402test-landing

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The site will be available at `http://localhost:4321`

### Build for Production

```bash
# Build the site
pnpm build

# Preview production build
pnpm preview
```

## 🎨 Design Principles

This landing page is inspired by the [Astroship template](https://github.com/surjithctly/astroship) and follows modern web design principles:

- **Clean and Modern**: Minimalist design with focus on content
- **Fast Loading**: Optimized for performance
- **Mobile First**: Fully responsive design
- **Accessible**: WCAG compliant components
- **SEO Optimized**: Proper meta tags and semantic HTML

## 📝 Content Updates

To update content on the landing page:

1. **Hero Section**: Edit `/src/components/Hero.astro`
2. **Features**: Update the `features` array in `/src/components/Features.astro`
3. **Timeline**: Modify the `timeline` array in `/src/components/Timeline.astro`
4. **Quick Start**: Edit `/src/components/QuickStart.astro`

## 🔗 Links

- [x402test Website](https://x402test.xyz/)
- [NPM Package](https://www.npmjs.com/package/@blockchain-hq/x402test)
- [GitHub Repository](https://github.com/blockchain-hq/x402test)
- [Astro Documentation](https://docs.astro.build)

## 📄 License

This landing page is open source. The x402test tool itself is licensed under GPL-3.0.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

Built with ❤️ using [Astro](https://astro.build) and [TailwindCSS](https://tailwindcss.com)
