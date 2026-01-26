
$logFile = "c:\Users\Shuhid\.gemini\antigravity\scratch\greenery\backend\verify_output.txt"
$baseUrl = "http://localhost:4000/api/auth"

function Log-Output {
    param($msg)
    Write-Output $msg
    Add-Content -Path $logFile -Value $msg
}

# Clear log file
if (Test-Path $logFile) { Remove-Item $logFile }

function Test-Case {
    param($name, $email, $password)
    Log-Output "`n--- TEST: $name ---"
    try {
        $body = @{ email = $email; password = $password }
        $json = $body | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -ContentType "application/json" -Body $json
        Log-Output "RESULT: Success (Unexpected if expecting error)"
    }
    catch {
        Log-Output "STATUS: $($_.Exception.Response.StatusCode)"
        if ($_.Exception.Response.GetResponseStream()) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            Log-Output "BODY: $($reader.ReadToEnd())"
        }
        else {
            Log-Output "BODY: No content"
        }
    }
}

Test-Case "Unregistered Email" "nonexistent@example.com" "password123"
Test-Case "Invalid Password" "seller2@greenery.com" "wrongpassword"
Test-Case "Suspended Account" "seller2@greenery.com" "password123"

# Create Pending User
$ts = Get-Date -Format "HHmmss"
$pendingEmail = "pending$ts@test.com"
Log-Output "`n--- SETUP: Creating Pending User ($pendingEmail) ---"
try {
    $body = @{ email = $pendingEmail; password = "password123"; name = "Pending"; role = "CUSTOMER" }
    Invoke-RestMethod -Uri "$baseUrl/signup" -Method Post -ContentType "application/json" -Body ($body | ConvertTo-Json) | Out-Null
    Log-Output "User created."
}
catch {
    Log-Output "Signup Failed: $_"
}

Test-Case "Pending Account" $pendingEmail "password123"
