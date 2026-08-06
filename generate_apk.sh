set -e

cd "$(dirname "$0")"

export JAVA_HOME="${JAVA_HOME:-/Applications/Android Studio.app/Contents/jbr/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

# Limpa artefatos nativos/CMake antes do Gradle (evita falha no externalNativeBuildClean)
# rm -rf android/app/.cxx android/app/build android/build
# rm -rf node_modules/*/android/build
# rm -rf node_modules/@react-native-async-storage/async-storage/android/build
# rm -rf node_modules/react-native-*/android/build

cd android
./gradlew assembleRelease --no-daemon

cd ..
mkdir -p ~/Downloads/Mercadinho/SkallTabletApp
rm -f ~/Downloads/Mercadinho/SkallTabletApp/app-release.apk \
  ~/Downloads/Mercadinho/SkallTabletApp/SkalMercadinhoTablet.apk
cp android/app/build/outputs/apk/release/app-release.apk \
  ~/Downloads/Mercadinho/SkallTabletApp/SkalMercadinhoTablet.apk

echo "APK gerado em: ~/Downloads/Mercadinho/SkallTabletApp/SkalMercadinhoTablet.apk"
