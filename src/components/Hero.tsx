import React from "react";
import { Vortex } from "./ui/vortex";
import { appData } from "@/lib/data";
import { BackgroundBeams } from "./ui/background-beams";
export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10 py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="inline-block">
              <span className="px-4 py-2 bg-brand/30 text-white rounded-full text-sm font-medium">
                n8n Community Node
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
              Micropayments for{" "}
              <span className="text-brand">n8n Workflows</span>
            </h1>

            <p className="text-xl text-gray-300 leading-relaxed">
              Seamlessly integrate x402 payment protocol with n8n. Automatic
              payment handling for x402-enabled APIs using USDC on Solana.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/getting-started/introduction/"
                className="px-8 py-4 bg-brand text-white rounded-lg hover:opacity-90 transition font-medium text-center shadow-lg hover:shadow-xl"
              >
                Get Started
              </a>
              <a
                href={appData.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition font-medium text-center border-2 border-gray-700 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                View on GitHub
              </a>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold text-brand">3</div>
                <div className="text-sm text-gray-400">Powerful Nodes</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-brand">Auto</div>
                <div className="text-sm text-gray-400">Payment Handling</div>
              </div>
            </div>
          </div>

          {/* Right Column - Illustration/Visual */}
          <div className="relative">
            <div
              className="rounded-2xl p-8 shadow-2xl"
              style={{
                background:
                  "linear-gradient(to bottom right, #ff751f, #ff9f50)",
              }}
            >
              <div className="bg-gray-200 rounded-lg p-6 font-mono text-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="space-y-2">
                  <div className="text-gray-600 text-xs mb-3">
                    Install in n8n:
                  </div>
                  <div className="text-gray-400">
                    Settings → Community Nodes
                  </div>
                  <div className="text-gray-400">
                    →{" "}
                    <span style={{ color: "#ff751f" }}>
                      Install a community node
                    </span>
                  </div>
                  <div className="text-gray-400 mt-2">
                    Package:{" "}
                    <span style={{ color: "#ff751f" }}>
                      @blockchain-hq/n8n-nodes-x402-pocket
                    </span>
                  </div>
                  <div className="text-green-600 mt-3">
                    ✓ x402 Wallet Manager
                  </div>
                  <div className="text-green-600">✓ x402 Client</div>
                  <div className="text-green-600">✓ x402 Mock Server</div>
                  <div className="flex items-center mt-4">
                    <span
                      className="animate-pulse"
                      style={{ color: "#ff751f" }}
                    >
                      ▸
                    </span>
                    <span className="text-gray-500 ml-2">
                      Ready for workflows
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-30 blur-xl animate-pulse bg-brand"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full opacity-20 blur-xl animate-pulse bg-brand animation-delay-1s"></div>
          </div>
        </div>
      </div>
      <BackgroundBeams />
    </section>
  );
}
