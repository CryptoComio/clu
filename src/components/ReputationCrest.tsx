import { motion } from "motion/react";
import { useId, useState } from "react";

interface ReputationCrestProps {
  tier: number;
  className?: string;
  size?: number;
}

export default function ReputationCrest({ tier, className = "", size = 120 }: ReputationCrestProps) {
  const uniqueId = useId();
  const cleanId = uniqueId.replace(/:/g, "-");
  
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const safeTier = typeof tier === "number" && !isNaN(tier) ? tier : 1;
  const currentTier = Math.max(1, Math.min(10, Math.floor(safeTier)));

  // Define EA FC Pro Clubs tier aesthetics (Tiers 1 to 10)
  const tierConfig: Record<number, {
    colors: [string, string, string];
    glow: string;
    wings: boolean;
    stars: number;
    tierRoman: string;
    label: string;
  }> = {
    1: {
      colors: ["#3f3f46", "#71717a", "#d4d4d8"], // Iron / Emerging Stars
      glow: "rgba(113, 113, 122, 0.35)",
      wings: false,
      stars: 1,
      tierRoman: "I",
      label: "TIER 1"
    },
    2: {
      colors: ["#78350f", "#b45309", "#fef3c7"], // Copper Bronze / Local Heroes
      glow: "rgba(180, 83, 9, 0.45)",
      wings: false,
      stars: 2,
      tierRoman: "II",
      label: "TIER 2"
    },
    3: {
      colors: ["#020617", "#0ea5e9", "#e0f2fe"], // Steel Cyan / Regional Contenders
      glow: "rgba(14, 165, 233, 0.55)",
      wings: true,
      stars: 3,
      tierRoman: "III",
      label: "TIER 3"
    },
    4: {
      colors: ["#3b0764", "#a855f7", "#f3e8ff"], // Amethyst / Continental
      glow: "rgba(168, 85, 247, 0.65)",
      wings: true,
      stars: 4,
      tierRoman: "IV",
      label: "TIER 4"
    },
    5: {
      colors: ["#450a0a", "#ef4444", "#ffe4e6"], // Ruby Crimson / National Icons
      glow: "rgba(239, 68, 68, 0.75)",
      wings: true,
      stars: 5,
      tierRoman: "V",
      label: "TIER 5"
    },
    6: {
      colors: ["#713f12", "#eab308", "#fef9c3"], // Gold Elite / Global Giants
      glow: "rgba(234, 179, 8, 0.85)",
      wings: true,
      stars: 5,
      tierRoman: "VI",
      label: "TIER 6"
    },
    7: {
      colors: ["#064e3b", "#10b981", "#d1fae5"], // Emerald
      glow: "rgba(16, 185, 129, 0.85)",
      wings: true,
      stars: 5,
      tierRoman: "VII",
      label: "TIER 7"
    },
    8: {
      colors: ["#1e1b4b", "#6366f1", "#e0e7ff"], // Sapphire Diamond
      glow: "rgba(99, 102, 241, 0.9)",
      wings: true,
      stars: 5,
      tierRoman: "VIII",
      label: "TIER 8"
    },
    9: {
      colors: ["#831843", "#ec4899", "#fce7f3"], // Rose Gold Legend
      glow: "rgba(236, 72, 153, 0.9)",
      wings: true,
      stars: 5,
      tierRoman: "IX",
      label: "TIER 9"
    },
    10: {
      colors: ["#451a03", "#f59e0b", "#ffffff"], // Pure World Renowned / Apex Elite
      glow: "rgba(245, 158, 11, 0.95)",
      wings: true,
      stars: 5,
      tierRoman: "X",
      label: "TIER 10"
    }
  };

  const config = tierConfig[currentTier] || tierConfig[1];
  const [bgBase, strokeMain, accentLight] = config.colors;

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`} 
      style={{ width: size, height: size }}
    >
      {/* Background Glow */}
      <motion.div 
        className="absolute inset-0 rounded-full blur-xl"
        style={{ backgroundColor: config.glow }}
        animate={{ 
          opacity: [0.4, 0.75, 0.4],
          scale: [0.85, 1.05, 0.85]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Official Vector Shield - shown when image is loading or failed */}
      {(!imageLoaded || imageFailed) && (
        <svg 
          viewBox="0 0 100 100" 
          width="100%" 
          height="100%" 
          className="relative z-10 drop-shadow-2xl flex-shrink-0"
        >
          <defs>
            <linearGradient id={`shield-bg-${cleanId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={bgBase} />
              <stop offset="50%" stopColor="#18181b" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>
            <linearGradient id={`shield-stroke-${cleanId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={accentLight} />
              <stop offset="50%" stopColor={strokeMain} />
              <stop offset="100%" stopColor={bgBase} />
            </linearGradient>
            <linearGradient id={`gold-banner-${cleanId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={strokeMain} />
              <stop offset="50%" stopColor={accentLight} />
              <stop offset="100%" stopColor={strokeMain} />
            </linearGradient>
          </defs>

          {/* Wing Accents for Higher Tiers */}
          {config.wings && (
            <g opacity="0.85">
              <path 
                d="M 22 38 Q 4 22 2 48 Q 14 58 18 68 Q 8 50 22 38" 
                fill={strokeMain} 
              />
              <path 
                d="M 78 38 Q 96 22 98 48 Q 86 58 82 68 Q 92 50 78 38" 
                fill={strokeMain} 
              />
            </g>
          )}

          {/* EA SPORTS FC Shield Outer Frame */}
          <path 
            d="M 20 18 L 50 8 L 80 18 L 85 52 Q 50 92 15 52 Z" 
            fill={`url(#shield-bg-${cleanId})`}
            stroke={`url(#shield-stroke-${cleanId})`}
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Inner Chevron / EA FC Triangle Geometry */}
          <path 
            d="M 50 16 L 74 24 L 78 50 Q 50 84 22 50 L 26 24 Z" 
            fill="none"
            stroke={accentLight}
            strokeWidth="1"
            opacity="0.3"
          />

          {/* Level Number / Roman Banner */}
          <g transform="translate(0, 3)">
            <rect 
              x="32" 
              y="38" 
              width="36" 
              height="20" 
              rx="4" 
              fill="#09090b" 
              stroke={strokeMain} 
              strokeWidth="1.5" 
            />
            <text 
              x="50" 
              y="52" 
              textAnchor="middle" 
              fill={accentLight} 
              fontSize="12" 
              fontWeight="bold" 
              fontFamily="sans-serif"
              letterSpacing="0.05em"
            >
              {config.tierRoman}
            </text>
          </g>

          {/* Stars */}
          <g transform="translate(0, 8)">
            {Array.from({ length: config.stars }).map((_, i) => {
              const spacing = 10;
              const totalWidth = (config.stars - 1) * spacing;
              const startX = 50 - totalWidth / 2;
              const x = startX + i * spacing;
              const y = 16 + (Math.abs(i - (config.stars - 1) / 2)) * 2;

              return (
                <path
                  key={i}
                  d={`M ${x} ${y} l 1.5 4.5 l 4.5 0 l -3.5 3 l 1.5 4.5 l -3.5 -3 l -3.5 3 l 1.5 -4.5 l -3.5 -3 l 4.5 0 Z`}
                  fill={strokeMain}
                />
              );
            })}
          </g>
        </svg>
      )}
      
      {/* HTML Image overlay - displayed when available without error */}
      {!imageFailed && (
        <img
          src={`https://media.contentapi.ea.com/content/dam/eacom/fc/pro-clubs/reputation-tier${currentTier}.png`}
          alt={`Reputation Tier ${currentTier}`}
          className={`absolute inset-0 m-auto z-20 drop-shadow-xl transition-all duration-300 ease-out pointer-events-none ${imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
          style={{ 
            width: '95%', 
            height: '95%', 
            objectFit: 'contain' 
          }}
          referrerPolicy="no-referrer"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageFailed(true)}
        />
      )}
    </div>
  );
}
