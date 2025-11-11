import React from "react";
import { Button } from "./ui/moving-border";
import {
  CreditCard,
  Wallet,
  Coins,
  Server,
  ShieldCheck,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { appData } from "../lib/data";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  status: "available" | "coming-soon";
}

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  "credit-card": CreditCard,
  wallet: Wallet,
  coins: Coins,
  server: Server,
  "shield-check": ShieldCheck,
  workflow: Workflow,
};

const features: Feature[] = appData.features.map((feature) => ({
  icon: iconMap[feature.icon] || CreditCard,
  title: feature.title,
  description: feature.description,
  status: "available" as const,
}));

export default function Features() {
  return (
    <section id="features" className="py-20 bg-black">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Powerful Features for{" "}
            <span className="text-brand">n8n Automation</span>
          </h2>
          <p className="text-xl text-gray-300">
            x402 Pocket Nodes provides everything you need to integrate
            micropayments into your n8n workflows with automatic payment
            handling and wallet management.
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
                borderClassName="bg-[radial-gradient(#ff751f_40%,transparent_60%)]"
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
                        <span className="px-2 py-1 bg-orange-900/30 text-xs rounded-full font-medium text-brand">
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
          style={{ background: "linear-gradient(to right, #ff751f, #ff9f50)" }}
        >
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Seamless n8n Integration
          </h3>
          <p className="text-xl text-orange-100 max-w-3xl mx-auto">
            Works with any trigger, connects with standard HTTP Request nodes,
            and automatically handles all payment flows. Start on devnet with
            test funds, deploy to mainnet when ready.
          </p>
        </div>
      </div>
    </section>
  );
}
