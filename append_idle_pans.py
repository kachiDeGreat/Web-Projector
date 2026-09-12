import re

css_content = """
/* SIMPLE IDLE PANS */
.idle-pan-left { animation: idle-pan-left 15s linear infinite alternate; }
@keyframes idle-pan-left { 0% { transform: translateX(0); } 100% { transform: translateX(-20px); } }
.idle-pan-right { animation: idle-pan-right 15s linear infinite alternate; }
@keyframes idle-pan-right { 0% { transform: translateX(0); } 100% { transform: translateX(20px); } }
.idle-pan-up { animation: idle-pan-up 15s linear infinite alternate; }
@keyframes idle-pan-up { 0% { transform: translateY(0); } 100% { transform: translateY(-10px); } }
.idle-pan-down { animation: idle-pan-down 15s linear infinite alternate; }
@keyframes idle-pan-down { 0% { transform: translateY(0); } 100% { transform: translateY(10px); } }
"""
with open('src/components/AnimatedLyric.css', 'a') as f:
    f.write(css_content)

tsx_file = "src/components/AnimatedLyric.tsx"
with open(tsx_file, 'r') as f:
    content = f.read()

# Replace the idle arrays
idle_arrays_pattern = re.compile(r'const SLOW_IDLE = \[.*?\];\nconst MEDIUM_IDLE = \[.*?\];\nconst FAST_IDLE = \[.*?\];\n\nconst IDLE_ANIMATIONS = \[.*?\];', re.DOTALL)

new_idle = """const IDLE_PAIRS = [
  ["idle-pan-left", "idle-pan-right"],
  ["idle-pan-right", "idle-pan-left"],
  ["idle-pan-up", "idle-pan-down"],
  ["idle-pan-down", "idle-pan-up"],
  ["idle-pan-left", "idle-pan-left"],
  ["idle-pan-right", "idle-pan-right"],
  ["idle-pan-up", "idle-pan-up"],
  ["idle-pan-down", "idle-pan-down"],
  ["idle-pan-left", "idle-pan-up"],
  ["idle-pan-left", "idle-pan-down"],
  ["idle-pan-right", "idle-pan-up"],
  ["idle-pan-right", "idle-pan-down"],
  ["idle-pan-up", "idle-pan-left"],
  ["idle-pan-up", "idle-pan-right"],
  ["idle-pan-down", "idle-pan-left"],
  ["idle-pan-down", "idle-pan-right"]
];"""

content = idle_arrays_pattern.sub(new_idle, content)

# Replace the useMemo for lineIdleAnimations
usememo_pattern = re.compile(r'const lineIdleAnimations = useMemo\(\(\) => \{.*?\}, \[text, kineticTempo\]\);', re.DOTALL)
new_usememo = """const lineIdleAnimations = useMemo(() => {
    return IDLE_PAIRS[Math.floor(Math.random() * IDLE_PAIRS.length)];
  }, [text, kineticTempo]);"""

content = usememo_pattern.sub(new_usememo, content)

with open(tsx_file, 'w') as f:
    f.write(content)
print("done")
