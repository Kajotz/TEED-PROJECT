#!/usr/bin/env python
"""Move existing profile images into the correct directory structure"""
import os
import shutil
from pathlib import Path

profile_images_dir = Path('c:/Users/jacktech/Desktop/TEED PROJECT/profile_images')
subfolder = profile_images_dir / 'profile_images'

print(f"Source: {profile_images_dir}")
print(f"Target subfolder: {subfolder}")

# Create subfolder if it doesn't exist
subfolder.mkdir(parents=True, exist_ok=True)
print(f"Created subfolder: {subfolder.exists()}")

# Move all PNG files to subfolder
files_moved = 0
for file in profile_images_dir.glob('*.png'):
    target = subfolder / file.name
    print(f"Moving: {file.name} -> {target.name}")
    shutil.move(str(file), str(target))
    files_moved += 1

print(f"\nTotal files moved: {files_moved}")
print(f"\nFiles in subfolder:")
for file in subfolder.glob('*'):
    print(f"  - {file.name}")
