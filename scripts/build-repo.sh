#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

for command in dpkg-deb python3 gzip bzip2 xz md5sum sha1sum sha256sum; do
  command -v "$command" >/dev/null || {
    echo "Missing required command: $command" >&2
    exit 1
  }
done

python3 scripts/generate-packages.py

gzip -9 -n -c Packages > Packages.gz
bzip2 -9 -c Packages > Packages.bz2
xz -9 -c Packages > Packages.xz

DATE="$(LC_ALL=C date -Ru)"
{
  printf '%s\n' \
    'Origin: LE-baby' \
    'Label: LE-baby' \
    'Suite: stable' \
    'Version: 1.0' \
    'Codename: ios' \
    'Architectures: iphoneos-arm iphoneos-arm64 all' \
    'Components: main' \
    'Description: Packages by LE-baby' \
    "Date: $DATE"

  for algorithm in MD5Sum SHA1 SHA256; do
    echo "$algorithm:"
    for file in Packages Packages.gz Packages.bz2 Packages.xz; do
      case "$algorithm" in
        MD5Sum) digest="$(md5sum "$file" | cut -d' ' -f1)" ;;
        SHA1) digest="$(sha1sum "$file" | cut -d' ' -f1)" ;;
        SHA256) digest="$(sha256sum "$file" | cut -d' ' -f1)" ;;
      esac
      size="$(wc -c < "$file" | tr -d ' ')"
      printf ' %s %16s %s\n' "$digest" "$size" "$file"
    done
  done
} > Release

echo "Built repository metadata for $(rg -c '^Package:' Packages 2>/dev/null || echo 0) package(s)."
