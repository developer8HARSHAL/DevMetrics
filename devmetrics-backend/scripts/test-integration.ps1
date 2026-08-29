$ErrorActionPreference = "Stop"

# ============================================================
# DevMetrics - Integrated System Smoke Test
#
# Run from repository root:
#
#   $env:DEVMETRICS_TEST_API_KEY="YOUR_TEST_API_KEY"
#   powershell.exe -ExecutionPolicy Bypass -File .\test-integration.ps1
#
# IMPORTANT:
# - Never hardcode API keys in this file.
# - This test uses the actual API response contracts.
# ============================================================

$BASE_URL = "http://localhost:5000"
$API_KEY = "dm_e95365b0778383092728fa8baf571572fd1fd8d9e4d2bcab33f47f71aa2d9d61"

if (-not $API_KEY) {
    Write-Host ""
    Write-Host "ERROR: DEVMETRICS_TEST_API_KEY is not set." -ForegroundColor Red
    Write-Host 'Set it with: $env:DEVMETRICS_TEST_API_KEY="YOUR_API_KEY"'
    exit 1
}

$passed = 0
$failed = 0

function Pass($message) {
    $script:passed++
    Write-Host "PASS - $message" -ForegroundColor Green
}

function Fail($message) {
    $script:failed++
    Write-Host "FAIL - $message" -ForegroundColor Red
}

function Section($title) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host $title -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
}

function Invoke-Api {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Method,

        [Parameter(Mandatory = $true)]
        [string]$Url,

        [hashtable]$Headers = @{},

        $Body = $null
    )

    $params = @{
        Uri     = $Url
        Method  = $Method
        Headers = $Headers
    }

    if ($null -ne $Body) {
        $params.ContentType = "application/json"
        $params.Body = ($Body | ConvertTo-Json -Depth 20)
    }

    return Invoke-RestMethod @params
}

# ============================================================
# 1. HEALTH
# ============================================================

Section "1. Backend Health"

try {
    $health = Invoke-Api `
        -Method "GET" `
        -Url "$BASE_URL/health"

    if ($health.status -eq "ok") {
        Pass "Backend and PostgreSQL are healthy"
    }
    else {
        Fail "Unexpected health response"
    }
}
catch {
    Fail "Health request failed: $($_.Exception.Message)"
}

# ============================================================
# 2. LEGACY /track
# ============================================================

Section "2. Legacy Tracking"

try {
    # IMPORTANT:
    # Legacy /track intentionally reads apiKey from req.body.
    # Do not change this behavior for compatibility.
    $trackResult = Invoke-Api `
        -Method "POST" `
        -Url "$BASE_URL/track" `
        -Headers @{
            "Content-Type" = "application/json"
        } `
        -Body @{
            apiKey       = $API_KEY
            endpoint     = "/integration/legacy-test"
            method       = "GET"
            status       = 200
            responseTime = 25
        }

    if ($trackResult.success) {
        Pass "Legacy POST /track works"
    }
    else {
        Fail "Legacy POST /track returned unsuccessful response"
    }
}
catch {
    Fail "Legacy POST /track failed: $($_.Exception.Message)"
}

# ============================================================
# 3. EXISTING ANALYTICS
# ============================================================

Section "3. Existing Analytics APIs"

$analytics = @(
    @{
        Name = "overview"
        Url  = "$BASE_URL/logs/metrics/overview?apiKey=$API_KEY"
    },
    @{
        Name = "endpoint"
        Url  = "$BASE_URL/logs/metrics/endpoint?apiKey=$API_KEY"
    },
    @{
        Name = "recent"
        Url  = "$BASE_URL/logs/metrics/recent?apiKey=$API_KEY"
    },
    @{
        Name = "errors"
        Url  = "$BASE_URL/logs/metrics/errors?apiKey=$API_KEY"
    }
)

foreach ($item in $analytics) {
    try {
        $result = Invoke-Api -Method "GET" -Url $item.Url

        if ($result.success -eq $true) {
            Pass "/logs/metrics/$($item.Name)"
        }
        else {
            Fail "/logs/metrics/$($item.Name) returned unsuccessful response"
        }
    }
    catch {
        Fail "/logs/metrics/$($item.Name) failed: $($_.Exception.Message)"
    }
}

# ============================================================
# 4. CREATE RUN A
# ============================================================

Section "4. Create Run A"

$sessionAId = $null
$shareTokenA = $null

try {
    $runA = Invoke-Api `
        -Method "POST" `
        -Url "$BASE_URL/sessions" `
        -Headers @{
            "x-api-key" = $API_KEY
        } `
        -Body @{
            name     = "Integration Test Run A"
            hostname = "localhost"
        }

    $sessionAId = $runA.sessionId
    $shareTokenA = $runA.shareToken

    if ($runA.success -and $sessionAId -and $shareTokenA) {
        Pass "POST /sessions creates Run A"
        Write-Host "  Run A: $sessionAId"
    }
    else {
        Fail "Run A response missing sessionId/shareToken"
    }
}
catch {
    Fail "POST /sessions failed: $($_.Exception.Message)"
}

