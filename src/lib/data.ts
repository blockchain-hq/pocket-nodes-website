export const appData = {
  title: "x402 Pocket Nodes",
  description:
    "Seamlessly integrate x402 payment protocol with your n8n workflows",
  tagline:
    "Make HTTP requests to x402-enabled APIs with automatic Solana/USDC payment handling",
  siteUrl: "https://pocket-nodes.testship.xyz",
  docsUrl: "https://pocket-nodes.testship.xyz/getting-started/introduction/",
  githubUrl: "https://github.com/blockchain-hq/x402-pocket-nodes",
  npmPackageUrl:
    "https://www.npmjs.com/package/@blockchain-hq/n8n-nodes-x402-pocket",
  twitterUrl: "https://x.com/blockchainhqxyz",
  features: [
    {
      title: "Automatic Payment Handling",
      description:
        "Automatically detects 402 responses and handles payment creation, signing, and retry",
      icon: "credit-card",
    },
    {
      title: "Persistent Wallet Management",
      description:
        "Generate wallets once and reuse them across all workflow executions",
      icon: "wallet",
    },
    {
      title: "Solana USDC Micropayments",
      description:
        "Native integration with Solana blockchain for secure USDC micropayments",
      icon: "coins",
    },
    {
      title: "Mock Server for Testing",
      description:
        "Built-in mock server to test x402 integration without real blockchain transactions",
      icon: "server",
    },
    {
      title: "Payment Limits & Safety",
      description:
        "Configurable payment limits prevent overspending with automatic balance checks",
      icon: "shield-check",
    },
    {
      title: "n8n Native Integration",
      description:
        "Works seamlessly with n8n workflows, triggers, and standard HTTP Request nodes",
      icon: "workflow",
    },
  ],
};
