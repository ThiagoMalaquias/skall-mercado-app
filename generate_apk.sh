cd android
./gradlew clean
./gradlew assembleRelease

cd ..
cp android/app/build/outputs/apk/release/app-release.apk ~/Downloads/  
