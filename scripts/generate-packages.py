#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEBS = ROOT / "debs"
OUTPUT = ROOT / "Packages"
GENERATED_FIELDS = {"filename", "size", "md5sum", "sha1", "sha256"}
REQUIRED_FIELDS = {"package", "version", "architecture", "maintainer", "description"}


def clean_control(raw: str) -> tuple[str, set[str]]:
    output: list[str] = []
    fields: set[str] = set()
    skipping = False

    for line in raw.splitlines():
        if line and not line[0].isspace() and ":" in line:
            name = line.split(":", 1)[0].strip().lower()
            skipping = name in GENERATED_FIELDS
            if not skipping:
                fields.add(name)
                output.append(line.rstrip())
        elif not skipping:
            output.append(line.rstrip())

    return "\n".join(output).strip(), fields


def digest(path: Path, algorithm: str) -> str:
    hasher = hashlib.new(algorithm)
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def main() -> int:
    debs = sorted(DEBS.glob("*.deb"), key=lambda path: path.name.lower())
    stanzas: list[str] = []

    for deb in debs:
        result = subprocess.run(
            ["dpkg-deb", "--field", str(deb)],
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        if result.returncode:
            print(f"Invalid Debian package: {deb.name}", file=sys.stderr)
            print(result.stderr.strip(), file=sys.stderr)
            return 1

        control, fields = clean_control(result.stdout)
        missing = REQUIRED_FIELDS - fields
        if missing:
            print(
                f"{deb.name} is missing control field(s): {', '.join(sorted(missing))}",
                file=sys.stderr,
            )
            return 1

        relative = deb.relative_to(ROOT).as_posix()
        stanza = [
            control,
            f"Filename: ./{relative}",
            f"Size: {deb.stat().st_size}",
            f"MD5sum: {digest(deb, 'md5')}",
            f"SHA1: {digest(deb, 'sha1')}",
            f"SHA256: {digest(deb, 'sha256')}",
        ]
        stanzas.append("\n".join(stanza))

    OUTPUT.write_text("\n\n".join(stanzas) + ("\n" if stanzas else ""), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
