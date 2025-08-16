# DeFiGuard Risk Development Scripts
# PowerShell script for easy development management

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "help",
    [Parameter(Mandatory=$false)]
    [switch]$Build
)

function Show-Help {
    Write-Host "DeFiGuard Risk Development Helper" -ForegroundColor Green
    Write-Host "=================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\scripts\dev.ps1 [action] [options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Cyan
    Write-Host "  help          Show this help message"
    Write-Host "  setup         Initial project setup"
    Write-Host "  start         Start all services"
    Write-Host "  stop          Stop all services"
    Write-Host "  restart       Restart all services"
    Write-Host "  logs          Show logs for all services"
    Write-Host "  status        Show status of all services"
    Write-Host "  clean         Clean up Docker containers and volumes"
    Write-Host "  test          Run all tests"
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  -Build        Force rebuild of containers"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\scripts\dev.ps1 setup"
    Write-Host "  .\scripts\dev.ps1 start -Build"
    Write-Host "  .\scripts\dev.ps1 logs"
}

function Setup-Project {
    Write-Host "Setting up DeFiGuard Risk development environment..." -ForegroundColor Green
    
    # Check if Docker is running
    try {
        docker ps | Out-Null
        Write-Host "✓ Docker is running" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
        return
    }

    # Copy environment files
    if (!(Test-Path ".env")) {
        Copy-Item ".env.example" ".env"
        Write-Host "✓ Created .env file" -ForegroundColor Green
    }
    
    if (!(Test-Path "frontend\.env.local")) {
        Copy-Item "frontend\.env.example" "frontend\.env.local"
        Write-Host "✓ Created frontend\.env.local file" -ForegroundColor Green
    }
    
    if (!(Test-Path "backend\.env")) {
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "✓ Created backend\.env file" -ForegroundColor Green
    }

    Write-Host "✓ Project setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Edit .env files with your API keys"
    Write-Host "2. Run: .\scripts\dev.ps1 start"
}

function Start-Services {
    Write-Host "Starting DeFiGuard Risk services..." -ForegroundColor Green
    
    $buildFlag = if ($Build) { "--build" } else { "" }
    
    if ($buildFlag) {
        Write-Host "Building and starting services..." -ForegroundColor Yellow
        docker-compose -f docker-compose.dev.yml up --build -d
    } else {
        Write-Host "Starting services..." -ForegroundColor Yellow
        docker-compose -f docker-compose.dev.yml up -d
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Services started successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Available services:" -ForegroundColor Cyan
        Write-Host "  Frontend:     http://localhost:3000" -ForegroundColor White
        Write-Host "  Backend API:  http://localhost:8000" -ForegroundColor White
        Write-Host "  API Docs:     http://localhost:8000/docs" -ForegroundColor White
        Write-Host "  Redis Admin:  http://localhost:8081" -ForegroundColor White
        Write-Host "  PgAdmin:      http://localhost:8082" -ForegroundColor White
        Write-Host ""
        Write-Host "To view logs: .\scripts\dev.ps1 logs" -ForegroundColor Yellow
    } else {
        Write-Host "✗ Failed to start services" -ForegroundColor Red
    }
}

function Stop-Services {
    Write-Host "Stopping DeFiGuard Risk services..." -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.yml down
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Services stopped successfully!" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to stop services" -ForegroundColor Red
    }
}

function Restart-Services {
    Write-Host "Restarting DeFiGuard Risk services..." -ForegroundColor Yellow
    Stop-Services
    Start-Sleep -Seconds 2
    Start-Services
}

function Show-Logs {
    Write-Host "Showing logs for all services..." -ForegroundColor Green
    Write-Host "Press Ctrl+C to exit logs" -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.yml logs -f
}

function Show-Status {
    Write-Host "DeFiGuard Risk Services Status" -ForegroundColor Green
    Write-Host "===============================" -ForegroundColor Green
    docker-compose -f docker-compose.dev.yml ps
}

function Clean-Project {
    Write-Host "Cleaning up DeFiGuard Risk project..." -ForegroundColor Yellow
    
    # Stop and remove containers
    docker-compose -f docker-compose.dev.yml down -v
    
    # Remove images
    $images = docker images "defiguardrisk*" -q
    if ($images) {
        docker rmi $images
    }
    
    # Clean Docker system
    docker system prune -f
    
    Write-Host "✓ Project cleaned successfully!" -ForegroundColor Green
}

function Run-Tests {
    Write-Host "Running DeFiGuard Risk tests..." -ForegroundColor Green
    
    # Frontend tests
    Write-Host "Running frontend tests..." -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.yml exec frontend npm test
    
    # Backend tests  
    Write-Host "Running backend tests..." -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.yml exec backend pytest
    
    Write-Host "✓ Tests completed!" -ForegroundColor Green
}

# Main script logic
switch ($Action.ToLower()) {
    "help" { Show-Help }
    "setup" { Setup-Project }
    "start" { Start-Services }
    "stop" { Stop-Services }
    "restart" { Restart-Services }
    "logs" { Show-Logs }
    "status" { Show-Status }
    "clean" { Clean-Project }
    "test" { Run-Tests }
    default { 
        Write-Host "Unknown action: $Action" -ForegroundColor Red
        Write-Host ""
        Show-Help
    }
}
