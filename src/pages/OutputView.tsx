import { useState, useEffect } from "react";
import { useLive } from "../store/LiveContext";
import { AnimatedLyric } from "../components/AnimatedLyric";

const getRgba = (hex: string, opacity: number) => {
  if (!hex) return `rgba(0, 0, 0, ${opacity / 100})`;
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
};

const OutputView = ({ isPreview = false }: { isPreview?: boolean }) => {
  const { liveState } = useLive();
  const [displayState, setDisplayState] = useState(liveState);
  const [outgoingState, setOutgoingState] = useState<any>(null);

  useEffect(() => {
    setDisplayState((prev) => {
      if (
        liveState.text !== prev.text ||
        liveState.title !== prev.title ||
        liveState.type !== prev.type
      ) {
        if (prev.type !== "clear" && liveState.animation !== "none") {
          setOutgoingState(prev);
          setTimeout(
            () => {
              setOutgoingState(null);
            },
            liveState.enableKineticTypography ? 300 : 800,
          );
        } else {
          setOutgoingState(null);
        }
        return liveState;
      }
      return liveState;
    });
  }, [liveState]);

  const isExternalWindow = new URLSearchParams(window.location.search).get("autoFullscreen") === "true";

  useEffect(() => {
    if (isPreview) return;

    // Force the body to be transparent for OBS, overriding global.css
    document.body.style.backgroundColor = isExternalWindow ? "#000000" : "transparent";
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
  }, [isPreview, isExternalWindow]);

  const handleFullscreenClick = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .catch((err) => console.log(err));
    }
  };

  const renderBackground = () => {
    if (liveState.backgroundMode === "image" && liveState.backgroundUrl) {
      return (
        <img
          src={liveState.backgroundUrl}
          alt="background"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: -1,
          }}
        />
      );
    }
    if (liveState.backgroundMode === "video" && liveState.backgroundUrl) {
      return (
        <video
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
            zIndex: -1,
          }}
        >
          <source src={liveState.backgroundUrl} />
        </video>
      );
    }
    return null;
  };

  const renderProjectedContent = (state: any, isOutgoing: boolean) => {
    if (!state || state.type === "clear") return null;

    const isBgTransparent =
      state.type === "song"
        ? true
        : state.layout === "LT"
          ? !state.enableLowerThirdBg
          : state.transparentBackground;
    const isKinetic = state.type === "song" && state.enableKineticTypography;
    const animClass = isOutgoing
      ? isKinetic
        ? "kinetic-out"
        : `anim-${state.animation}-out`
      : `anim-${state.animation}-in`;

    let bgClass = isBgTransparent ? "transparent" : "normal";
    if (
      !isBgTransparent &&
      state.layout === "LT" &&
      state.type === "bible" &&
      state.bibleLowerThirdStyle === "torn-edge"
    ) {
      bgClass = "torn-edge";
    }

    const shadowVal =
      isBgTransparent && state.shadowIntensity > 0
        ? `0 ${state.shadowIntensity * 0.015}cqi ${state.shadowIntensity * 0.03}cqi rgba(0,0,0,${Math.min(state.shadowIntensity * 0.012, 1)}), 0 ${state.shadowIntensity * 0.005}cqi ${state.shadowIntensity * 0.01}cqi rgba(0,0,0,${Math.min(state.shadowIntensity * 0.008, 1)})`
        : "none";

    return (
      <div
        key={isOutgoing ? "outgoing" : "display-" + state.text + state.title}
        className={`projected-content layout-${state.layout} valign-${state.verticalAlign} halign-${state.horizontalAlign}`}
        style={{
          position: "absolute",
          zIndex: isOutgoing ? 1 : 2,
          fontFamily: state.fontFamily,
          paddingLeft: `${state.paddingLR}%`,
          paddingRight: `${state.paddingLR}%`,
          paddingBottom: state.layout === "LT" ? "2cqi" : "0",
          inset: 0,
          background: "transparent",
          color: state.textColor || "#ffffff",
        }}
      >
        <div
          className={`projected-box bg-${bgClass} ${isKinetic && !isOutgoing ? "" : animClass}`}
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
      </div>
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
          liveState.backgroundMode === "solid" &&
          !liveState.transparentBackground
            ? liveState.backgroundColor
            : isExternalWindow
              ? "#000000"
              : "transparent",
      }}
    >
      {renderBackground()}
      {renderProjectedContent(outgoingState, true)}
      {renderProjectedContent(displayState, false)}
      {!document.fullscreenElement && (
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            right: "10px",
            color: "rgba(255,255,255,0.3)",
            fontSize: "12px",
            pointerEvents: "none",
          }}
        >
          {/* Click to enter fullscreen */}
        </div>
      )}
    </div>
  );
};

export default OutputView;
