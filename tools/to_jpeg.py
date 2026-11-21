# Save a PNG screenshot as a JPEG of at most 256 KiB (the gate's cap), lowering quality until it fits.
import sys
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
image = Image.open(src).convert("RGB")
for quality in range(92, 40, -4):
    image.save(dst, "JPEG", quality=quality, optimize=True)
    import os
    size = os.path.getsize(dst)
    if size <= 250 * 1024:
        break
print(f"{dst}: {image.size[0]}x{image.size[1]} q{quality} {size // 1024} KiB")
