import React, { useState } from 'react';

/**
 * Enterprise Animated Bio-Electric Neuron Logo for ITMS
 * 
 * Features video-grade cinematic neural animations:
 * - Bioluminescent central nucleus and terminal synaptic bulbs
 * - Dynamic traveling action potentials (electrical nerve impulses) along axons
 * - Synaptic firing flashes and expanding depolarization halos
 * - Continuous bio-current flow along orbital neural arcs
 * - Interactive neural excitation on hover (accelerated firing frequency & elevated glow)
 * - 100% GPU-accelerated 60fps SVG & CSS keyframe animation engine
 */
export default function NeuronLogo({
  size = 40,
  iconSize = 26,
  showText = true,
  interactive = true,
  collapsed = false,
  onClick = null,
  className = '',
  style = {}
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Scaled dimensions
  const squircleRadius = Math.round(size * 0.3);

  return (
    <div
      className={`itms-neuron-logo-wrapper ${className}`}
      onClick={onClick}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        ...style
      }}
    >
      {/* ─── Squircle Container with Ambient Neural Aura ─── */}
      <div
        className="itms-neuron-squircle"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: `${squircleRadius}px`,
          background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 45%, #7c3aed 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
          boxShadow: isHovered
            ? '0 0 28px rgba(59, 130, 246, 0.65), 0 0 16px rgba(124, 58, 237, 0.5), 0 6px 18px rgba(0, 0, 0, 0.35)'
            : '0 4px 16px rgba(37, 99, 235, 0.4), 0 0 12px rgba(59, 130, 246, 0.25)',
          transform: isHovered ? 'translateY(-1.5px) scale(1.04)' : 'translateY(0) scale(1)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Ambient Bioluminescent Wave Pulse Backdrop */}
        <div
          className="itms-neuron-bg-pulse"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 58% 34%, rgba(56, 189, 248, 0.35) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 75%)',
            opacity: isHovered ? 1 : 0.75,
            animation: `neuronPulseAmbient ${isHovered ? '1.5s' : '3s'} ease-in-out infinite alternate`,
            pointerEvents: 'none'
          }}
        />

        {/* Top-Left Glass Sheen Reflection */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '45%',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 100%)',
            borderRadius: `${squircleRadius}px ${squircleRadius}px 0 0`,
            pointerEvents: 'none'
          }}
        />

        {/* ─── Layer 1: High-Definition ITMS Base Graphic ─── */}
        <div
          style={{
            width: `${iconSize}px`,
            height: `${iconSize}px`,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <img
            src="/logoitms.png"
            alt="ITMS Neuron Logo"
            className="itms-neuron-base-img"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              // Bright luminous cyan-white filter that preserves the pristine contours
              filter: isHovered
                ? 'brightness(0) invert(1) drop-shadow(0 0 4px #67e8f9) drop-shadow(0 0 8px #38bdf8)'
                : 'brightness(0) invert(1) drop-shadow(0 0 2.5px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 5px rgba(56, 189, 248, 0.6))',
              transition: 'filter 0.3s ease',
              display: 'block'
            }}
          />

          {/* ─── Layer 2: Vector Neural Synaptic Animation Overlay (6794 x 5843 Normalized ViewBox) ─── */}
          <svg
            viewBox="0 0 100 86"
            className="itms-neuron-svg-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'visible',
              pointerEvents: 'none'
            }}
          >
            <defs>
              {/* Electric Action Potential Glow Filters */}
              <filter id="neuronGlowPrimary" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="neuronGlowIntense" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Action Potential Radial Glow Gradients */}
              <radialGradient id="sparkGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="40%" stopColor="#67e8f9" stopOpacity="0.95" />
                <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="nucleusGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="45%" stopColor="#38bdf8" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* ── 1. Axon Electric Current Conduits (Dash Flow) ── */}
            {/* Axon 1: Central Nucleus -> Left Bulb */}
            <path
              d="M 57.5 33.5 L 7.5 44.5"
              fill="none"
              stroke="#67e8f9"
              strokeWidth="1.2"
              strokeDasharray="2 6"
              className="itms-axon-flow-1"
              style={{
                opacity: isHovered ? 0.9 : 0.65,
                animation: `axonDashFlow ${isHovered ? '0.7s' : '1.4s'} linear infinite`
              }}
            />

            {/* Axon 2: Central Nucleus -> Bottom Bulb */}
            <path
              d="M 57.5 33.5 L 40.5 90.5"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeDasharray="2 6"
              className="itms-axon-flow-2"
              style={{
                opacity: isHovered ? 0.9 : 0.65,
                animation: `axonDashFlow ${isHovered ? '0.7s' : '1.4s'} linear infinite`
              }}
            />

            {/* Orbital Arc Flow: Right Synaptic Wing */}
            <path
              d="M 68 42 C 86 46, 94 62, 85 82 C 77 96, 58 97, 49 97.5"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="1"
              strokeDasharray="3 7"
              style={{
                opacity: isHovered ? 0.8 : 0.5,
                animation: `axonDashFlow ${isHovered ? '1s' : '2s'} linear infinite`
              }}
            />

            {/* ── 2. Concentric Neural Depolarization Waves (From Central Nucleus) ── */}
            <circle
              cx="57.5"
              cy="33.5"
              r="7"
              fill="none"
              stroke="#67e8f9"
              strokeWidth="1"
              className="itms-depolarize-wave-1"
              style={{
                animation: `depolarizeRing ${isHovered ? '1.4s' : '2.6s'} cubic-bezier(0.2, 0.8, 0.4, 1) infinite`
              }}
            />
            <circle
              cx="57.5"
              cy="33.5"
              r="7"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="0.8"
              className="itms-depolarize-wave-2"
              style={{
                animation: `depolarizeRing ${isHovered ? '1.4s' : '2.6s'} cubic-bezier(0.2, 0.8, 0.4, 1) infinite`,
                animationDelay: isHovered ? '0.7s' : '1.3s'
              }}
            />

            {/* ── 3. Synaptic Node Luminescent Cores ── */}
            {/* Central Junction Nucleus Node */}
            <circle
              cx="57.5"
              cy="33.5"
              r="4.5"
              fill="url(#nucleusGradient)"
              filter="url(#neuronGlowIntense)"
              className="itms-nucleus-core"
              style={{
                animation: `nucleusBreathe ${isHovered ? '1.2s' : '2.2s'} ease-in-out infinite`
              }}
            />

            {/* Left Synaptic Bulb Flash Halo */}
            <circle
              cx="7.5"
              cy="44.5"
              r="4"
              fill="url(#sparkGradient)"
              filter="url(#neuronGlowPrimary)"
              className="itms-bulb-halo-left"
              style={{
                animation: `synapticBulbFlashLeft ${isHovered ? '1.4s' : '2.6s'} ease-in-out infinite`
              }}
            />

            {/* Bottom Synaptic Bulb Flash Halo */}
            <circle
              cx="40.5"
              cy="90.5"
              r="4"
              fill="url(#sparkGradient)"
              filter="url(#neuronGlowPrimary)"
              className="itms-bulb-halo-bottom"
              style={{
                animation: `synapticBulbFlashBottom ${isHovered ? '1.4s' : '2.6s'} ease-in-out infinite`
              }}
            />

            {/* ── 4. Traveling Action Potential Sparks (Electric Nerve Impulses) ── */}
            {/* Spark 1: Traveling Nucleus -> Left Terminal */}
            <circle
              r="2.4"
              fill="#FFFFFF"
              filter="url(#neuronGlowIntense)"
              className="itms-traveling-spark-1"
              style={{
                animation: `travelAxonLeft ${isHovered ? '1.4s' : '2.6s'} cubic-bezier(0.4, 0, 0.2, 1) infinite`
              }}
            />

            {/* Spark 2: Traveling Nucleus -> Bottom Terminal */}
            <circle
              r="2.4"
              fill="#FFFFFF"
              filter="url(#neuronGlowIntense)"
              className="itms-traveling-spark-2"
              style={{
                animation: `travelAxonBottom ${isHovered ? '1.4s' : '2.6s'} cubic-bezier(0.4, 0, 0.2, 1) infinite`,
                animationDelay: isHovered ? '0.7s' : '1.3s'
              }}
            />
          </svg>
        </div>
      </div>

      {/* ─── Optional ITMS Typography with Electric Micro-Shimmer ─── */}
      {showText && !collapsed && (
        <span
          className="itms-brand-text"
          style={{
            fontFamily: 'Outfit, system-ui, sans-serif',
            fontWeight: 800,
            fontSize: `${Math.max(1.15, size * 0.03)}rem`,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary, #F5F7FA)',
            lineHeight: 1,
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center'
          }}
        >
          <span style={{ position: 'relative', zIndex: 1 }}>ITMS</span>
          <span
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.8) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              opacity: isHovered ? 1 : 0,
              animation: isHovered ? 'textShimmer 1.5s linear infinite' : 'none',
              pointerEvents: 'none',
              zIndex: 2,
              transition: 'opacity 0.25s ease'
            }}
          >
            ITMS
          </span>
        </span>
      )}

      {/* ─── Ultra-Smooth 60fps Hardware-Accelerated CSS Keyframes ─── */}
      <style>{`
        /* Ambient Bio-Luminescent Breathing */
        @keyframes neuronPulseAmbient {
          0% {
            opacity: 0.55;
            transform: scale(0.96);
          }
          100% {
            opacity: 0.95;
            transform: scale(1.08);
          }
        }

        /* Continuous Electrical Flow along Axon Fibers */
        @keyframes axonDashFlow {
          0% {
            stroke-dashoffset: 24;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        /* Neural Depolarization Wave Expanding outward */
        @keyframes depolarizeRing {
          0% {
            r: 4;
            opacity: 0.95;
            stroke-width: 1.6;
          }
          65% {
            opacity: 0.45;
            stroke-width: 0.9;
          }
          100% {
            r: 24;
            opacity: 0;
            stroke-width: 0.2;
          }
        }

        /* Nucleus Core Pulsing */
        @keyframes nucleusBreathe {
          0%, 100% {
            r: 4.2;
            opacity: 0.85;
          }
          50% {
            r: 5.6;
            opacity: 1;
          }
        }

        /* Action Potential 1: Traveling from Nucleus (57.5, 33.5) to Left Bulb (7.5, 44.5) */
        @keyframes travelAxonLeft {
          0% {
            cx: 57.5px;
            cy: 33.5px;
            opacity: 0;
            r: 1.5;
          }
          10% {
            opacity: 1;
            r: 2.5;
          }
          50% {
            cx: 7.5px;
            cy: 44.5px;
            opacity: 1;
            r: 2.8;
          }
          55% {
            cx: 7.5px;
            cy: 44.5px;
            opacity: 0;
            r: 4;
          }
          100% {
            cx: 7.5px;
            cy: 44.5px;
            opacity: 0;
            r: 1;
          }
        }

        /* Action Potential 2: Traveling from Nucleus (57.5, 33.5) to Bottom Bulb (40.5, 90.5) */
        @keyframes travelAxonBottom {
          0% {
            cx: 57.5px;
            cy: 33.5px;
            opacity: 0;
            r: 1.5;
          }
          10% {
            opacity: 1;
            r: 2.5;
          }
          50% {
            cx: 40.5px;
            cy: 90.5px;
            opacity: 1;
            r: 2.8;
          }
          55% {
            cx: 40.5px;
            cy: 90.5px;
            opacity: 0;
            r: 4;
          }
          100% {
            cx: 40.5px;
            cy: 90.5px;
            opacity: 0;
            r: 1;
          }
        }

        /* Synaptic Bulb 1 Flash when Action Potential 1 strikes */
        @keyframes synapticBulbFlashLeft {
          0%, 45% {
            r: 3.5;
            opacity: 0.35;
          }
          50% {
            r: 7.5;
            opacity: 1;
          }
          65% {
            r: 5;
            opacity: 0.45;
          }
          100% {
            r: 3.5;
            opacity: 0.35;
          }
        }

        /* Synaptic Bulb 2 Flash when Action Potential 2 strikes */
        @keyframes synapticBulbFlashBottom {
          0%, 45% {
            r: 3.5;
            opacity: 0.35;
          }
          50% {
            r: 7.5;
            opacity: 1;
          }
          65% {
            r: 5;
            opacity: 0.45;
          }
          100% {
            r: 3.5;
            opacity: 0.35;
          }
        }

        /* Electric Shimmer on ITMS typography */
        @keyframes textShimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
}
