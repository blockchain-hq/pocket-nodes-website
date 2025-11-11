// @ts-check

import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

import react from "@astrojs/react";

import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    react(),
    starlight({
      title: "x402 Pocket Nodes",
      description: "Seamlessly integrate x402 payment protocol with n8n",
      logo: {
        src: "./public/logo.png",
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/blockchain-hq/x402-pocket-nodes",
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          autogenerate: { directory: "getting-started" },
        },
        {
          label: "Core Concepts",
          autogenerate: { directory: "concepts" },
        },
        {
          label: "Node Reference",
          autogenerate: { directory: "api" },
        },
        {
          label: "Examples",
          autogenerate: { directory: "examples" },
        },
        {
          label: "Advanced",
          autogenerate: { directory: "advanced" },
        },
        {
          label: "Showcase Server",
          autogenerate: { directory: "cli" },
        },
      ],
      customCss: ["./src/styles/starlight.css"],
    }),
  ],
});
