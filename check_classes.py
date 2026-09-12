import re

with open("src/components/AnimatedLyric.tsx") as f:
    tsx = f.read()

with open("src/components/AnimatedLyric.css") as f:
    css = f.read()

arrays = ["STANDARD_ANIMATIONS", "SLOW_ANIMATIONS", "MEDIUM_ANIMATIONS", "FAST_ANIMATIONS"]
all_anims = set()
for arr in arrays:
    m = re.search(f'const {arr} = \\[(.*?)\\];', tsx, re.DOTALL)
    if m:
        content = m.group(1)
        anims = re.findall(r'"([^"]+)"', content)
        all_anims.update(anims)

missing = []
for anim in all_anims:
    if f".animate-{anim}" not in css:
        missing.append(anim)

print("Missing entrance animations:", missing)

# Check idle animations
idle_pairs_m = re.search(r'const IDLE_PAIRS = \[(.*?)\];', tsx, re.DOTALL)
if idle_pairs_m:
    idle_content = idle_pairs_m.group(1)
    idles = re.findall(r'"([^"]+)"', idle_content)
    for idle in set(idles):
        if f".{idle}" not in css:
            print("Missing idle:", idle)

