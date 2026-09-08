$ErrorActionPreference = "Stop"

$BASE_URL = "http://localhost:5000"
$API_KEY = "dm_c55ba2fa51aa211834dd3fa524d5a9508867ff5223f58440420034c6d2761a87"

if (-not $API_KEY) {
    Write-Host "Set DEVMETRICS_TEST_API_KEY first."
    exit 1
}

$headers = @{
    "x-api-key" = $API_KEY
}

function Invoke-Json {
    param(
        [string]$Method,
        [string]$Url,
        $Body = $null
    )

    $params = @{
        Method  = $Method
        Uri     = $Url
        Headers = $headers
    }

    if ($null -ne $Body) {
        $params.ContentType = "application/json"
        $params.Body = ($Body | ConvertTo-Json -Depth 20)
    }

    return Invoke-RestMethod @params
}

Write-Host "1. Creating test..."

$test = Invoke-Json `
    -Method POST `
    -Url "$BASE_URL/tests" `
    -Body @{
        name = "Integration Test"
        description = "Step 1 test"
    }

if (-not $test.success) {
    throw "Test creation failed"
}

$testId = $test.data.id

Write-Host "PASS Test created: $testId"


Write-Host "2. Adding request..."

$request = Invoke-Json `
    -Method POST `
    -Url "$BASE_URL/tests/$testId/requests" `
    -Body @{
        position = 0
        method = "GET"
        url = "https://jsonplaceholder.typicode.com/users"
        headers = @{}
        timeoutMs = 5000
        expectedStatus = 200
    }

if (-not $request.success) {
    throw "Request creation failed"
}

Write-Host "PASS Test request created"


Write-Host "3. Fetching test..."

$detail = Invoke-Json `
    -Method GET `
    -Url "$BASE_URL/tests/$testId"

if (-not $detail.success) {
    throw "Fetching test failed"
}

if (@($detail.data.requests).Count -ne 1) {
    throw "Expected exactly one test request"
}

Write-Host "PASS Test contains one request"


Write-Host "4. Listing tests..."

$list = Invoke-Json `
    -Method GET `
    -Url "$BASE_URL/tests"

if (-not $list.success) {
    throw "Listing tests failed"
}

Write-Host "PASS Tests list works"

Write-Host ""
Write-Host "STEP 1 TEST PASSED"