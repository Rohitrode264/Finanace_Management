$base_url = "http://localhost:3000"

Write-Host "--- Finance Management API Test ---" -ForegroundColor Cyan

# 1. Health Check
Write-Host "`n[1] Checking Health..." -NoNewline
try {
    $health = Invoke-RestMethod -Uri "$base_url/health" -Method Get
    Write-Host " OK" -ForegroundColor Green
    $health | ConvertTo-Json
} catch {
    Write-Host " FAILED" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host "Ensure the server is running with 'npm run dev'" -ForegroundColor Yellow
    exit
}

# 2. Login Template
Write-Host "`n[2] Login Prompt (Example)" -ForegroundColor Yellow
Write-Host "To test authenticated routes, you need a token."
Write-Host "Run the following in your terminal to login and get a token:`n"

$login_example = @"
`$body = @{ email = 'admin@example.com'; password = 'yourpassword' } | ConvertTo-Json
`$response = Invoke-RestMethod -Uri "$base_url/api/auth/login" -Method Post -Body `$body -ContentType "application/json"
`$token = `$response.data.accessToken
Write-Host "Token: `$token"
"@

Write-Host $login_example -ForegroundColor White
Write-Host "`n-----------------------------------"
