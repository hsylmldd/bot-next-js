# PowerShell script untuk deploy ke Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Green

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version 2>$null
    Write-Host "✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "📦 Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Login to Vercel
Write-Host "🔐 Logging in to Vercel..." -ForegroundColor Yellow
vercel login

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
vercel --prod

# Get deployment URL
Write-Host "🌐 Getting deployment URL..." -ForegroundColor Yellow
$deployUrl = vercel ls --json | ConvertFrom-Json | Select-Object -First 1 | ForEach-Object { $_.url }
Write-Host "🌐 Deployment URL: $deployUrl" -ForegroundColor Green

# Set webhook
Write-Host "🔗 Setting webhook..." -ForegroundColor Yellow
$botToken = $env:TELEGRAM_BOT_TOKEN
if ($botToken) {
    $webhookUrl = "https://$deployUrl/api/telegram/webhook"
    $body = @{
        url = $webhookUrl
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$botToken/setWebhook" -Method Post -Body $body -ContentType "application/json"
        Write-Host "✅ Webhook set successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to set webhook: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️ TELEGRAM_BOT_TOKEN not found. Please set webhook manually:" -ForegroundColor Yellow
    Write-Host "curl -X POST `"https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook`" -H `"Content-Type: application/json`" -d `"{\`"url\`": \`"https://$deployUrl/api/telegram/webhook\`"}`"" -ForegroundColor Cyan
}

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Bot URL: https://$deployUrl" -ForegroundColor Cyan
Write-Host "🔗 Webhook: https://$deployUrl/api/telegram/webhook" -ForegroundColor Cyan
Write-Host "❤️ Health: https://$deployUrl/api/health" -ForegroundColor Cyan
