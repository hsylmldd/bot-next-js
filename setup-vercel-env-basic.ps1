# PowerShell script untuk setup Vercel environment variables
Write-Host "Setting up Vercel environment variables..." -ForegroundColor Green

# Set environment variables
Write-Host "Setting environment variables..." -ForegroundColor Yellow

Write-Host "Setting TELEGRAM_BOT_TOKEN..." -ForegroundColor Yellow
vercel env add TELEGRAM_BOT_TOKEN

Write-Host "Setting NEXT_PUBLIC_SUPABASE_URL..." -ForegroundColor Yellow
vercel env add NEXT_PUBLIC_SUPABASE_URL

Write-Host "Setting SUPABASE_SERVICE_ROLE_KEY..." -ForegroundColor Yellow
vercel env add SUPABASE_SERVICE_ROLE_KEY

Write-Host "Setting CRON_SECRET..." -ForegroundColor Yellow
vercel env add CRON_SECRET

Write-Host "Environment variables set!" -ForegroundColor Green
Write-Host "Don't forget to set the values in Vercel dashboard" -ForegroundColor Yellow
Write-Host "Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor Cyan
