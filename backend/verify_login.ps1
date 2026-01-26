
$baseUrl = "http://localhost:4000/api/auth"

function Test-Login {
    param($title, $email, $password)
    Write-Host "`n=== $title ===" -ForegroundColor Cyan
    try {
        $body = @{ email = $email; password = $password }
        $response = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -ContentType "application/json" -Body ($body | ConvertTo-Json)
        Write-Host "Success (Unexpected):"
        $response | ConvertTo-Json
    } catch {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd()
        Write-Host "Response Body: $body" -ForegroundColor Green
    }
}

function Create-User {
    param($email)
    $body = @{
        email = $email
        password = "password123"
        name = "Test User"
        role = "CUSTOMER"
    }
    try {
        Invoke-RestMethod -Uri "$baseUrl/signup" -Method Post -ContentType "application/json" -Body ($body | ConvertTo-Json) | Out-Null
        Write-Host "User created: $email"
    } catch {
        Write-Host "Failed to create user: $_"
    }
}

# 1. Unregistered Email
Test-Login "Unregistered Email" "nonexistent@example.com" "password123"

# 2. Invalid Password
# Assuming seller2@greenery.com exists
Test-Login "Invalid Password" "seller2@greenery.com" "wrongpassword"

# 3. Suspended Account
Test-Login "Suspended Account" "seller2@greenery.com" "password123"

# 4. Pending Account
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$pendingEmail = "pending_$timestamp@example.com"
Create-User $pendingEmail
Test-Login "Pending Account" $pendingEmail "password123"
