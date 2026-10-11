import { useEffect } from "react";
import { useLive } from "../store/LiveContext";
import { AnimatedLyric } from "../components/AnimatedLyric";
import { motion, AnimatePresence } from "framer-motion";

const getRgba = (hex: string, opacity: number) => {
  if (!hex) return `rgba(0, 0, 0, ${opacity / 100})`;
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
};

const OutputView = ({ isPreview = false }: { isPreview?: boolean }) => {
  const { liveState } = useLive();

  const isExternalWindow = new URLSearchParams(window.location.search).get("autoFullscreen") === "true";

  useEffect(() => {
    if (isPreview) return;

    // Set document body background according to live settings
    if (liveState.transparentBackground) {
      document.body.style.backgroundColor = "transparent";
    } else if (liveState.backgroundMode === "solid") {
      document.body.style.backgroundColor = liveState.backgroundColor || "#000000";
    } else {
      document.body.style.backgroundColor = "#000000";
    }
    document.body.style.overflow = "hidden";

    // Check for auto-fullscreen parameter (triggered by Window Management API)
    if (isExternalWindow) {
      const elem = document.documentElement;

      // Attempt immediate fullscreen (might fail without user gesture in this window)
      const attemptFs = () => {
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch((err) => {
            console.warn(
              `Fullscreen auto-fail: ${err.message}. Waiting for click.`,
            );
          });
        }
      };

      // Try it immediately
      attemptFs();

      // Try again when the window gets focus
      window.addEventListener("focus", attemptFs, { once: true });
    }

    return () => {
      document.body.style.backgroundColor = "";
      document.body.style.overflow = "";
    };
  }, [
    isPreview,
    isExternalWindow,
    liveState.backgroundMode,
    liveState.backgroundColor,
    liveState.transparentBackground,
  ]);

  const handleFullscreenClick = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .catch((err) => console.log(err));
    }
  };

  const dimValue =
    typeof liveState.backgroundDim === "number" ? liveState.backgroundDim : 25;

  const renderBackground = () => {
    if (liveState.backgroundMode === "image" && liveState.backgroundUrl) {
      return (
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 0,
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          <img
            key={liveState.backgroundUrl}
            src={liveState.backgroundUrl}
            alt="stage background"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
          {dimValue > 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: `rgba(0, 0, 0, ${dimValue / 100})`,
                pointerEvents: "none",
              }}
            />
          )}
        </div>
      );
    }
    if (liveState.backgroundMode === "video" && liveState.backgroundUrl) {
      return (
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 0,
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          <video
            key={liveState.backgroundUrl}
            src={liveState.backgroundUrl}
            autoPlay
            loop
            muted
            playsInline
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
          {dimValue > 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: `rgba(0, 0, 0, ${dimValue / 100})`,
                pointerEvents: "none",
              }}
            />
          )}
        </div>
      );
    }
    return null;
  };

  const renderProjectedContent = (state: any) => {
    if (!state || state.type === "clear") return null;

    const isBgTransparent =
      state.type === "song"
        ? true
        : state.layout === "LT"
          ? !state.enableLowerThirdBg
          : state.transparentBackground;
    const isKinetic = state.type === "song" && state.enableKineticTypography;

    let bgClass = isBgTransparent ? "transparent" : "normal";
    if (
      !isBgTransparent &&
      state.layout === "LT" &&
      state.type === "bible" &&
      state.bibleLowerThirdStyle === "torn-edge"
    ) {
      bgClass = "torn-edge";
    }

    const themeClass = state.layout === "LT" && state.type === "bible" && state.bibleLowerThirdStyle !== "none" ? state.bibleLowerThirdStyle : "";

    const shadowVal =
      isBgTransparent && state.shadowIntensity > 0
        ? `0 ${state.shadowIntensity * 0.015}cqi ${state.shadowIntensity * 0.03}cqi rgba(0,0,0,${Math.min(state.shadowIntensity * 0.012, 1)}), 0 ${state.shadowIntensity * 0.005}cqi ${state.shadowIntensity * 0.01}cqi rgba(0,0,0,${Math.min(state.shadowIntensity * 0.008, 1)})`
        : "none";

    const transition = { duration: 0.8, ease: [0.16, 1, 0.3, 1] };
    
    let variants = {};
    if (isKinetic) {
      if (state.animationTemplate === "zoom-in-bottom") {
        const tempoSec =
          state.kineticTempo === "slow"
            ? 0.85
            : state.kineticTempo === "medium"
              ? 0.55
              : 0.38;
        const exitSec = tempoSec * 0.82;

        variants = {
          initial: {
            opacity: 0,
            y: "7cqi",
            scale: 0.8,
            filter: "blur(6px)",
            zIndex: 3,
          },
          animate: {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            zIndex: 3,
            transition: {
              duration: tempoSec,
              ease: [0.16, 1, 0.3, 1],
            },
          },
          exit: {
            opacity: 0,
            y: "-7cqi",
            scale: 1.05,
            filter: "blur(6px)",
            zIndex: 2,
            transition: {
              duration: exitSec,
              ease: [0.25, 1, 0.5, 1],
            },
          },
        };
      } else {
        variants = {
          initial: { opacity: 1, zIndex: 3 },
          animate: { opacity: 1, zIndex: 3 },
          exit: {
            opacity: 0,
            y: "-4cqi",
            filter: "blur(8px)",
            zIndex: 2,
            transition: { duration: 0.32, ease: [0.25, 1, 0.5, 1] },
          },
        };
      }
    } else if (state.animation === "zoom") {
      variants = {
        initial: { opacity: 0, scale: 0.9, filter: "blur(6px)" },
        animate: { opacity: 1, scale: 1, filter: "blur(0px)", transition },
        exit: { opacity: 0, scale: 1.1, filter: "blur(6px)", transition }
      };
    } else if (state.animation === "slide") {
      variants = {
        initial: { opacity: 0, y: "4cqi", filter: "blur(4px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)", transition },
        exit: { opacity: 0, y: "-4cqi", filter: "blur(4px)", transition }
      };
    } else if (state.animation === "fade") {
      variants = {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition },
        exit: { opacity: 0, transition }
      };
    } else {
      variants = {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 0, transition: { duration: 0.1 } }
      };
    }

    return (
      <motion.div
        key={"display-" + state.text + state.title}
        className={`projected-content layout-${state.layout} valign-${state.verticalAlign} halign-${state.horizontalAlign} ${themeClass}`}
        style={{
          position: "absolute",
          zIndex: 2,
          fontFamily: state.fontFamily,
          paddingLeft: `${state.paddingLR}%`,
          paddingRight: `${state.paddingLR}%`,
          paddingBottom: state.layout === "LT" ? "2cqi" : "0",
          inset: 0,
          background: "transparent",
          color: state.textColor || "#ffffff",
        }}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
      >
        <div
          className={`projected-box bg-${bgClass}`}
          style={{
            width: state.layout === "LT" ? `${state.lowerThirdWidth}%` : "100%",
            height: state.layout === "FS" ? "100%" : "auto",
            padding:
              state.layout === "FS"
                ? state.transparentBackground
                  ? "4cqi"
                  : "6cqi"
                : `${state.lowerThirdPadding ?? 3}cqi 4cqi`,
            background:
              state.layout === "LT"
                ? bgClass === "transparent"
                  ? "transparent"
                  : getRgba(
                      state.lowerThirdBgColor || "#000000",
                      state.lowerThirdBgOpacity ?? 50,
                    )
                : "transparent",
            textShadow: shadowVal,
            display: "flex",
            flexDirection: "column",
            alignItems:
              state.horizontalAlign === "left"
                ? "flex-start"
                : state.horizontalAlign === "right"
                  ? "flex-end"
                  : "center",
            justifyContent:
              state.layout === "FS"
                ? state.verticalAlign === "top"
                  ? "flex-start"
                  : state.verticalAlign === "bottom"
                    ? "flex-end"
                    : "center"
                : "center",
            gap: "1cqi",
          }}
        >
          {state.title &&
            state.type === "bible" &&
            state.refPosition === "top" && (
              <div
                className="projected-title"
                style={{
                  width: "100%",
                  textAlign: state.refAlign as any,
                  color: state.refColor,
                  fontSize: `${state.refFontSize * (state.layout === "LT" ? 0.6 : 1)}cqi`,
                  fontFamily: state.fontFamily,
                  margin: 0,
                  marginBottom: "0.5cqi",
                  textTransform:
                    state.refTextTransform !== "none"
                      ? (state.refTextTransform as any)
                      : undefined,
                  fontWeight: state.refFontWeight,
                }}
              >
                {state.title}
              </div>
            )}

          <div
            className="projected-text"
            style={{
              width: "100%",
              textAlign: state.horizontalAlign as any,
              color: state.textColor,
              fontSize: `${(state.type === "bible" ? state.bibleFontSize : state.songFontSize) * (state.layout === "LT" ? 0.6 : 1)}cqi`,
              fontFamily: state.fontFamily,
              whiteSpace: "pre-wrap",
              lineHeight: 1.3,
              textTransform:
                state.type === "song"
                  ? state.songTextTransform !== "none"
                    ? (state.songTextTransform as any)
                    : undefined
                  : state.bibleTextTransform !== "none"
                    ? (state.bibleTextTransform as any)
                    : undefined,
              fontWeight:
                state.type === "song"
                  ? state.songFontWeight
                  : state.bibleFontWeight,
            }}
          >
            {state.type === "song" && state.enableKineticTypography ? (
              <AnimatedLyric
                text={state.text}
                isEnabled={true}
                kineticTempo={state.kineticTempo}
                animationTemplate={state.animationTemplate}
                disableIntro={state.animationTemplate === "zoom-in-bottom"}
              />
            ) : (
              state.text
            )}
          </div>

          {state.title &&
            state.type === "bible" &&
            state.refPosition === "bottom" && (
              <div
                className="projected-title"
                style={{
                  width: "100%",
                  textAlign: state.refAlign as any,
                  color: state.refColor,
                  fontSize: `${state.refFontSize * (state.layout === "LT" ? 0.6 : 1)}cqi`,
                  fontFamily: state.fontFamily,
                  margin: 0,
                  marginTop: "0.5cqi",
                  textTransform:
                    state.refTextTransform !== "none"
                      ? (state.refTextTransform as any)
                      : undefined,
                  fontWeight: state.refFontWeight,
                }}
              >
                {state.title}
              </div>
            )}
        </div>
      </motion.div>
    );
  };

  return (
    <div
      className="output-view"
      onClick={!isPreview ? handleFullscreenClick : undefined}
      style={{
        cursor: !isPreview ? "pointer" : "default",
        height: isPreview ? "100%" : "100vh",
        width: isPreview ? "100%" : "100cqi",
        containerType: "inline-size",
        overflow: "hidden",
        position: "relative",
        backgroundColor:
          liveState.backgroundMode === "solid"
            ? liveState.transparentBackground
              ? "transparent"
              : liveState.backgroundColor || "#050505"
            : liveState.backgroundUrl
              ? "#000000"
              : liveState.backgroundColor || "#050505",
      }}
    >
      {renderBackground()}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <AnimatePresence mode="sync">
          {renderProjectedContent(liveState)}
        </AnimatePresence>
      </div>
      {!document.fullscreenElement && !isPreview && (
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            right: "10px",
            color: "rgba(255,255,255,0.3)",
            fontSize: "12px",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          {/* Click to enter fullscreen */}
        </div>
      )}
    </div>
  );
};

export default OutputView;
