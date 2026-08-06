#!/bin/bash
set -e

cd "$(dirname "$0")"

IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)

if [ -z "$IP" ]; then
  echo "Erro: Mac sem IP na rede Wi-Fi (en0/en1)."
  exit 1
fi

if ! adb devices | grep -q "device$"; then
  echo "Erro: nenhum dispositivo ADB conectado."
  echo "Conecte o tablet por USB ou depuração sem fio e rode: adb devices"
  exit 1
fi

echo "IP do Mac: $IP"
echo "Configurando túnel ADB..."
adb reverse tcp:8081 tcp:8081 2>/dev/null || true

if ! curl -sf "http://localhost:8081/status" >/dev/null; then
  echo ""
  echo "Metro não está rodando. Abra outro terminal e execute:"
  echo "  npm start -- --host 0.0.0.0"
  echo ""
  exit 1
fi

echo "Instalando app apontando para $IP:8081 ..."
export REACT_NATIVE_PACKAGER_HOSTNAME="$IP"
npx react-native run-android --no-packager
