import React from "react";
import { Button } from "./ui/moving-border";
import {
  MonitorPlay,
  Key,
  Sparkles,
  Share2,
  Zap,
  FileDown,
  type LucideIcon,
  Server,
  Package,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  status: "available" | "coming-soon";
}

const features: Feature[] = [
  {
    icon: Zap,
    title: "Simple Testing API",
    description:
      "Fluent interface for making payment-protected HTTP requests with automatic payment handling.",
    status: "available",
  },
  {
    icon: Server,
    title: "Mock Server",
    description:
      "Built-in server for simulating payment-protected endpoints during development.",
    status: "available",
  },
  {
    icon: Package,
    title: "Solana USDC Payments",
    description:
      "Native integration with Solana blockchain for USDC micropayments on devnet and localnet.",
    status: "available",
  },
  {
    icon: Sparkles,
    title: "AI Agent Ready",
    description:
      "Perfect for testing autonomous agents with budget management and payment verification.",
    status: "available",
  },
  {
    icon: Key,
    title: "Replay Protection",
    description:
      "Built-in security against replay attacks with transaction signature tracking.",
    status: "available",
  },
  {
    icon: FileDown,
    title: "Developer Friendly",
    description:
      "Auto-funded test wallets, comprehensive examples, and intuitive CLI.",
    status: "available",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 bg-black">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Everything You Need for{" "}
            <span className="text-brand">Payment Testing</span>
          </h2>
          <p className="text-xl text-gray-300">
            x402test provides a complete toolkit for developing and testing HTTP
            402 Payment Required flows with Solana blockchain payments.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Button
                key={index}
                as="div"
                duration={3000 + index * 500}
                borderRadius="1rem"
                containerClassName="h-auto w-full"
                borderClassName="bg-[radial-gradient(#5e17eb_40%,transparent_60%)]"
                className="bg-gray-900/90 border-gray-800 text-white p-6 h-full"
              >
                <div className="flex items-start space-x-4 h-full">
                  <div className="flex-shrink-0">
                    <IconComponent
                      className="w-10 h-10 text-brand"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-xl font-semibold text-white group-hover:text-brand transition">
                        {feature.title}
                      </h3>
                      {feature.status === "coming-soon" && (
                        <span className="px-2 py-1 bg-green-900/30 text-xs rounded-full font-medium text-brand">
                          Soon
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 leading-relaxed text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Value Proposition Banner */}
        <div
          className="mt-20 rounded-2xl p-8 md:p-12 text-white text-center"
          style={{ background: "linear-gradient(to right, #5e17eb, #009950)" }}
        >
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Test Micropayment APIs Locally
          </h3>
          <p className="text-xl text-green-100 max-w-3xl mx-auto">
            Run your tests on a local Solana validator with auto-funded test
            wallets. No real funds needed. No complicated setup.
          </p>
        </div>
      </div>
    </section>
  );
}
