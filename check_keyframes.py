import re

with open("src/components/AnimatedLyric.tsx") as f:
    tsx = f.read()

with open("src/components/AnimatedLyric.css") as f:
    css = f.read()

# 1. Get all animations from TSX
arrays = ["STANDARD_ANIMATIONS", "SLOW_ANIMATIONS", "MEDIUM_ANIMATIONS", "FAST_ANIMATIONS"]
all_anims = set()
for arr in arrays:
    m = re.search(f'const {arr} = \\[(.*?)\\];', tsx, re.DOTALL)
    if m:
        content = m.group(1)
        anims = re.findall(r'"([^"]+)"', content)
        all_anims.update(anims)

# 2. Extract all classes and their animation-names from CSS
class_anim_map = {}
for match in re.finditer(r'\.(animate-[\w-]+)\s*\{[^}]*animation-name:\s*([\w-]+)', css):
    class_anim_map[match.group(1)] = match.group(2)
    
# 3. Extract all keyframes from CSS
keyframes = set(re.findall(r'@keyframes\s+([\w-]+)', css))

missing_classes = []
missing_keyframes = []

for anim in all_anims:
    cls_name = f"animate-{anim}"
    if cls_name not in class_anim_map:
        # Maybe it's defined without animation-name? Check if it exists at all
        if cls_name not in css:
            missing_classes.append(anim)
        else:
            print(f"Warning: {cls_name} exists but has no animation-name")
    else:
        anim_name = class_anim_map[cls_name]
        if anim_name not in keyframes:
            missing_keyframes.append((cls_name, anim_name))

print("Missing CSS classes for TSX items:", missing_classes)
print("CSS classes pointing to missing keyframes:", missing_keyframes)

