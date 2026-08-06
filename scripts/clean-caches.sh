#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="${ROOT_DIR}/android"

usage() {
  cat <<'EOF'
Uso: ./scripts/clean-caches.sh [opções]

Limpa caches de build e desenvolvimento para liberar espaço em disco.

Opções (podem ser combinadas):
  --project     Limpa builds e caches do projeto (padrão)
  --gradle      Limpa ~/.gradle/caches e daemon
  --expo        Limpa ~/.expo/cache e .expo do projeto
  --npm         Limpa cache global do npm
  --homebrew    Limpa cache do Homebrew
  --all         Executa todas as opções acima (exceto Android SDK)
  --android-sdk Remove imagens de emulador do SDK (agressivo)
  -h, --help    Mostra esta ajuda

Exemplos:
  ./scripts/clean-caches.sh
  ./scripts/clean-caches.sh --all
  ./scripts/clean-caches.sh --project --gradle
EOF
}

show_disk() {
  echo ""
  echo "=== Espaço em disco ==="
  if df -h /System/Volumes/Data &>/dev/null; then
    df -h /System/Volumes/Data
  else
    df -h /
  fi
  echo ""
}

remove_dir() {
  local path="$1"
  if [[ -d "$path" || -e "$path" ]]; then
    echo "  removendo ${path}"
    rm -rf "$path"
  else
    echo "  ignorando ${path} (não existe)"
  fi
}

clean_project() {
  echo ">> Limpando projeto..."

  if [[ -x "${ANDROID_DIR}/gradlew" ]]; then
    echo "  parando Gradle daemon"
    (cd "${ANDROID_DIR}" && ./gradlew --stop) || true
  fi

  remove_dir "${ANDROID_DIR}/app/build"
  remove_dir "${ANDROID_DIR}/build"
  remove_dir "${ANDROID_DIR}/.gradle"
  remove_dir "${ROOT_DIR}/node_modules/.cache"
  remove_dir "${ROOT_DIR}/.expo"
}

clean_gradle() {
  echo ">> Limpando Gradle global..."

  if [[ -x "${ANDROID_DIR}/gradlew" ]]; then
    echo "  parando Gradle daemon"
    (cd "${ANDROID_DIR}" && ./gradlew --stop) || true
  fi

  remove_dir "${HOME}/.gradle/caches"
  remove_dir "${HOME}/.gradle/daemon"
}

clean_expo() {
  echo ">> Limpando Expo..."
  remove_dir "${HOME}/.expo/cache"
  remove_dir "${ROOT_DIR}/.expo"
}

clean_npm() {
  echo ">> Limpando npm..."
  if command -v npm &>/dev/null; then
    npm cache clean --force
  else
    echo "  npm não encontrado"
  fi
}

clean_homebrew() {
  echo ">> Limpando Homebrew..."
  if command -v brew &>/dev/null; then
    brew cleanup -s || true
    remove_dir "${HOME}/Library/Caches/Homebrew"
  else
    echo "  Homebrew não encontrado"
  fi
}

clean_android_sdk_images() {
  echo ">> Limpando imagens de emulador do Android SDK..."
  remove_dir "${HOME}/Library/Android/sdk/system-images"
}

DO_PROJECT=false
DO_GRADLE=false
DO_EXPO=false
DO_NPM=false
DO_HOMEBREW=false
DO_ANDROID_SDK=false
EXPLICIT=false

if [[ $# -eq 0 ]]; then
  DO_PROJECT=true
else
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --project)
        DO_PROJECT=true
        EXPLICIT=true
        ;;
      --gradle)
        DO_GRADLE=true
        EXPLICIT=true
        ;;
      --expo)
        DO_EXPO=true
        EXPLICIT=true
        ;;
      --npm)
        DO_NPM=true
        EXPLICIT=true
        ;;
      --homebrew)
        DO_HOMEBREW=true
        EXPLICIT=true
        ;;
      --all)
        DO_PROJECT=true
        DO_GRADLE=true
        DO_EXPO=true
        DO_NPM=true
        DO_HOMEBREW=true
        EXPLICIT=true
        ;;
      --android-sdk)
        DO_ANDROID_SDK=true
        EXPLICIT=true
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        echo "Opção desconhecida: $1"
        usage
        exit 1
        ;;
    esac
    shift
  done
fi

if [[ "${EXPLICIT}" == false ]]; then
  DO_PROJECT=true
fi

show_disk

if [[ "${DO_PROJECT}" == true ]]; then clean_project; fi
if [[ "${DO_GRADLE}" == true ]]; then clean_gradle; fi
if [[ "${DO_EXPO}" == true ]]; then clean_expo; fi
if [[ "${DO_NPM}" == true ]]; then clean_npm; fi
if [[ "${DO_HOMEBREW}" == true ]]; then clean_homebrew; fi
if [[ "${DO_ANDROID_SDK}" == true ]]; then clean_android_sdk_images; fi

echo ""
echo "Limpeza concluída."
show_disk

echo "Para rebuildar o app:"
echo "  cd ${ROOT_DIR} && npm run android"
