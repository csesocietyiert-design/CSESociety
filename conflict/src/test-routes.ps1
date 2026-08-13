$routes = @(
    @{method='GET'; path='/'; desc='Home page'},
    @{method='GET'; path='/api/members'; desc='Get members'},
    @{method='GET'; path='/api/events'; desc='Get events'},
    @{method='GET'; path='/api/announcements'; desc='Get announcements'},
    @{method='GET'; path='/api/notifications'; desc='Get notifications'},
    @{method='GET'; path='/api/certificates'; desc='Get certificates'},
    @{method='GET'; path='/api/resources'; desc='Get resources'},
    @{method='GET'; path='/api/finance/expenses'; desc='Get expenses'},
    @{method='GET'; path='/api/finance/income'; desc='Get income'},
    @{method='GET'; path='/api/finance/transactions'; desc='Get transactions'},
    @{method='GET'; path='/api/admin/audit-logs'; desc='Get audit logs'},
    @{method='GET'; path='/api/admin/society-id'; desc='Get society ID'},
    @{method='GET'; path='/api/auth/session'; desc='Get session'},
    @{method='POST'; path='/api/auth/login'; desc='Login'},
    @{method='POST'; path='/api/auth/logout'; desc='Logout'},
    @{method='GET'; path='/api/members/1'; desc='Get member by ID'},
    @{method='GET'; path='/api/events/1'; desc='Get event by ID'},
    @{method='POST'; path='/api/members'; desc='Create member'},
    @{method='POST'; path='/api/events'; desc='Create event'}
)

Write-Host "Testing All Routes" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""

$results = @()
foreach ($route in $routes) {
    $url = "http://localhost:3000$($route.path)"
    try {
        $response = Invoke-WebRequest -Uri $url -Method $route.method -SkipHttpErrorCheck -TimeoutSec 3 -ErrorAction Stop
        $status = $response.StatusCode
    } catch {
        $status = "ERROR"
    }
    
    $color = switch($status) {
        200 { 'Green' }
        201 { 'Green' }
        400 { 'Yellow' }
        401 { 'Yellow' }
        404 { 'Red' }
        405 { 'Yellow' }
        default { 'Gray' }
    }
    
    Write-Host "$($route.method.PadRight(4)) $($route.path.PadRight(30)) $($route.desc)" -NoNewline
    Write-Host " → $status" -ForegroundColor $color
    
    $results += @{route=$route.path; method=$route.method; status=$status}
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
$passed = @($results | Where-Object {$_.status -in @(200,201)}).Count
$failed = @($results | Where-Object {$_.status -eq 404}).Count
$other = @($results | Where-Object {$_.status -notin @(200,201,404)}).Count

Write-Host "[PASS] Passed (200/201): $passed" -ForegroundColor Green
Write-Host "[FAIL] Failed (404): $failed" -ForegroundColor Red
Write-Host "[OTHER] Other status codes: $other" -ForegroundColor Yellow
