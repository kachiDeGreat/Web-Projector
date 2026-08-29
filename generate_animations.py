import re
import os

css_content = """
/* =========================================
   MEGA ANIMATION PACK (110+ ANIMATIONS)
   ========================================= */

/* SLOW IDLE (20 Total) */
.idle-golden-aura { animation: idle-golden-aura 4s ease-in-out infinite alternate; }
@keyframes idle-golden-aura { 0% { text-shadow: 0 0 10px rgba(255,215,0,0.3); } 100% { text-shadow: 0 0 30px rgba(255,215,0,0.8), 0 0 50px rgba(255,215,0,0.4); } }
.idle-breathe-wide { animation: idle-breathe-wide 5s ease-in-out infinite alternate; }
@keyframes idle-breathe-wide { 0% { letter-spacing: normal; transform: scale(1); } 100% { letter-spacing: 0.05em; transform: scale(1.02); } }
.idle-zenith-float { animation: idle-zenith-float 6s ease-in-out infinite alternate; }
@keyframes idle-zenith-float { 0% { transform: translateY(0) scale(1); } 100% { transform: translateY(-15px) scale(1.02); } }
.idle-subtle-hue-shift { animation: idle-subtle-hue-shift 8s linear infinite; }
@keyframes idle-subtle-hue-shift { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(30deg); } }
.idle-slow-pan { animation: idle-slow-pan 10s ease-in-out infinite alternate; }
@keyframes idle-slow-pan { 0% { transform: translateX(-10px); } 100% { transform: translateX(10px); } }
.idle-majestic-pulse { animation: idle-majestic-pulse 4s ease-in-out infinite alternate; }
@keyframes idle-majestic-pulse { 0% { opacity: 0.8; filter: brightness(1); } 100% { opacity: 1; filter: brightness(1.3); } }
.idle-soft-blur { animation: idle-soft-blur 5s ease-in-out infinite alternate; }
@keyframes idle-soft-blur { 0% { filter: blur(0px); } 100% { filter: blur(2px); } }
.idle-drift-z { animation: idle-drift-z 6s ease-in-out infinite alternate; transform-style: preserve-3d; }
@keyframes idle-drift-z { 0% { transform: perspective(1000px) translateZ(0); } 100% { transform: perspective(1000px) translateZ(30px); } }
.idle-slow-rock { animation: idle-slow-rock 5s ease-in-out infinite alternate; }
@keyframes idle-slow-rock { 0% { transform: rotate(-2deg); } 100% { transform: rotate(2deg); } }
.idle-ghost-glow { animation: idle-ghost-glow 6s ease-in-out infinite alternate; }
@keyframes idle-ghost-glow { 0% { text-shadow: 0 0 0 transparent; opacity: 1; } 100% { text-shadow: 0 0 20px rgba(255,255,255,0.8); opacity: 0.9; } }
.idle-ocean-wave { animation: idle-ocean-wave 4s ease-in-out infinite alternate; }
@keyframes idle-ocean-wave { 0% { transform: translateY(0) rotate(0deg); } 100% { transform: translateY(10px) rotate(1deg); } }
.idle-ambient-shift { animation: idle-ambient-shift 7s ease-in-out infinite alternate; }
@keyframes idle-ambient-shift { 0% { filter: contrast(1); } 100% { filter: contrast(1.2) brightness(1.1); } }
.idle-slow-zoom-pan { animation: idle-slow-zoom-pan 8s ease-in-out infinite alternate; }
@keyframes idle-slow-zoom-pan { 0% { transform: scale(1) translateX(0); } 100% { transform: scale(1.03) translateX(10px); } }
.idle-ethereal { animation: idle-ethereal 5s ease-in-out infinite alternate; }
@keyframes idle-ethereal { 0% { opacity: 1; filter: saturate(1); } 100% { opacity: 0.8; filter: saturate(1.5); } }
.idle-levitate { animation: idle-levitate 4.5s ease-in-out infinite alternate; }
@keyframes idle-levitate { 0% { transform: translateY(0) scale(1); } 100% { transform: translateY(-8px) scale(1.01); } }
.idle-breathe-blur { animation: idle-breathe-blur 6s ease-in-out infinite alternate; }
@keyframes idle-breathe-blur { 0% { filter: blur(0); transform: scale(1); } 100% { filter: blur(1.5px); transform: scale(1.02); } }
.idle-silver-lining { animation: idle-silver-lining 5s ease-in-out infinite alternate; }
@keyframes idle-silver-lining { 0% { text-shadow: none; } 100% { text-shadow: 0 0 15px rgba(200,200,200,0.6); } }
.idle-slow-nod { animation: idle-slow-nod 5s ease-in-out infinite alternate; }
@keyframes idle-slow-nod { 0% { transform: rotateX(0deg); } 100% { transform: rotateX(10deg); } }
.idle-gentle-tilt { animation: idle-gentle-tilt 4s ease-in-out infinite alternate; }
@keyframes idle-gentle-tilt { 0% { transform: skewY(0deg); } 100% { transform: skewY(2deg); } }
.idle-subtle-scale { animation: idle-subtle-scale 7s ease-in-out infinite alternate; }
@keyframes idle-subtle-scale { 0% { transform: scale3d(1,1,1); } 100% { transform: scale3d(1.04, 1.04, 1.04); } }


/* MEDIUM IDLE (20 Total) */
.idle-wave-bob { animation: idle-wave-bob 2s ease-in-out infinite alternate; }
@keyframes idle-wave-bob { 0% { transform: translateY(0); } 100% { transform: translateY(-15px); } }
.idle-pendulum { animation: idle-pendulum 3s ease-in-out infinite alternate; }
@keyframes idle-pendulum { 0% { transform: rotate(-5deg); transform-origin: top center; } 100% { transform: rotate(5deg); transform-origin: top center; } }
.idle-elastic-pulse { animation: idle-elastic-pulse 1.5s ease-in-out infinite alternate; }
@keyframes idle-elastic-pulse { 0% { transform: scale(1); } 100% { transform: scale(1.1); } }
.idle-3d-tilt { animation: idle-3d-tilt 3s ease-in-out infinite alternate; transform-style: preserve-3d; }
@keyframes idle-3d-tilt { 0% { transform: perspective(500px) rotateY(-10deg); } 100% { transform: perspective(500px) rotateY(10deg); } }
.idle-jiggle { animation: idle-jiggle 2.5s ease-in-out infinite alternate; }
@keyframes idle-jiggle { 0% { transform: skewX(-5deg); } 100% { transform: skewX(5deg); } }
.idle-bounce-hover { animation: idle-bounce-hover 1.8s ease-in-out infinite alternate; }
@keyframes idle-bounce-hover { 0% { transform: translateY(0); } 100% { transform: translateY(-10px); } }
.idle-color-throb { animation: idle-color-throb 2s ease-in-out infinite alternate; }
@keyframes idle-color-throb { 0% { filter: hue-rotate(0) brightness(1); } 100% { filter: hue-rotate(45deg) brightness(1.2); } }
.idle-rubber-bob { animation: idle-rubber-bob 2s ease-in-out infinite alternate; }
@keyframes idle-rubber-bob { 0% { transform: scaleY(1); } 100% { transform: scaleY(1.1) scaleX(0.95); } }
.idle-swing-z { animation: idle-swing-z 3s ease-in-out infinite alternate; }
@keyframes idle-swing-z { 0% { transform: perspective(400px) translateZ(-20px); } 100% { transform: perspective(400px) translateZ(20px); } }
.idle-shake-y { animation: idle-shake-y 1.5s ease-in-out infinite alternate; }
@keyframes idle-shake-y { 0% { transform: translateY(-5px); } 100% { transform: translateY(5px); } }
.idle-shake-x { animation: idle-shake-x 1.5s ease-in-out infinite alternate; }
@keyframes idle-shake-x { 0% { transform: translateX(-5px); } 100% { transform: translateX(5px); } }
.idle-flip-flap { animation: idle-flip-flap 3s ease-in-out infinite alternate; }
@keyframes idle-flip-flap { 0% { transform: rotateX(-15deg); } 100% { transform: rotateX(15deg); } }
.idle-pulse-glow { animation: idle-pulse-glow 2s ease-in-out infinite alternate; }
@keyframes idle-pulse-glow { 0% { transform: scale(1); text-shadow: 0 0 5px rgba(255,255,255,0.5); } 100% { transform: scale(1.05); text-shadow: 0 0 20px rgba(255,255,255,0.8); } }
.idle-roll-bob { animation: idle-roll-bob 2.5s ease-in-out infinite alternate; }
@keyframes idle-roll-bob { 0% { transform: rotate(-3deg) translateY(-5px); } 100% { transform: rotate(3deg) translateY(5px); } }
.idle-squish { animation: idle-squish 2s ease-in-out infinite alternate; }
@keyframes idle-squish { 0% { transform: scaleX(1); } 100% { transform: scaleX(1.05) scaleY(0.95); } }
.idle-skew-bob { animation: idle-skew-bob 2.2s ease-in-out infinite alternate; }
@keyframes idle-skew-bob { 0% { transform: skewX(-4deg) translateY(-4px); } 100% { transform: skewX(4deg) translateY(4px); } }
.idle-heartbeat-slow { animation: idle-heartbeat-slow 1.5s ease-in-out infinite alternate; }
@keyframes idle-heartbeat-slow { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
.idle-jolt { animation: idle-jolt 2s cubic-bezier(.36,.07,.19,.97) infinite alternate; }
@keyframes idle-jolt { 0% { transform: translateX(0); } 100% { transform: translateX(8px); } }
.idle-tilt-pan { animation: idle-tilt-pan 3s ease-in-out infinite alternate; }
@keyframes idle-tilt-pan { 0% { transform: rotate(-2deg) translateX(-5px); } 100% { transform: rotate(2deg) translateX(5px); } }
.idle-spring-bob { animation: idle-spring-bob 1.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite alternate; }
@keyframes idle-spring-bob { 0% { transform: translateY(0); } 100% { transform: translateY(-12px); } }


/* FAST IDLE (20 Total) */
.idle-glitch-jitter { animation: idle-glitch-jitter 0.2s linear infinite; }
@keyframes idle-glitch-jitter { 0% { transform: translate(1px,1px); } 25% { transform: translate(-1px,-1px); } 50% { transform: translate(1px,-1px); } 75% { transform: translate(-1px,1px); } 100% { transform: translate(1px,1px); } }
.idle-seismic-tremor { animation: idle-seismic-tremor 0.1s linear infinite; }
@keyframes idle-seismic-tremor { 0% { transform: translateX(-2px); } 100% { transform: translateX(2px); } }
.idle-strobe-flash { animation: idle-strobe-flash 0.5s step-end infinite; }
@keyframes idle-strobe-flash { 0% { opacity: 1; } 50% { opacity: 0.8; filter: invert(0.1); } }
.idle-rapid-shake { animation: idle-rapid-shake 0.3s ease-in-out infinite alternate; }
@keyframes idle-rapid-shake { 0% { transform: rotate(-3deg); } 100% { transform: rotate(3deg); } }
.idle-hyper-pulse { animation: idle-hyper-pulse 0.4s ease-in-out infinite alternate; }
@keyframes idle-hyper-pulse { 0% { transform: scale(1); } 100% { transform: scale(1.15); } }
.idle-vibrate { animation: idle-vibrate 0.15s linear infinite alternate; }
@keyframes idle-vibrate { 0% { transform: skewX(-2deg) translateY(-2px); } 100% { transform: skewX(2deg) translateY(2px); } }
.idle-glitch-skew { animation: idle-glitch-skew 0.3s linear infinite alternate; }
@keyframes idle-glitch-skew { 0% { transform: skewX(-10deg); filter: hue-rotate(-20deg); } 100% { transform: skewX(10deg); filter: hue-rotate(20deg); } }
.idle-shiver { animation: idle-shiver 0.2s ease-in-out infinite alternate; }
@keyframes idle-shiver { 0% { transform: translateX(-3px) rotate(-1deg); } 100% { transform: translateX(3px) rotate(1deg); } }
.idle-rapid-bob { animation: idle-rapid-bob 0.4s ease-in-out infinite alternate; }
@keyframes idle-rapid-bob { 0% { transform: translateY(-5px); } 100% { transform: translateY(5px); } }
.idle-flash-glow { animation: idle-flash-glow 0.5s ease-in-out infinite alternate; }
@keyframes idle-flash-glow { 0% { text-shadow: 0 0 10px white; } 100% { text-shadow: 0 0 30px white, 0 0 50px yellow; transform: scale(1.05); } }
.idle-twitch { animation: idle-twitch 0.8s linear infinite; }
@keyframes idle-twitch { 0%, 90% { transform: translateX(0); } 95% { transform: translateX(-5px) skewX(-10deg); } 100% { transform: translateX(5px) skewX(10deg); } }
.idle-snap-pulse { animation: idle-snap-pulse 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite alternate; }
@keyframes idle-snap-pulse { 0% { transform: scale(1); } 100% { transform: scale(1.1); } }
.idle-flicker { animation: idle-flicker 0.3s linear infinite; }
@keyframes idle-flicker { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
.idle-zap { animation: idle-zap 0.2s linear infinite alternate; }
@keyframes idle-zap { 0% { transform: scaleY(1); } 100% { transform: scaleY(1.2) scaleX(0.9); } }
.idle-thrash { animation: idle-thrash 0.3s linear infinite alternate; }
@keyframes idle-thrash { 0% { transform: rotate(-5deg) translateY(-3px); } 100% { transform: rotate(5deg) translateY(3px); } }
.idle-tremble-z { animation: idle-tremble-z 0.2s linear infinite alternate; }
@keyframes idle-tremble-z { 0% { transform: perspective(400px) translateZ(-10px); } 100% { transform: perspective(400px) translateZ(10px); } }
.idle-stutter { animation: idle-stutter 0.5s step-end infinite; }
@keyframes idle-stutter { 0% { transform: translateX(0); } 50% { transform: translateX(5px); } }
.idle-bounce-fast { animation: idle-bounce-fast 0.4s cubic-bezier(0.28, 0.84, 0.42, 1) infinite alternate; }
@keyframes idle-bounce-fast { 0% { transform: translateY(0); } 100% { transform: translateY(-15px); } }
.idle-glitch-blur { animation: idle-glitch-blur 0.3s linear infinite alternate; }
@keyframes idle-glitch-blur { 0% { filter: blur(0px); transform: skewX(0); } 100% { filter: blur(3px); transform: skewX(-5deg); } }
.idle-heartbeat-fast { animation: idle-heartbeat-fast 0.5s ease-in-out infinite alternate; }
@keyframes idle-heartbeat-fast { 0% { transform: scale(1); } 100% { transform: scale(1.15); } }


/* =========================================
   60 NEW ENTRANCE ANIMATIONS (To reach 100)
   ========================================= */

/* SLOW ENTRANCES (20 Total) */
.animate-cinematic-unmask { animation-name: cinematic-unmask; }
@keyframes cinematic-unmask { 0% { opacity: 0; filter: blur(20px); transform: scale(1.1) translateY(20px); } 100% { opacity: 1; filter: blur(0); transform: scale(1) translateY(0); } }
.animate-slow-rise-blur { animation-name: slow-rise-blur; }
@keyframes slow-rise-blur { 0% { opacity: 0; filter: blur(10px); transform: translateY(50px); } 100% { opacity: 1; filter: blur(0); transform: translateY(0); } }
.animate-majestic-fade-track { animation-name: majestic-fade-track; }
@keyframes majestic-fade-track { 0% { opacity: 0; letter-spacing: -0.1em; transform: scale(0.95); } 100% { opacity: 1; letter-spacing: normal; transform: scale(1); } }
.animate-ghost-reveal { animation-name: ghost-reveal; }
@keyframes ghost-reveal { 0% { opacity: 0; filter: blur(15px) grayscale(100%); transform: translateZ(-100px); } 100% { opacity: 1; filter: blur(0) grayscale(0%); transform: translateZ(0); } }
.animate-fade-in-up-slow { animation-name: fade-in-up-slow; }
@keyframes fade-in-up-slow { 0% { opacity: 0; transform: translateY(30px); } 100% { opacity: 1; transform: translateY(0); } }
.animate-fade-in-down-slow { animation-name: fade-in-down-slow; }
@keyframes fade-in-down-slow { 0% { opacity: 0; transform: translateY(-30px); } 100% { opacity: 1; transform: translateY(0); } }
.animate-zoom-in-soft { animation-name: zoom-in-soft; }
@keyframes zoom-in-soft { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }
.rotate-in-slow { animation-name: rotate-in-slow; }
@keyframes rotate-in-slow { 0% { opacity: 0; transform: rotate(-5deg); } 100% { opacity: 1; transform: rotate(0); } }
.animate-slide-up-fade { animation-name: slide-up-fade; }
@keyframes slide-up-fade { 0% { opacity: 0; transform: translateY(100px); } 100% { opacity: 1; transform: translateY(0); } }
.animate-slide-down-fade { animation-name: slide-down-fade; }
@keyframes slide-down-fade { 0% { opacity: 0; transform: translateY(-100px); } 100% { opacity: 1; transform: translateY(0); } }
.animate-slide-left-fade { animation-name: slide-left-fade; }
@keyframes slide-left-fade { 0% { opacity: 0; transform: translateX(100px); } 100% { opacity: 1; transform: translateX(0); } }
.animate-slide-right-fade { animation-name: slide-right-fade; }
@keyframes slide-right-fade { 0% { opacity: 0; transform: translateX(-100px); } 100% { opacity: 1; transform: translateX(0); } }
.animate-blur-expand { animation-name: blur-expand; }
@keyframes blur-expand { 0% { opacity: 0; filter: blur(10px); transform: scale(0.5); } 100% { opacity: 1; filter: blur(0); transform: scale(1); } }
.animate-blur-contract { animation-name: blur-contract; }
@keyframes blur-contract { 0% { opacity: 0; filter: blur(10px); transform: scale(1.5); } 100% { opacity: 1; filter: blur(0); transform: scale(1); } }
.animate-tilt-in-fwd-up { animation-name: tilt-in-fwd-up; }
@keyframes tilt-in-fwd-up { 0% { opacity: 0; transform: rotateY(20deg) rotateX(35deg) translate(0, 300px) skew(-35deg, 10deg); } 100% { opacity: 1; transform: rotateY(0) rotateX(0deg) translate(0, 0) skew(0deg, 0deg); } }
.animate-tilt-in-fwd-down { animation-name: tilt-in-fwd-down; }
@keyframes tilt-in-fwd-down { 0% { opacity: 0; transform: rotateY(-20deg) rotateX(-35deg) translate(0, -300px) skew(35deg, -10deg); } 100% { opacity: 1; transform: rotateY(0) rotateX(0deg) translate(0, 0) skew(0deg, 0deg); } }
.animate-tilt-in-bottom-1 { animation-name: tilt-in-bottom-1; }
@keyframes tilt-in-bottom-1 { 0% { opacity: 0; transform: rotateY(30deg) translateY(300px) skewY(-30deg); } 100% { opacity: 1; transform: rotateY(0deg) translateY(0) skewY(0deg); } }
.animate-tilt-in-top-1 { animation-name: tilt-in-top-1; }
@keyframes tilt-in-top-1 { 0% { opacity: 0; transform: rotateY(-30deg) translateY(-300px) skewY(30deg); } 100% { opacity: 1; transform: rotateY(0deg) translateY(0) skewY(0deg); } }
.animate-focus-in { animation-name: focus-in; }
@keyframes focus-in { 0% { opacity: 0; filter: blur(12px); letter-spacing: -0.5em; } 100% { opacity: 1; filter: blur(0); letter-spacing: normal; } }
.animate-focus-in-expand { animation-name: focus-in-expand; }
@keyframes focus-in-expand { 0% { opacity: 0; filter: blur(12px); letter-spacing: 0.5em; } 100% { opacity: 1; filter: blur(0); letter-spacing: normal; } }


/* MEDIUM ENTRANCES (20 Total) */
.animate-elastic-drop { animation-name: elastic-drop; animation-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55); }
@keyframes elastic-drop { 0% { opacity: 0; transform: translateY(-200px) scaleY(1.5); } 100% { opacity: 1; transform: translateY(0) scaleY(1); } }
.animate-cartwheel-in { animation-name: cartwheel-in; }
@keyframes cartwheel-in { 0% { opacity: 0; transform: translateX(-200px) rotate(-360deg); } 100% { opacity: 1; transform: translateX(0) rotate(0); } }
.animate-flip-bounce-y { animation-name: flip-bounce-y; animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes flip-bounce-y { 0% { opacity: 0; transform: perspective(400px) rotateY(90deg); } 100% { opacity: 1; transform: perspective(400px) rotateY(0deg); } }
.animate-rubber-snap { animation-name: rubber-snap; }
@keyframes rubber-snap { 0% { opacity: 0; transform: scale3d(0, 0, 0); } 30% { opacity: 1; transform: scale3d(1.25, 0.75, 1); } 40% { transform: scale3d(0.75, 1.25, 1); } 50% { transform: scale3d(1.15, 0.85, 1); } 65% { transform: scale3d(0.95, 1.05, 1); } 75% { transform: scale3d(1.05, 0.95, 1); } 100% { opacity: 1; transform: scale3d(1, 1, 1); } }
.animate-swirl-in-fwd { animation-name: swirl-in-fwd; }
@keyframes swirl-in-fwd { 0% { opacity: 0; transform: rotate(-540deg) scale(0); } 100% { opacity: 1; transform: rotate(0) scale(1); } }
.animate-swirl-in-bck { animation-name: swirl-in-bck; }
@keyframes swirl-in-bck { 0% { opacity: 0; transform: rotate(540deg) scale(2); } 100% { opacity: 1; transform: rotate(0) scale(1); } }
.animate-slit-in-vertical { animation-name: slit-in-vertical; animation-timing-function: ease-out; }
@keyframes slit-in-vertical { 0% { opacity: 0; transform: translateZ(-800px) rotateY(90deg); filter: blur(10px); } 54% { transform: translateZ(-160px) rotateY(87deg); filter: blur(2px); opacity: 1; } 100% { opacity: 1; transform: translateZ(0) rotateY(0); filter: blur(0); } }
.animate-slit-in-horizontal { animation-name: slit-in-horizontal; animation-timing-function: ease-out; }
@keyframes slit-in-horizontal { 0% { opacity: 0; transform: translateZ(-800px) rotateX(90deg); filter: blur(10px); } 54% { transform: translateZ(-160px) rotateX(87deg); filter: blur(2px); opacity: 1; } 100% { opacity: 1; transform: translateZ(0) rotateX(0); filter: blur(0); } }
.animate-bounce-in-top { animation-name: bounce-in-top; }
@keyframes bounce-in-top { 0% { opacity: 0; transform: translateY(-500px); animation-timing-function: ease-in; } 38% { opacity: 1; transform: translateY(0); animation-timing-function: ease-out; } 55% { transform: translateY(-65px); animation-timing-function: ease-in; } 72% { transform: translateY(0); animation-timing-function: ease-out; } 81% { transform: translateY(-28px); animation-timing-function: ease-in; } 90% { transform: translateY(0); animation-timing-function: ease-out; } 95% { transform: translateY(-8px); animation-timing-function: ease-in; } 100% { opacity: 1; transform: translateY(0); animation-timing-function: ease-out; } }
.animate-bounce-in-bottom { animation-name: bounce-in-bottom; }
@keyframes bounce-in-bottom { 0% { opacity: 0; transform: translateY(500px); animation-timing-function: ease-in; } 38% { opacity: 1; transform: translateY(0); animation-timing-function: ease-out; } 55% { transform: translateY(65px); animation-timing-function: ease-in; } 72% { transform: translateY(0); animation-timing-function: ease-out; } 81% { transform: translateY(28px); animation-timing-function: ease-in; } 90% { transform: translateY(0); animation-timing-function: ease-out; } 95% { transform: translateY(8px); animation-timing-function: ease-in; } 100% { opacity: 1; transform: translateY(0); animation-timing-function: ease-out; } }
.animate-roll-in-blurred-left { animation-name: roll-in-blurred-left; }
@keyframes roll-in-blurred-left { 0% { opacity: 0; transform: translateX(-1000px) rotate(-720deg); filter: blur(50px); } 100% { opacity: 1; transform: translateX(0) rotate(0deg); filter: blur(0); } }
.animate-roll-in-blurred-right { animation-name: roll-in-blurred-right; }
@keyframes roll-in-blurred-right { 0% { opacity: 0; transform: translateX(1000px) rotate(720deg); filter: blur(50px); } 100% { opacity: 1; transform: translateX(0) rotate(0deg); filter: blur(0); } }
.animate-slide-in-elliptic-top-fwd { animation-name: slide-in-elliptic-top-fwd; animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94); }
@keyframes slide-in-elliptic-top-fwd { 0% { opacity: 0; transform: translateY(-600px) rotateX(-30deg) scale(0); transform-origin: 50% 100%; } 100% { opacity: 1; transform: translateY(0) rotateX(0) scale(1); transform-origin: 50% 1400px; } }
.animate-slide-in-elliptic-bottom-fwd { animation-name: slide-in-elliptic-bottom-fwd; animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94); }
@keyframes slide-in-elliptic-bottom-fwd { 0% { opacity: 0; transform: translateY(600px) rotateX(30deg) scale(0); transform-origin: 50% 100%; } 100% { opacity: 1; transform: translateY(0) rotateX(0) scale(1); transform-origin: 50% -1400px; } }
.animate-puff-in-center { animation-name: puff-in-center; animation-timing-function: cubic-bezier(0.47, 0, 0.745, 0.715); }
@keyframes puff-in-center { 0% { opacity: 0; transform: scale(2); filter: blur(4px); } 100% { opacity: 1; transform: scale(1); filter: blur(0px); } }
.animate-swing-in-top-fwd { animation-name: swing-in-top-fwd; animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes swing-in-top-fwd { 0% { opacity: 0; transform: rotateX(-100deg); transform-origin: top; } 100% { opacity: 1; transform: rotateX(0deg); transform-origin: top; } }
.animate-swing-in-bottom-fwd { animation-name: swing-in-bottom-fwd; animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes swing-in-bottom-fwd { 0% { opacity: 0; transform: rotateX(100deg); transform-origin: bottom; } 100% { opacity: 1; transform: rotateX(0deg); transform-origin: bottom; } }
.animate-swing-in-left-fwd { animation-name: swing-in-left-fwd; animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes swing-in-left-fwd { 0% { opacity: 0; transform: rotateY(-100deg); transform-origin: left; } 100% { opacity: 1; transform: rotateY(0deg); transform-origin: left; } }
.animate-swing-in-right-fwd { animation-name: swing-in-right-fwd; animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes swing-in-right-fwd { 0% { opacity: 0; transform: rotateY(100deg); transform-origin: right; } 100% { opacity: 1; transform: rotateY(0deg); transform-origin: right; } }
.animate-scale-up-center { animation-name: scale-up-center; animation-timing-function: cubic-bezier(0.39, 0.575, 0.565, 1); }
@keyframes scale-up-center { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }


/* FAST ENTRANCES (20 Total) */
.animate-hyper-stomp { animation-name: hyper-stomp; animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 2.5); }
@keyframes hyper-stomp { 0% { opacity: 0; transform: scale(5) translateY(-100px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
.animate-flash-bang-zoom { animation-name: flash-bang-zoom; }
@keyframes flash-bang-zoom { 0% { opacity: 0; transform: scale(3); filter: brightness(3) blur(20px); } 100% { opacity: 1; transform: scale(1); filter: brightness(1) blur(0); } }
.animate-shatter-in { animation-name: shatter-in; }
@keyframes shatter-in { 0% { opacity: 0; transform: scale(0) rotate(180deg) skewX(50deg); filter: blur(10px); } 100% { opacity: 1; transform: scale(1) rotate(0) skewX(0); filter: blur(0); } }
.animate-whip-slam { animation-name: whip-slam; animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 2); }
@keyframes whip-slam { 0% { opacity: 0; transform: translateY(-200%) scaleY(2); } 100% { opacity: 1; transform: translateY(0) scaleY(1); } }
.animate-whip-slam-up { animation-name: whip-slam-up; animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 2); }
@keyframes whip-slam-up { 0% { opacity: 0; transform: translateY(200%) scaleY(2); } 100% { opacity: 1; transform: translateY(0) scaleY(1); } }
.animate-whip-slam-left { animation-name: whip-slam-left; animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 2); }
@keyframes whip-slam-left { 0% { opacity: 0; transform: translateX(-200%) scaleX(2); } 100% { opacity: 1; transform: translateX(0) scaleX(1); } }
.animate-whip-slam-right { animation-name: whip-slam-right; animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 2); }
@keyframes whip-slam-right { 0% { opacity: 0; transform: translateX(200%) scaleX(2); } 100% { opacity: 1; transform: translateX(0) scaleX(1); } }
.animate-glitch-drop { animation-name: glitch-drop; }
@keyframes glitch-drop { 0% { opacity: 0; transform: translateY(-100px) skewX(30deg); filter: blur(5px); } 50% { opacity: 1; transform: translateY(20px) skewX(-30deg); } 100% { opacity: 1; transform: translateY(0) skewX(0); filter: blur(0); } }
.animate-flicker-in-1 { animation-name: flicker-in-1; }
@keyframes flicker-in-1 { 0% { opacity: 0; } 10% { opacity: 0; } 10.1% { opacity: 1; } 10.2% { opacity: 0; } 20% { opacity: 0; } 20.1% { opacity: 1; } 20.6% { opacity: 0; } 30% { opacity: 0; } 30.1% { opacity: 1; } 30.5% { opacity: 1; } 30.6% { opacity: 0; } 45% { opacity: 0; } 45.1% { opacity: 1; } 50% { opacity: 1; } 55% { opacity: 1; } 55.1% { opacity: 0; } 57% { opacity: 0; } 57.1% { opacity: 1; } 60% { opacity: 1; } 60.1% { opacity: 0; } 65% { opacity: 0; } 65.1% { opacity: 1; } 75% { opacity: 1; } 75.1% { opacity: 0; } 77% { opacity: 0; } 77.1% { opacity: 1; } 85% { opacity: 1; } 85.1% { opacity: 0; } 86% { opacity: 0; } 86.1% { opacity: 1; } 100% { opacity: 1; } }
.animate-vibrate-in { animation-name: vibrate-in; }
@keyframes vibrate-in { 0% { opacity: 0; transform: translate(0); } 20% { opacity: 1; transform: translate(-2px, 2px); } 40% { transform: translate(-2px, -2px); } 60% { transform: translate(2px, 2px); } 80% { transform: translate(2px, -2px); } 100% { opacity: 1; transform: translate(0); } }
.animate-bounce-in-fwd { animation-name: bounce-in-fwd; }
@keyframes bounce-in-fwd { 0% { opacity: 0; transform: translateZ(-800px); animation-timing-function: ease-in; } 38% { opacity: 1; transform: translateZ(160px); animation-timing-function: ease-out; } 55% { transform: translateZ(-68px); animation-timing-function: ease-in; } 72% { transform: translateZ(0); animation-timing-function: ease-out; } 81% { transform: translateZ(-28px); animation-timing-function: ease-in; } 90% { transform: translateZ(0); animation-timing-function: ease-out; } 95% { transform: translateZ(-8px); animation-timing-function: ease-in; } 100% { opacity: 1; transform: translateZ(0); animation-timing-function: ease-out; } }
.animate-slit-in-diagonal-1 { animation-name: slit-in-diagonal-1; animation-timing-function: ease-out; }
@keyframes slit-in-diagonal-1 { 0% { opacity: 0; transform: translateZ(-800px) rotate3d(1, 1, 0, 90deg); filter: blur(10px); } 54% { opacity: 1; transform: translateZ(-160px) rotate3d(1, 1, 0, 87deg); filter: blur(2px); } 100% { opacity: 1; transform: translateZ(0) rotate3d(1, 1, 0, 0); filter: blur(0); } }
.animate-swirl-in-fwd-fast { animation-name: swirl-in-fwd-fast; animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 2); }
@keyframes swirl-in-fwd-fast { 0% { opacity: 0; transform: rotate(-1080deg) scale(0); } 100% { opacity: 1; transform: rotate(0) scale(1); } }
.animate-roll-in-blurred-top { animation-name: roll-in-blurred-top; animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.5); }
@keyframes roll-in-blurred-top { 0% { opacity: 0; transform: translateY(-1000px) rotate(-720deg); filter: blur(50px); } 100% { opacity: 1; transform: translateY(0) rotate(0deg); filter: blur(0); } }
.animate-roll-in-blurred-bottom { animation-name: roll-in-blurred-bottom; animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.5); }
@keyframes roll-in-blurred-bottom { 0% { opacity: 0; transform: translateY(1000px) rotate(720deg); filter: blur(50px); } 100% { opacity: 1; transform: translateY(0) rotate(0deg); filter: blur(0); } }
.animate-tilt-in-fwd-tr { animation-name: tilt-in-fwd-tr; }
@keyframes tilt-in-fwd-tr { 0% { opacity: 0; transform: rotateY(20deg) rotateX(35deg) translate(300px, -300px) skew(-35deg, 10deg); } 100% { opacity: 1; transform: rotateY(0) rotateX(0deg) translate(0, 0) skew(0deg, 0deg); } }
.animate-tilt-in-fwd-bl { animation-name: tilt-in-fwd-bl; }
@keyframes tilt-in-fwd-bl { 0% { opacity: 0; transform: rotateY(-20deg) rotateX(-35deg) translate(-300px, 300px) skew(35deg, -10deg); } 100% { opacity: 1; transform: rotateY(0) rotateX(0deg) translate(0, 0) skew(0deg, 0deg); } }
.animate-slide-in-blurred-tl { animation-name: slide-in-blurred-tl; }
@keyframes slide-in-blurred-tl { 0% { opacity: 0; transform: translate(-1000px, -1000px) skew(80deg, 10deg); filter: blur(120px); } 100% { opacity: 1; transform: translate(0, 0) skew(0deg, 0deg); filter: blur(0); } }
.animate-slide-in-blurred-br { animation-name: slide-in-blurred-br; }
@keyframes slide-in-blurred-br { 0% { opacity: 0; transform: translate(1000px, 1000px) skew(-80deg, -10deg); filter: blur(120px); } 100% { opacity: 1; transform: translate(0, 0) skew(0deg, 0deg); filter: blur(0); } }
.animate-bounce-in-extreme { animation-name: bounce-in-extreme; animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 2.5); }
@keyframes bounce-in-extreme { 0% { opacity: 0; transform: scale3d(0, 0, 0); } 100% { opacity: 1; transform: scale3d(1, 1, 1); } }

"""
with open('src/components/AnimatedLyric.css', 'a') as f:
    f.write(css_content)

