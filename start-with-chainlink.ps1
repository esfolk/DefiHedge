# DeFiGuard Risk - Startup Script with Chainlink MCP
# This script starts the Chainlink MCP server and the DeFiGuard backend together

Write-Host "🚀 Starting DeFiGuard Risk with Chainlink MCP Integration" -ForegroundColor Green
Write-Host ""

# Check if Node.js is available
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if Python is available
try {
    $pythonVersion = python --version
    Write-Host "✅ Python version: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔗 Starting Chainlink MCP Server..." -ForegroundColor Yellow

# Start Chainlink MCP server in background
$mcpServerProcess = Start-Process -FilePath "npx" -ArgumentList "-y", "@chainlink/mcp-server" -PassThru -WindowStyle Hidden -Environment @{
    "MCP_AI_SERVICE" = "openai"
    "OPENAI_API_KEY" = "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"
    "CHAINLINK_NODE_URL" = "https://cl-ea.linkpool.io/"
    "ETHEREUM_RPC_URL" = "https://mainnet.infura.io/v3/YOUR_PROJECT_ID"
    "POLYGON_RPC_URL" = "https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID"
    "ARBITRUM_RPC_URL" = "https://arbitrum-mainnet.infura.io/v3/YOUR_PROJECT_ID"
    "BASE_RPC_URL" = "https://mainnet.base.org"
}

Write-Host "✅ Chainlink MCP Server started (PID: $($mcpServerProcess.Id))" -ForegroundColor Green

# Wait a moment for MCP server to initialize
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "🏗️ Starting DeFiGuard Backend..." -ForegroundColor Yellow

# Change to backend directory and start the server
Push-Location backend

try {
    # Check if .env file exists
    if (-not (Test-Path ".env")) {
        Write-Host "⚠️  No .env file found. Creating from template..." -ForegroundColor Yellow
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Host "✅ Created .env file from template. Please update with your API keys." -ForegroundColor Green
        } else {
            Write-Host "❌ No .env.example file found" -ForegroundColor Red
            exit 1
        }
    }

    # Start the FastAPI backend
    Write-Host "🚀 Starting FastAPI server on port 8000..." -ForegroundColor Green
    $backendProcess = Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload" -PassThru -WindowStyle Normal

    Write-Host "✅ DeFiGuard Backend started (PID: $($backendProcess.Id))" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "📊 Services Status:" -ForegroundColor Cyan
    Write-Host "   • Chainlink MCP Server: Running on default port (PID: $($mcpServerProcess.Id))" -ForegroundColor White
    Write-Host "   • DeFiGuard Backend: Running on http://localhost:8000 (PID: $($backendProcess.Id))" -ForegroundColor White
    Write-Host "   • API Documentation: http://localhost:8000/docs" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🔗 Chainlink MCP Endpoints Available:" -ForegroundColor Cyan
    Write-Host "   • Health Check: GET /chainlink/health" -ForegroundColor White
    Write-Host "   • Price Feeds: GET /chainlink/price/{symbol}" -ForegroundColor White
    Write-Host "   • Cross-Chain: GET /chainlink/price/{symbol}/cross-chain" -ForegroundColor White
    Write-Host "   • Supported Feeds: GET /chainlink/feeds" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Start the frontend: cd frontend && npm run dev" -ForegroundColor White
    Write-Host "   2. Open http://localhost:3001 in your browser" -ForegroundColor White
    Write-Host "   3. Navigate to 'Oracle Data' tab to see Chainlink feeds" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
    
    # Wait for user interruption
    try {
        while ($true) {
            Start-Sleep -Seconds 1
        }
    } catch {
        # Cleanup on interruption
        Write-Host ""
        Write-Host "🛑 Shutting down services..." -ForegroundColor Yellow
        
        # Stop backend process
        if ($backendProcess -and !$backendProcess.HasExited) {
            Stop-Process -Id $backendProcess.Id -Force
            Write-Host "✅ Backend stopped" -ForegroundColor Green
        }
        
        # Stop MCP server process
        if ($mcpServerProcess -and !$mcpServerProcess.HasExited) {
            Stop-Process -Id $mcpServerProcess.Id -Force
            Write-Host "✅ Chainlink MCP Server stopped" -ForegroundColor Green
        }
        
        Write-Host "👋 All services stopped. Goodbye!" -ForegroundColor Green
    }

} finally {
    Pop-Location
}