# ============================================================
# 5. BATCH INGESTION A
# ============================================================

Section "5. Batch Ingestion - Run A"

if ($sessionAId) {
    try {
        $batchA = Invoke-Api `
            -Method "POST" `
            -Url "$BASE_URL/track/batch" `
            -Headers @{
                "x-api-key" = $API_KEY
            } `
            -Body @{
                sessionId = $sessionAId
                events = @(
                    @{
                        endpoint     = "/users"
                        method       = "GET"
                        status       = 200
                        responseTime = 32
                    },
                    @{
                        endpoint     = "/products"
                        method       = "GET"
                        status       = 200
                        responseTime = 45
                    },
                    @{
                        endpoint     = "/checkout"
                        method       = "POST"
                        status       = 500
                        responseTime = 421
                    },
                    @{
                        endpoint     = "/payment"
                        method       = "POST"
                        status       = 500
                        responseTime = 842
                    },
                    @{
                        endpoint     = "/payment"
                        method       = "POST"
                        status       = 500
                        responseTime = 811
                    },
                    @{
                        endpoint     = "/payment"
                        method       = "POST"
                        status       = 500
                        responseTime = 836
                    }
                )
            }

        if ($batchA.success -and $batchA.inserted -eq 6) {
            Pass "Run A batch inserted 6 events"
        }
        else {
            Fail "Run A batch returned unexpected result"
        }
    }
    catch {
        Fail "Run A batch failed: $($_.Exception.Message)"
    }
}

# ============================================================
# 6. RUN DETAIL
# ============================================================

Section "6. Run A Detail"

if ($sessionAId) {
    try {
        $detailA = Invoke-Api `
            -Method "GET" `
            -Url "$BASE_URL/sessions/$sessionAId" `
            -Headers @{
                "x-api-key" = $API_KEY
            }

        if (-not $detailA.success) {
            Fail "GET /sessions/:id returned unsuccessful response"
        }
        else {
            Pass "GET /sessions/:id works"

            # Actual response contract:
            # detailA.data.timeline
            $timelineCount = @($detailA.data.timeline).Count

            if ($timelineCount -eq 6) {
                Pass "Run A timeline contains 6 requests"
            }
            else {
                Fail "Run A timeline expected 6 requests, found $timelineCount"
            }

            # Findings may be empty before the Run ends.
            if ($null -ne $detailA.data.findings) {
                Pass "Run A detail includes findings array"
            }
            else {
                Fail "Run A detail does not contain findings"
            }
        }
    }
    catch {
        Fail "GET /sessions/:id failed: $($_.Exception.Message)"
    }
}

# ============================================================
# 7. END RUN A
# ============================================================

Section "7. End Run A"

if ($sessionAId) {
    try {
        $endA = Invoke-Api `
            -Method "PATCH" `
            -Url "$BASE_URL/sessions/$sessionAId/end" `
            -Headers @{
                "x-api-key" = $API_KEY
            }

        if ($endA.success) {
            Pass "Run A ended successfully"
        }
        else {
            Fail "Run A end returned unsuccessful response"
        }
    }
    catch {
        Fail "Ending Run A failed: $($_.Exception.Message)"
    }
}

# ============================================================
# 8. ANALYSIS
# ============================================================

Section "8. Run A Analysis"

if ($sessionAId) {
    try {
        $analyzedA = Invoke-Api `
            -Method "GET" `
            -Url "$BASE_URL/sessions/$sessionAId" `
            -Headers @{
                "x-api-key" = $API_KEY
            }

        $findingCount = @($analyzedA.data.findings).Count

        if ($findingCount -gt 0) {
            Pass "Run A produced $findingCount finding(s)"
        }
        else {
            Fail "Run A produced no findings from synthetic failure data"
        }
    }
    catch {
        Fail "Run A analysis check failed: $($_.Exception.Message)"
    }
}

# ============================================================
# 9. CREATE RUN B
# ============================================================

Section "9. Create Run B"

$sessionBId = $null

try {
    $runB = Invoke-Api `
        -Method "POST" `
        -Url "$BASE_URL/sessions" `
        -Headers @{
            "x-api-key" = $API_KEY
        } `
        -Body @{
            name     = "Integration Test Run B"
            hostname = "localhost"
        }

    $sessionBId = $runB.sessionId

    if ($runB.success -and $sessionBId) {
        Pass "POST /sessions creates Run B"
        Write-Host "  Run B: $sessionBId"
    }
    else {
        Fail "Run B response missing sessionId"
    }
}
catch {
    Fail "Creating Run B failed: $($_.Exception.Message)"
}

# ============================================================
# 10. BATCH INGESTION B
# ============================================================

Section "10. Batch Ingestion - Run B"

if ($sessionBId) {
    try {
        $batchB = Invoke-Api `
            -Method "POST" `
            -Url "$BASE_URL/track/batch" `
            -Headers @{
                "x-api-key" = $API_KEY
            } `
            -Body @{
                sessionId = $sessionBId
                events = @(
                    @{
                        endpoint     = "/users"
                        method       = "GET"
                        status       = 200
                        responseTime = 28
                    },
                    @{
                        endpoint     = "/checkout"
                        method       = "POST"
                        status       = 200
                        responseTime = 180
                    },
                    @{
                        endpoint     = "/payment"
                        method       = "POST"
                        status       = 200
                        responseTime = 120
                    }
                )
            }

        if ($batchB.success -and $batchB.inserted -eq 3) {
            Pass "Run B batch inserted 3 events"
        }
        else {
            Fail "Run B batch returned unexpected result"
        }

        $endB = Invoke-Api `
            -Method "PATCH" `
            -Url "$BASE_URL/sessions/$sessionBId/end" `
            -Headers @{
                "x-api-key" = $API_KEY
            }

        if ($endB.success) {
            Pass "Run B ended successfully"
        }
        else {
            Fail "Run B failed to end"
        }
    }
    catch {
        Fail "Run B ingestion failed: $($_.Exception.Message)"
    }
}

