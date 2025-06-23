cd android
./gradlew clean
./gradlew assembleRelease

cd ..
rm -rf ~/Downloads/app-release.apk
cp android/app/build/outputs/apk/release/app-release.apk ~/Downloads/  
