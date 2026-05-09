#!/bin/bash
# Persian OCR - Combined Startup Script

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "🚀 Starting Persian OCR System..."
echo "========================================"
echo "Working directory: $SCRIPT_DIR"

# Kill existing processes
echo "Checking for existing processes..."
lsof -ti:8080 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
sleep 2

# Start Flask
echo "Starting Flask API on port 8080..."
cd "$SCRIPT_DIR/web"
python3 app.py > "$SCRIPT_DIR/flask.log" 2>&1 &
FLASK_PID=$!
sleep 5

if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Flask API is running on http://localhost:8080"
else
    echo "❌ Flask API failed. Check $SCRIPT_DIR/flask.log"
    exit 1
fi

# Start Next.js
echo "Starting Next.js on port 3001..."
cd "$SCRIPT_DIR/ocr-web"
npm run dev > "$SCRIPT_DIR/nextjs.log" 2>&1 &
NEXTJS_PID=$!
sleep 10

if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Next.js is running on http://localhost:3001"
else
    echo "❌ Next.js failed. Check $SCRIPT_DIR/nextjs.log"
    exit 1
fi

echo ""
echo "========================================"
echo "🎉 Ready! Open: http://localhost:3001"
echo "Stop: lsof -ti:8080,3001 | xargs kill -9"
echo ""

wait