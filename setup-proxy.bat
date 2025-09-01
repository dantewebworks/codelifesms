@echo off
echo 🚀 Setting up Telynx API Proxy Server...
echo.

echo 📦 Installing dependencies...
npm install

echo.
echo 🚀 Starting proxy server...
echo.
echo ✅ Proxy server will be available at: http://localhost:3001
echo 📞 API endpoint: http://localhost:3001/api/telynx/phone-numbers
echo.
echo 💡 Keep this window open while using the SMS app!
echo 💡 Press Ctrl+C to stop the server
echo.

npm start 