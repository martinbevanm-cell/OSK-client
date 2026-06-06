#!/bin/bash

clear
echo ""
echo "========================================"
echo "  OSK App Launcher (macOS)"
echo "========================================"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js is not installed on this computer."
  echo ""
  echo "Install Node.js LTS from: https://nodejs.org/en/download"
  open "https://nodejs.org/en/download"
  read -r -p "Press Enter to close..."
  exit 1
fi

NODE_MAJOR=$(node -v | sed 's/^v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "[ERROR] Node.js version is too old. Please install Node.js 22+ (LTS)."
  open "https://nodejs.org/en/download"
  read -r -p "Press Enter to close..."
  exit 1
fi

echo "[OK] Node.js is installed."
echo ""
echo "Installing app dependencies (first run may take a few minutes)..."
echo ""

npm install
if [ $? -ne 0 ]; then
  echo ""
  echo "[ERROR] Failed to install dependencies."
  echo "Please send this terminal screenshot to your developer."
  read -r -p "Press Enter to close..."
  exit 1
fi

echo ""
echo "========================================"
echo "  Starting OSK App..."
echo "========================================"
echo ""
echo "The app should open in your browser shortly."
echo "If it does not open, go to: http://localhost:3000"
echo ""
echo "Do not close this window while using the app."
echo ""

(sleep 5; open "http://localhost:3000") &
npm run dev

read -r -p "Press Enter to close..."