tsx_file = "src/components/AnimatedLyric.tsx"
with open(tsx_file, 'r') as f:
    content = f.read()

# Append the new animations to the existing arrays
# Replace the SLOW_ANIMATIONS array block
new_slow = """const SLOW_ANIMATIONS = [
  "fade-in", "fade-blur-in", "slide-up", "slide-down", "slide-left", "slide-right", "zoom-in",
  "cinematic-unmask", "slow-rise-blur", "majestic-fade-track", "ghost-reveal",
  "fade-in-up-slow", "fade-in-down-slow", "zoom-in-soft", "rotate-in-slow",
  "slide-up-fade", "slide-down-fade", "slide-left-fade", "slide-right-fade",
  "blur-expand", "blur-contract", "tilt-in-fwd-up", "tilt-in-fwd-down",
  "tilt-in-bottom-1", "tilt-in-top-1", "focus-in", "focus-in-expand"
];"""
content = re.sub(r'const SLOW_ANIMATIONS = \[.*?\];', new_slow, content, flags=re.DOTALL)

# Replace the MEDIUM_ANIMATIONS array block
new_medium = """const MEDIUM_ANIMATIONS = [
  "bounce-in", "bounce-up", "bounce-down", "bounce-left", "bounce-right",
  "roll-in-left", "roll-in-right", "roll-in-top", "roll-in-bottom",
  "zoom-in-up", "zoom-in-down", "zoom-in-left", "zoom-in-right",
  "spring-up", "spring-down", "spring-left", "spring-right", "fade-drop-in", "rotate-in", "zoom-in-bounce",
  "elastic-drop", "cartwheel-in", "flip-bounce-y", "rubber-snap",
  "swirl-in-fwd", "swirl-in-bck", "slit-in-vertical", "slit-in-horizontal",
  "bounce-in-top", "bounce-in-bottom", "roll-in-blurred-left", "roll-in-blurred-right",
  "slide-in-elliptic-top-fwd", "slide-in-elliptic-bottom-fwd", "puff-in-center",
  "swing-in-top-fwd", "swing-in-bottom-fwd", "swing-in-left-fwd", "swing-in-right-fwd", "scale-up-center"
];"""
content = re.sub(r'const MEDIUM_ANIMATIONS = \[.*?\];', new_medium, content, flags=re.DOTALL)

