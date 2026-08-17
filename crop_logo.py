from PIL import Image

# Open the original logo
logo_path = r"logo\logo_CSESociety_IERT.png"
img = Image.open(logo_path)

# Get the dimensions
width, height = img.size
print(f"Original logo size: {width}x{height}")

# Crop to match the reference - complete emblem with all circuits and neurons
# Keep roughly the top 63% - tree top + CSE + circuit roots but no text below
crop_height = int(height * 0.63)
cropped_img = img.crop((0, 0, width, crop_height))

# Save to the public folder
output_path = r"shuffal\public\logo.png"
cropped_img.save(output_path, "PNG")

print(f"Cropped logo saved to {output_path}")
print(f"New logo size: {cropped_img.size}")
