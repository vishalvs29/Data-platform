#!/bin/bash
# 🚀 Zenith App Launcher

# Get the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

clear
echo "=========================================="
echo "         ZENITH PREMIUM WELLNESS         "
echo "=========================================="
echo ""
echo "🚀 Starting local server..."
echo "🌍 App will be available at: http://localhost:3000"
echo ""
echo "💡 Note: Keep this window open while using the app."
echo "   Press Ctrl+C to stop the server."
echo ""

# Open the browser after a short delay
(sleep 2 && open "http://localhost:3000/landing.html") &

# Start the server (npx serve is recommended for Supabase CORS)
npx serve -l 3000 .