# Replace the FAST_ANIMATIONS array block
new_fast = """const FAST_ANIMATIONS = [
  "stomp-pop", "cinematic-flash", "whip-zoom", "stomp-drop",
  "whip-pan-left", "whip-pan-right", "whip-pan-up", "whip-pan-down",
  "light-speed-in-right", "light-speed-in-left",
  "hyper-stomp", "flash-bang-zoom", "shatter-in", "whip-slam",
  "whip-slam-up", "whip-slam-left", "whip-slam-right", "glitch-drop",
  "flicker-in-1", "vibrate-in", "bounce-in-fwd", "slit-in-diagonal-1",
  "swirl-in-fwd-fast", "roll-in-blurred-top", "roll-in-blurred-bottom",
  "tilt-in-fwd-tr", "tilt-in-fwd-bl", "slide-in-blurred-tl", "slide-in-blurred-br", "bounce-in-extreme"
];"""
content = re.sub(r'const FAST_ANIMATIONS = \[.*?\];', new_fast, content, flags=re.DOTALL)

# Replace the SLOW_IDLE array block
new_slow_idle = """const SLOW_IDLE = [
  "idle-glow", "idle-breathe", "idle-perspective-shift",
  "idle-golden-aura", "idle-breathe-wide", "idle-zenith-float", "idle-subtle-hue-shift",
  "idle-slow-pan", "idle-majestic-pulse", "idle-soft-blur", "idle-drift-z",
  "idle-slow-rock", "idle-ghost-glow", "idle-ocean-wave", "idle-ambient-shift",
  "idle-slow-zoom-pan", "idle-ethereal", "idle-levitate", "idle-breathe-blur",
  "idle-silver-lining", "idle-slow-nod", "idle-gentle-tilt", "idle-subtle-scale"
];"""
content = re.sub(r'const SLOW_IDLE = \[.*?\];', new_slow_idle, content, flags=re.DOTALL)

