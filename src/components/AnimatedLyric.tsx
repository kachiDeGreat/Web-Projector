import React, { useMemo } from "react";
import "./AnimatedLyric.css";

interface AnimatedLyricProps {
  text: string;
  isEnabled?: boolean; // Controls whether animation is on or off
  kineticTempo?: 'slow' | 'medium' | 'fast' | 'random';
}

// 60 Awesome kinetic animations! (Added more to ensure extreme variety)
const STANDARD_ANIMATIONS = [
  "stomp-pop",
  "cinematic-flash",
  "whip-zoom",
  "stomp-drop",
  "whip-pan-left",
  "whip-pan-right",
  "whip-pan-up",
  "whip-pan-down",
  "zoom-in",
  "zoom-in-bounce",
  "slide-up",
  "slide-down",
  "slide-left",
  "slide-right",
  "bounce-in",
  "bounce-up",
  "bounce-down",
  "bounce-left",
  "bounce-right",
  "rotate-in",
  "fade-in",
  "fade-blur-in",
  "fade-drop-in",
  "roll-in-left",
  "roll-in-right",
  "roll-in-top",
  "roll-in-bottom",
  "spring-up",
  "spring-down",
  "spring-left",
  "spring-right",
  "light-speed-in-right",
  "light-speed-in-left",
  "zoom-in-up",
  "zoom-in-down",
  "zoom-in-left",
  "zoom-in-right",
];

const SLOW_ANIMATIONS = [
  "fade-in", "fade-blur-in", "slide-up", "slide-down", "slide-left", "slide-right", "zoom-in",
  "cinematic-unmask", "slow-rise-blur", "majestic-fade-track", "ghost-reveal",
  "fade-in-up-slow", "fade-in-down-slow", "zoom-in-soft", "rotate-in-slow",
  "slide-up-fade", "slide-down-fade", "slide-left-fade", "slide-right-fade",
  "blur-expand", "blur-contract", "tilt-in-fwd-up", "tilt-in-fwd-down",
  "tilt-in-bottom-1", "tilt-in-top-1", "focus-in", "focus-in-expand"
];

const MEDIUM_ANIMATIONS = [
  "bounce-in", "bounce-up", "bounce-down", "bounce-left", "bounce-right",
  "roll-in-left", "roll-in-right", "roll-in-top", "roll-in-bottom",
  "zoom-in-up", "zoom-in-down", "zoom-in-left", "zoom-in-right",
  "spring-up", "spring-down", "spring-left", "spring-right", "fade-drop-in", "rotate-in", "zoom-in-bounce",
  "elastic-drop", "cartwheel-in", "flip-bounce-y", "rubber-snap",
  "swirl-in-fwd", "swirl-in-bck", "slit-in-vertical", "slit-in-horizontal",
  "bounce-in-top", "bounce-in-bottom", "roll-in-blurred-left", "roll-in-blurred-right",
  "slide-in-elliptic-top-fwd", "slide-in-elliptic-bottom-fwd", "puff-in-center",
  "swing-in-top-fwd", "swing-in-bottom-fwd", "swing-in-left-fwd", "swing-in-right-fwd", "scale-up-center"
];

const FAST_ANIMATIONS = [
  "stomp-pop", "cinematic-flash", "whip-zoom", "stomp-drop",
  "whip-pan-left", "whip-pan-right", "whip-pan-up", "whip-pan-down",
  "light-speed-in-right", "light-speed-in-left",
  "hyper-stomp", "flash-bang-zoom", "shatter-in", "whip-slam",
  "whip-slam-up", "whip-slam-left", "whip-slam-right", "glitch-drop",
  "flicker-in-1", "vibrate-in", "bounce-in-fwd", "slit-in-diagonal-1",
  "swirl-in-fwd-fast", "roll-in-blurred-top", "roll-in-blurred-bottom",
  "tilt-in-fwd-tr", "tilt-in-fwd-bl", "slide-in-blurred-tl", "slide-in-blurred-br", "bounce-in-extreme"
];

const IDLE_PAIRS = [
  ["idle-pan-left", "idle-pan-right"],
  ["idle-pan-right", "idle-pan-left"],
  ["idle-pan-up", "idle-pan-down"],
  ["idle-pan-down", "idle-pan-up"],
  ["idle-pan-left", "idle-pan-left"],
  ["idle-pan-right", "idle-pan-right"]
];

