#!/usr/bin/env bash
# F4-03: bloquea el merge si hay secretos de plantilla fuera de .env.example
# o si el .env real quedó versionado. Uso: bash scripts/check-secrets.sh
set -euo pipefail
cd "$(dirname "$0")/.."

PATTERN='cambia-este|changeme|your-secret-here|secret123'
FOUND=0

if command -v rg >/dev/null 2>&1; then
  if rg -n --hidden --glob '!.git' --glob '!.env' --glob '!.env.example' --glob '!package-lock.json' --glob '!scripts/check-secrets.sh' -i "$PATTERN" . ; then
    echo "::error::Secretos de plantilla fuera de .env.example"
    FOUND=1
  fi
  if git ls-files | rg -q '^\.env$'; then
    echo "::error::.env está versionado"
    FOUND=1
  fi
else
  # Fallback POSIX: grep -r ve trackeados y no trackeados (git grep no).
  # -I omite binarios (uploads/, pdfs) para evitar falsos positivos.
  # NOTA: se excluyen los dos archivos detectores (contienen los patrones
  # como código, no como secretos). Un secreto real hardcodeado en otro
  # archivo sí es detectado.
  if grep -rn -I -i -E "$PATTERN" . \
    --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build \
    --exclude-dir=.turbo --exclude-dir=coverage --exclude-dir=uploads \
    --exclude=.env --exclude=.env.local --exclude=.env.example \
    --exclude=package-lock.json --exclude=check-secrets.sh --exclude=env.ts ; then
    echo "::error::Secretos de plantilla fuera de .env.example"
    FOUND=1
  fi
  if git ls-files | grep -q '^\.env$'; then
    echo "::error::.env está versionado"
    FOUND=1
  fi
fi

if [ "$FOUND" -ne 0 ]; then exit 1; fi
echo "OK sin secretos de plantilla"
