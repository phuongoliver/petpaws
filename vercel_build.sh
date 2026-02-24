#!/bin/bash
echo "1. Cài đặt Flutter SDK (Vercel Runner)..."
if [ ! -d "flutter" ]; then
  git clone https://github.com/flutter/flutter.git -b stable
fi

export PATH="$PATH:$PWD/flutter/bin"

echo "2. Tải dependencies..."
flutter pub get

echo "3. Build Flutter Web PWA..."
flutter build web

echo "Hoàn thành!"
