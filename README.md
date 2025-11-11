# x402 Pocket Nodes Website

Official website and documentation for [x402 Pocket Nodes](https://pocket-nodes.testship.xyz/) - n8n community nodes for seamless x402 payment protocol integration.

## About x402 Pocket Nodes

x402 Pocket Nodes enables n8n users to integrate micropayments into their workflows. Make HTTP requests to x402-enabled APIs with automatic Solana/USDC payment handling.

**Value Proposition:** _Bring micropayments to your n8n workflows with automatic payment handling and persistent wallet management._

## Tech Stack

- **Astro** - Fast static site generator with Starlight docs
- **TailwindCSS v4** - Utility-first CSS framework
- **React** - Interactive components
- **TypeScript** - Type safety and better DX
- **Starlight** - Beautiful documentation framework

## Project Structure

```
/
├── public/
│   ├── logo.png                    # x402 logo
│   └── *.png                       # n8n node screenshots
├── src/
│   ├── components/
│   │   ├── Header.astro           # Navigation bar
│   │   ├── Hero.tsx               # Hero section with CTA
│   │   ├── Features.tsx           # Features grid
│   │   ├── QuickStart.astro       # Quick start guide
│   │   └── Footer.astro           # Footer with links
│   ├── content/
│   │   └── docs/                  # Documentation content
│   │       ├── getting-started/   # Installation, quick start
│   │       ├── concepts/          # Core concepts
│   │       ├── api/               # Node reference
│   │       ├── examples/          # Workflow examples
│   │       ├── advanced/          # Advanced topics
│   │       └── cli/               # Showcase server
│   ├── layouts/
│   │   └── main.astro             # Base layout
│   ├── lib/
│   │   └── data.ts                # Site data and configuration
│   ├── pages/
│   │   └── index.astro            # Landing page
│   └── styles/
│       ├── global.css             # Global styles
│       └── starlight.css          # Documentation styles
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/blockchain-hq/x402-pocket-nodes.git
cd pocket-nodes-website

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

## Design Principles

- **Clean and Modern**: Orange/black theme matching the x402 logo
- **Fast Loading**: Optimized for performance with Astro
- **Mobile First**: Fully responsive design
- **Accessible**: WCAG compliant components
- **SEO Optimized**: Proper meta tags and semantic HTML
- **Developer Focused**: Clear examples and code snippets

## Content Updates

### Landing Page

To update content on the landing page:

1. **Site Data**: Edit `/src/lib/data.ts` for titles, URLs, features
2. **Hero Section**: Modify `/src/components/Hero.tsx`
3. **Features**: Update in `/src/lib/data.ts`, rendered by Features.tsx
4. **Quick Start**: Edit `/src/components/QuickStart.astro`

### Documentation

Documentation is in `/src/content/docs/`:

1. **Getting Started**: Installation and quick start guides
2. **Concepts**: Core concepts and how things work
3. **Node Reference**: Complete configuration references
4. **Examples**: Real-world workflow examples
5. **Advanced**: Production configurations and security
6. **Showcase Server**: Information about the Express.js showcase server

## Color Scheme

The site uses the orange color (#ff751f) from the x402 logo:

- Primary brand color: `#ff751f`
- Gradient light: `#ff9f50`
- CSS variable: `--brand-color`
- Tailwind class: `text-brand`, `bg-brand`, etc.

## Links

- [Live Website](https://pocket-nodes.testship.xyz/)
- [NPM Package](https://www.npmjs.com/package/@blockchain-hq/n8n-nodes-x402-pocket)
- [GitHub Repository](https://github.com/blockchain-hq/x402-pocket-nodes)
- [n8n Community](https://community.n8n.io/)
- [Astro Documentation](https://docs.astro.build)
- [Starlight Documentation](https://starlight.astro.build)

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `pnpm dev`
5. Submit a pull request

### Documentation Guidelines

- Use clear, concise language
- Include code examples
- Add screenshots for visual steps
- Test all code snippets
- Follow existing formatting

## Deployment

The site is configured for deployment to any static hosting:

- **Vercel**: Connect GitHub repository
- **Netlify**: Connect GitHub repository
- **GitHub Pages**: Use GitHub Actions
- **Custom**: Deploy `/dist` folder after `pnpm build`

## License

This website is open source. The x402 Pocket Nodes package itself is licensed under MIT.

---

Built with Astro, Starlight, and TailwindCSS for the n8n and Solana communities.