# Replace the MEDIUM_IDLE array block
new_medium_idle = """const MEDIUM_IDLE = [
  "idle-float-x", "idle-float-y", "idle-3d-swing", "idle-pulse",
  "idle-wave-bob", "idle-pendulum", "idle-elastic-pulse", "idle-3d-tilt",
  "idle-jiggle", "idle-bounce-hover", "idle-color-throb", "idle-rubber-bob",
  "idle-swing-z", "idle-shake-y", "idle-shake-x", "idle-flip-flap",
  "idle-pulse-glow", "idle-roll-bob", "idle-squish", "idle-skew-bob",
  "idle-heartbeat-slow", "idle-jolt", "idle-tilt-pan", "idle-spring-bob"
];"""
content = re.sub(r'const MEDIUM_IDLE = \[.*?\];', new_medium_idle, content, flags=re.DOTALL)

# Replace the FAST_IDLE array block
new_fast_idle = """const FAST_IDLE = [
  "idle-wiggle", "idle-skew",
  "idle-glitch-jitter", "idle-seismic-tremor", "idle-strobe-flash", "idle-rapid-shake",
  "idle-hyper-pulse", "idle-vibrate", "idle-glitch-skew", "idle-shiver",
  "idle-rapid-bob", "idle-flash-glow", "idle-twitch", "idle-snap-pulse",
  "idle-flicker", "idle-zap", "idle-thrash", "idle-tremble-z",
  "idle-stutter", "idle-bounce-fast", "idle-glitch-blur", "idle-heartbeat-fast"
];"""
content = re.sub(r'const FAST_IDLE = \[.*?\];', new_fast_idle, content, flags=re.DOTALL)

with open(tsx_file, 'w') as f:
    f.write(content)
print("done")