# ============================================================
# 11. RUN LIST
# ============================================================

Section "11. Run List"

try {
    $runList = Invoke-Api `
        -Method "GET" `
        -Url "$BASE_URL/sessions" `
        -Headers @{
            "x-api-key" = $API_KEY
        }

    if ($runList.success) {
        Pass "GET /sessions works"

        # Actual response contract:
        # runList.data
        $runCount = @($runList.data).Count

        if ($runCount -ge 2) {
            Pass "Run list contains both integration Runs"
        }
        else {
            Fail "Expected at least 2 Runs, found $runCount"
        }
    }
    else {
        Fail "GET /sessions returned unsuccessful response"
    }
}
catch {
    Fail "GET /sessions failed: $($_.Exception.Message)"
}

# ============================================================
# 12. COMPARE
# ============================================================

Section "12. Run Comparison"

if ($sessionAId -and $sessionBId) {
    try {
        $compare = Invoke-Api `
            -Method "GET" `
            -Url "$BASE_URL/sessions/compare?a=$sessionAId&b=$sessionBId" `
            -Headers @{
                "x-api-key" = $API_KEY
            }

        if ($compare.success) {
            Pass "GET /sessions/compare works"
        }
        else {
            Fail "Run comparison returned unsuccessful response"
        }
    }
    catch {
        Fail "Run comparison failed: $($_.Exception.Message)"
    }
}

# ============================================================
# 13. PUBLIC SHARE
# ============================================================

Section "13. Public Share"

if ($shareTokenA) {
    try {
        $shared = Invoke-Api `
            -Method "GET" `
            -Url "$BASE_URL/sessions/shared/$shareTokenA"

        if ($shared.success) {
            Pass "Public shared Run is accessible without API key"
        }
        else {
            Fail "Shared Run returned unsuccessful response"
        }

        $sharedJson = $shared | ConvertTo-Json -Depth 20

        if ($sharedJson -notmatch '"api_key"') {
            Pass "Shared response does not expose api_key"
        }
        else {
            Fail "Shared response exposes api_key"
        }

        if ($sharedJson -notmatch '"user_id"') {
            Pass "Shared response does not expose user_id"
        }
        else {
            Fail "Shared response exposes user_id"
        }

        if ($null -ne $shared.data.timeline) {
            Pass "Shared response includes timeline"
        }
        else {
            Fail "Shared response is missing timeline"
        }
    }
    catch {
        Fail "Public share test failed: $($_.Exception.Message)"
    }
}

# ============================================================
# 14. INVALID TOKEN
# ============================================================

Section "14. Share Token Security"

try {
    $invalidWorked = $false

    try {
        Invoke-Api `
            -Method "GET" `
            -Url "$BASE_URL/sessions/shared/not-a-real-token"
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__

        if ($statusCode -eq 404) {
            $invalidWorked = $true
        }
    }

    if ($invalidWorked) {
        Pass "Invalid share token returns 404"
    }
    else {
        Fail "Invalid share token did not return 404"
    }
}
catch {
    Fail "Invalid share-token test failed"
}

# ============================================================
# FINAL
# ============================================================

Section "FINAL RESULT"

Write-Host ""
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host ""

if ($failed -eq 0) {
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host " DEV METRICS INTEGRATION TEST PASSED" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    exit 0
}

Write-Host "============================================================" -ForegroundColor Red
Write-Host " DEV METRICS INTEGRATION TEST FAILED" -ForegroundColor Red
Write-Host "============================================================" -ForegroundColor Red
exit 1