export const AnimatedLyric: React.FC<AnimatedLyricProps> = ({
  text,
  isEnabled = true,
  kineticTempo = 'fast',
}) => {
  // Determine if it's a multiline repetition
  const { isVerticalMarquee, isHorizontalMarquee, displayLines } =
    useMemo(() => {
      let rawText = text.trim();
      let isHoriz = false;

      // Check for explicit horizontal marquee trigger
      if (rawText.includes("_1")) {
        isHoriz = true;
        rawText = rawText.replace(/_1/g, "").trim();
        // Force all lines into a single line for the horizontal ticker
        rawText = rawText.replace(/\r?\n/g, "   ");
      }

      // Split into lines
      const lines = rawText.split(/\r?\n/).filter((l) => l.trim() !== "");

      let isVert = false;

      // Keep vertical marquee for explicitly repetitive 3+ line songs (like vamp loops)
      if (lines.length >= 3 && !isHoriz) {
        const firstLine = lines[0].toLowerCase().trim();
        const allLinesMatch = lines.every(
          (l) => l.toLowerCase().trim() === firstLine,
        );
        if (allLinesMatch) {
          isVert = true;
        }
      }

      return {
        isVerticalMarquee: isVert,
        isHorizontalMarquee: isHoriz,
        displayLines: lines,
      };
    }, [text]);

  const baseDuration = useMemo(() => {
    if (kineticTempo === 'slow') return '1.8s';
    if (kineticTempo === 'medium') return '0.8s';
    return '0.35s';
  }, [kineticTempo]);

  const marqueeDurationX = useMemo(() => {
    if (kineticTempo === 'slow') return '25s';
    if (kineticTempo === 'medium') return '15s';
    if (kineticTempo === 'fast') return '7s';
    return '15s';
  }, [kineticTempo]);

  const idleDuration = useMemo(() => {
    if (kineticTempo === 'slow') return '10s';
    if (kineticTempo === 'medium') return '6s';
    if (kineticTempo === 'fast') return '3s';
    return '6s';
  }, [kineticTempo]);

  const marqueeDurationY = useMemo(() => {
    if (kineticTempo === 'slow') return '8s';
    if (kineticTempo === 'medium') return '5s';
    if (kineticTempo === 'fast') return '2.5s';
    return '5s';
  }, [kineticTempo]);

  // Pick random animations per line (up to 2 lines for standard lyrics)
  const lineAnimations = useMemo(() => {
    if (isVerticalMarquee || isHorizontalMarquee) return [];

    let animPool = STANDARD_ANIMATIONS;
    if (kineticTempo === 'slow') animPool = SLOW_ANIMATIONS;
    if (kineticTempo === 'medium') animPool = MEDIUM_ANIMATIONS;
    if (kineticTempo === 'fast') animPool = FAST_ANIMATIONS;
    if (kineticTempo === 'random') animPool = STANDARD_ANIMATIONS;

    // Pick different random animations for line 1 and line 2
    const getRand = () =>
      animPool[Math.floor(Math.random() * animPool.length)];

    // 100% chance completely random for massive variety
    return [getRand(), getRand()];
  }, [isVerticalMarquee, isHorizontalMarquee, text, kineticTempo]); // re-roll on text change

  const lineIdleAnimations = useMemo(() => {
    return IDLE_PAIRS[Math.floor(Math.random() * IDLE_PAIRS.length)];
  }, [text, kineticTempo]);

  if (!isEnabled) {
    return <div className="lyric-container no-animation">{text}</div>;
  }

  return (
    // React `key` forcing ensures the element aggressively re-triggers on every text change
    <div
      key={text}
      className={`lyric-container ${isHorizontalMarquee ? "marquee-container-x" : ""} ${isVerticalMarquee ? "marquee-container-y" : ""}`}
    >
      {isHorizontalMarquee && (
        <div
          className="animate-whip-pan-left"
          style={{
            width: "100%",
            overflow: "hidden",
            animationDuration: "0.5s",
            animationFillMode: "forwards",
          }}
        >
          <div className="marquee-content-x" style={{ animationDuration: marqueeDurationX }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} style={{ paddingRight: "1.5vw" }}>
                {displayLines[0]}
              </span>
            ))}
          </div>
        </div>
      )}

      {isVerticalMarquee && (
        <div className="marquee-content-y" style={{ animationDuration: marqueeDurationY }}>
          {/* We take the first line and repeat it vertically */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="marquee-y-item">
              {displayLines[0]}
            </div>
          ))}
        </div>
      )}

      {!isVerticalMarquee && !isHorizontalMarquee && (
        <div className="lyric-lines-container">
          {displayLines.slice(0, 2).map((line, lineIndex) => {
            const lineAnim = lineAnimations[lineIndex] || "zoom-in";
            const words = line.split(/\s+/);
            const isSecondLine = lineIndex === 1;

            return (
              <div
                key={`line-${lineIndex}`}
                className="lyric-line"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  margin: "0",
                  lineHeight: "1.3",
                  padding: "0.1em 0",
                  color: isSecondLine ? "#FFD700" : "inherit",
                }}
              >
                {words.map((word, wordIndex) => (
                  <div
                    key={`${word}-${wordIndex}`}
                    className={`lyric-word animate-${lineAnim}`}
                    style={{
                      animationDuration: baseDuration,
                      animationDelay: `${lineIndex * 0.1 + wordIndex * 0.03}s`,
                    }}
                  >
                    <span
                      className={`lyric-word-inner ${lineIdleAnimations[lineIndex]}`}
                      style={{ animationDuration: idleDuration }}
                    >
                      {word}
                    </span>
                    &nbsp;
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
