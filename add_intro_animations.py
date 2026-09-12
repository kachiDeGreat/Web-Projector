import re

new_css = """
/* 10 NEW INTRO ANIMATIONS */
.animate-cyber-slide-in { animation-name: cyber-slide-in; animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes cyber-slide-in { 
  0% { opacity: 0; transform: translateX(200px) skewX(-40deg); filter: blur(10px) hue-rotate(90deg); }
  60% { opacity: 1; transform: translateX(-20px) skewX(10deg); filter: blur(0) hue-rotate(0deg); }
  100% { opacity: 1; transform: translateX(0) skewX(0deg); filter: blur(0); }
}

.animate-neon-flicker-in { animation-name: neon-flicker-in; animation-timing-function: ease-in; }
@keyframes neon-flicker-in { 
  0% { opacity: 0; text-shadow: none; }
  10% { opacity: 1; text-shadow: 0 0 10px #fff, 0 0 20px #ff00de; }
  20% { opacity: 0; text-shadow: none; }
  30% { opacity: 1; text-shadow: 0 0 10px #fff, 0 0 20px #ff00de, 0 0 40px #ff00de; }
  40% { opacity: 0; text-shadow: none; }
  100% { opacity: 1; text-shadow: 0 0 5px #fff; }
}

.animate-stomp-bounce-heavy { animation-name: stomp-bounce-heavy; animation-timing-function: cubic-bezier(0.28, 0.84, 0.42, 1); }
@keyframes stomp-bounce-heavy { 
  0% { opacity: 0; transform: scale(4) translateY(-100px); font-weight: 900; }
  40% { opacity: 1; transform: scale(0.8) translateY(20px); font-weight: 900; }
  70% { transform: scale(1.1) translateY(-10px); }
  100% { transform: scale(1) translateY(0); }
}

.animate-spin-in-expand { animation-name: spin-in-expand; animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes spin-in-expand { 
  0% { opacity: 0; transform: scale(0) rotate(720deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
}

.animate-3d-flip-up { animation-name: flip-up-3d; animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes flip-up-3d { 
  0% { opacity: 0; transform: perspective(600px) rotateX(-90deg); transform-origin: bottom center; }
  100% { opacity: 1; transform: perspective(600px) rotateX(0deg); transform-origin: bottom center; }
}

.animate-shatter-assemble { animation-name: shatter-assemble; animation-timing-function: ease-out; }
@keyframes shatter-assemble { 
  0% { opacity: 0; transform: translate(50px, -50px) rotate(45deg) skew(30deg) scale(1.5); filter: blur(5px); }
  100% { opacity: 1; transform: translate(0, 0) rotate(0deg) skew(0deg) scale(1); filter: blur(0); }
}

.animate-phantom-rise { animation-name: phantom-rise; animation-timing-function: ease-out; }
@keyframes phantom-rise { 
  0% { opacity: 0; transform: translateY(100px); filter: blur(20px) invert(1); }
  100% { opacity: 1; transform: translateY(0); filter: blur(0) invert(0); }
}

.animate-laser-swipe { animation-name: laser-swipe; animation-timing-function: cubic-bezier(0.075, 0.82, 0.165, 1); }
@keyframes laser-swipe { 
  0% { opacity: 0; transform: translateX(-200vw) scaleX(3); filter: brightness(3); }
  100% { opacity: 1; transform: translateX(0) scaleX(1); filter: brightness(1); }
}

.animate-gravity-drop-bounce { animation-name: gravity-drop-bounce; animation-timing-function: ease-in; }
@keyframes gravity-drop-bounce { 
  0% { opacity: 0; transform: translateY(-300px); }
  60% { opacity: 1; transform: translateY(0); animation-timing-function: ease-out; }
  75% { transform: translateY(-40px); animation-timing-function: ease-in; }
  90% { transform: translateY(0); animation-timing-function: ease-out; }
  95% { transform: translateY(-10px); animation-timing-function: ease-in; }
  100% { transform: translateY(0); }
}

.animate-liquid-melt-in { animation-name: liquid-melt-in; animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes liquid-melt-in { 
  0% { opacity: 0; transform: scaleY(3) scaleX(0.2) translateY(-50px); filter: blur(4px); }
  50% { opacity: 1; transform: scaleY(0.5) scaleX(1.5) translateY(20px); filter: blur(0); }
  100% { transform: scaleY(1) scaleX(1) translateY(0); }
}
"""

with open('src/components/AnimatedLyric.css', 'a') as f:
    f.write(new_css)

tsx_file = "src/components/AnimatedLyric.tsx"
with open(tsx_file, 'r') as f:
    content = f.read()

# Add to FAST_ANIMATIONS since these are mostly energetic
fast_animations_pattern = re.compile(r'(const FAST_ANIMATIONS = \[\n.*?)(];)', re.DOTALL)
new_fast_animations = r'\1  "cyber-slide-in", "neon-flicker-in", "stomp-bounce-heavy", "spin-in-expand", "3d-flip-up", "shatter-assemble", "phantom-rise", "laser-swipe", "gravity-drop-bounce", "liquid-melt-in",\n\2'
content = fast_animations_pattern.sub(new_fast_animations, content)

# Add to STANDARD_ANIMATIONS too
standard_animations_pattern = re.compile(r'(const STANDARD_ANIMATIONS = \[\n.*?)(];)', re.DOTALL)
new_standard_animations = r'\1  "cyber-slide-in",\n  "neon-flicker-in",\n  "stomp-bounce-heavy",\n  "spin-in-expand",\n  "3d-flip-up",\n  "shatter-assemble",\n  "phantom-rise",\n  "laser-swipe",\n  "gravity-drop-bounce",\n  "liquid-melt-in",\n\2'
content = standard_animations_pattern.sub(new_standard_animations, content)

with open(tsx_file, 'w') as f:
    f.write(content)
print("Added 10 new intro animations!")
