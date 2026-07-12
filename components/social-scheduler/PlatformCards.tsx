"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Rocket, Unplug } from "lucide-react";
import PlatformIcon from "@/components/social-scheduler/PlatformIcon";
import {
  PLATFORM_META,
  SOCIAL_PLATFORMS,
  type SocialConnection,
  type SocialPlatform,
} from "@/lib/social-scheduler/types";
import {
  isOAuthFullyConfigured,
  type SocialOAuthStatus,
} from "@/lib/social-scheduler/oauth-config";

type PlatformCardsProps = {
  connections: SocialConnection[];
  oauthStatus: SocialOAuthStatus;
  connectingPlatform: SocialPlatform | null;
  disconnectingPlatform: SocialPlatform | null;
  onConnect: (platform: SocialPlatform) => void;
  onDisconnect: (platform: SocialPlatform) => void;
};

function getConnection(
  connections: SocialConnection[],
  platform: SocialPlatform
) {
  return connections.find((connection) => connection.platform === platform) ?? null;
}

export default function PlatformCards({
  connections,
  oauthStatus,
  connectingPlatform,
  disconnectingPlatform,
  onConnect,
  onDisconnect,
}: PlatformCardsProps) {
  return (
    <section aria-label="Connected accounts">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-white">
          Connected Accounts
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Connect X and LinkedIn to publish. More platforms are on the way.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {SOCIAL_PLATFORMS.map((platform, index) => {
          const meta = PLATFORM_META[platform];
          const connection = getConnection(connections, platform);
          const isAvailable = meta.availability === "available";
          const oauthConfigured = isOAuthFullyConfigured(oauthStatus);
          const isConnecting = connectingPlatform === platform;
          const isDisconnecting = disconnectingPlatform === platform;

          return (
            <motion.article
              key={platform}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              whileHover={isAvailable ? { y: -2 } : { scale: 1.01 }}
              className={`group relative overflow-hidden rounded-2xl border p-4 transition ${
                isAvailable
                  ? "border-white/[0.1] bg-white/[0.04] hover:border-white/[0.16] hover:bg-white/[0.06]"
                  : "border-white/[0.06] bg-white/[0.02] opacity-70 hover:opacity-85"
              }`}
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${meta.accentClass} opacity-60`}
              />

              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-white">
                      <PlatformIcon platform={platform} />
                    </span>
                    <div>
                      <p className="font-semibold text-white">{meta.label}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {connection?.profileUsername
                          ? `@${connection.profileUsername}`
                          : connection?.profileName ?? meta.description}
                      </p>
                    </div>
                  </div>

                  {isAvailable ? (
                    connection ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                        Available
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
                      <Rocket className="h-3 w-3" />
                      Coming Soon
                    </span>
                  )}
                </div>

                {connection?.profileImageUrl ? (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/8 bg-black/20 px-3 py-2">
                    <img
                      src={connection.profileImageUrl}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-zinc-200">
                        {connection.profileName ?? connection.profileUsername}
                      </p>
                      <p className="truncate text-[11px] text-zinc-500">
                        {connection.profileUsername
                          ? `@${connection.profileUsername}`
                          : "Connected profile"}
                      </p>
                    </div>
                  </div>
                ) : null}

                {isAvailable ? (
                  <div className="mt-3">
                    {connection ? (
                      <button
                        type="button"
                        onClick={() => onDisconnect(platform)}
                        disabled={isDisconnecting}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-red-500/25 hover:bg-red-500/10 hover:text-red-200 disabled:cursor-wait disabled:opacity-60"
                      >
                        {isDisconnecting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Unplug className="h-3.5 w-3.5" />
                        )}
                        Disconnect
                      </button>
                    ) : !oauthConfigured ? (
                      <button
                        type="button"
                        disabled
                        className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-zinc-500 opacity-70"
                      >
                        Connect {meta.label}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onConnect(platform)}
                        disabled={isConnecting}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400/90 to-violet-500/90 px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
                      >
                        {isConnecting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        Connect {meta.label}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-dashed border-white/10 bg-black/10 px-3 py-2 text-center text-[11px] text-zinc-500">
                    Launching soon on Advora
                  </div>
                )}
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
