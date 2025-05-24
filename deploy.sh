#!/bin/bash

echo "🚀 Preparing Spyfall for Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "client" ] && [ ! -d "server" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Installing dependencies..."

# Install server dependencies
echo "Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies
echo "Installing client dependencies..."
cd client
npm install
cd ..

echo "🧪 Testing builds..."

# Test server
echo "Testing server..."
cd server
npm run build
cd ..

# Test client build
echo "Testing client build..."
cd client
npm run build
cd ..

echo "✅ Build tests completed successfully!"

echo ""
echo "🌟 Next Steps:"
echo "1. Push your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Prepare for deployment'"
echo "   git push"
echo ""
echo "2. Follow the instructions in DEPLOYMENT.md"
echo "3. Deploy to Render.com (recommended) or your preferred platform"
echo ""
echo "🎮 Your Spyfall game is ready for deployment!" 