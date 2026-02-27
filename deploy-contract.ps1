#!/usr/bin/env pwsh
# deploy-contract.ps1
# Full automated Soroban contract deployment for Stellar Split Calculator
# Run: powershell -ExecutionPolicy Bypass -File .\deploy-contract.ps1

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ContractDir = Join-Path $ProjectRoot "contracts\split"
$EnvFile = Join-Path $ProjectRoot ".env.local"

function Write-Step($n, $msg) { Write-Host "`n[$n] $msg" -ForegroundColor Cyan }
function Write-OK($msg) { Write-Host "  OK  $msg" -ForegroundColor Green }
function Write-Info($msg) { Write-Host "  --> $msg" -ForegroundColor Yellow }

Write-Host "`n=== Stellar Split - Soroban Contract Deployer ===" -ForegroundColor Magenta

# ── STEP 1: Rust ────────────────────────────────────────────────
Write-Step 1 "Checking Rust / Cargo..."
$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"
$hasRust = $false
try { cargo --version 2>&1 | Out-Null; $hasRust = $true; Write-OK "Cargo found" } catch {}

if (-not $hasRust) {
    Write-Info "Installing Rust via rustup-init.exe..."
    $rustupExe = "$env:TEMP\rustup-init.exe"
    Invoke-WebRequest -Uri "https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe" -OutFile $rustupExe -UseBasicParsing
    Start-Process -FilePath $rustupExe -ArgumentList "-y", "--default-toolchain", "stable", "--profile", "minimal" -Wait -NoNewWindow
    $env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"
    cargo --version 2>&1 | Out-Null
    Write-OK "Rust installed"
}

# ── STEP 2: wasm32 target ───────────────────────────────────────
Write-Step 2 "Adding wasm32-unknown-unknown target..."
$installed = rustup target list --installed 2>&1
if ("$installed" -match "wasm32-unknown-unknown") {
    Write-OK "wasm32 already installed"
}
else {
    cmd /c "rustup target add wasm32-unknown-unknown"
    if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: target install failed"; exit 1 }
    Write-OK "wasm32 added"
}

# ── STEP 3: stellar-cli ─────────────────────────────────────────
Write-Step 3 "Checking stellar-cli..."
$hasStellar = $false
try { stellar --version 2>&1 | Out-Null; $hasStellar = $true; Write-OK "stellar-cli found" } catch {}

if (-not $hasStellar) {
    Write-Info "Installing stellar-cli via cargo (takes ~5 min)..."
    cmd /c "cargo install --locked stellar-cli@22"
    if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: stellar-cli install failed"; exit 1 }
    Write-OK "stellar-cli installed"
}

# ── STEP 4: Build contract ──────────────────────────────────────
Write-Step 4 "Building Soroban contract..."
Set-Location $ContractDir
cmd /c "stellar contract build"
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: contract build failed"; exit 1 }
Set-Location $ProjectRoot

$wasmPath = Join-Path $ContractDir "target\wasm32-unknown-unknown\release\split.wasm"
if (-not (Test-Path $wasmPath)) {
    Write-Host "ERROR: WASM not found. Build may have failed." -ForegroundColor Red
    exit 1
}
Write-OK "Contract built: $wasmPath"

# ── STEP 5: Testnet key ─────────────────────────────────────────
Write-Step 5 "Setting up testnet key..."
$keyName = "stellar-split-deployer"
$addrTest = stellar keys address $keyName 2>&1
if ($LASTEXITCODE -ne 0) {
    cmd /c "stellar keys generate --global $keyName --network testnet"
    Write-OK "Key generated"
}
else {
    Write-OK "Key exists"
}
$deployerAddress = (stellar keys address $keyName 2>&1).ToString().Trim()
Write-Info "Deployer: $deployerAddress"

# ── STEP 6: Fund via Friendbot ──────────────────────────────────
Write-Step 6 "Funding via Friendbot..."
try {
    $r = Invoke-WebRequest -Uri "https://friendbot.stellar.org/?addr=$deployerAddress" -UseBasicParsing
    Write-OK "Funded (status $($r.StatusCode))"
}
catch {
    Write-Info "Friendbot: $($_.Exception.Message) (may be already funded)"
}

# ── STEP 7: Deploy ──────────────────────────────────────────────
Write-Step 7 "Deploying to Stellar Testnet..."
$deployOutput = stellar contract deploy --wasm $wasmPath --source $keyName --network testnet 2>&1
Write-Host "  Deploy output: $deployOutput"

# Parse contract ID (56-char string starting with C)
$contractId = $null
foreach ($line in ($deployOutput -split "`n")) {
    $line = $line.Trim()
    if ($line -match "^(C[A-Z0-9]{55})") {
        $contractId = $Matches[1]
        break
    }
}

if (-not $contractId) {
    Write-Host "`nCould not auto-parse Contract ID from output above." -ForegroundColor Yellow
    $contractId = Read-Host "Please paste the Contract ID manually"
}
Write-OK "Contract ID: $contractId"

# ── STEP 8: Update .env.local ───────────────────────────────────
Write-Step 8 "Updating .env.local..."
Set-Content -Path $EnvFile -Value "VITE_CONTRACT_ID=$contractId" -Encoding UTF8
Write-OK ".env.local updated"

# ── STEP 9: Update README ───────────────────────────────────────
Write-Step 9 "Updating README.md..."
$readmePath = Join-Path $ProjectRoot "README.md"
$readme = Get-Content $readmePath -Raw -Encoding UTF8
$readme = $readme -replace "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4", $contractId
Set-Content -Path $readmePath -Value $readme -Encoding UTF8
Write-OK "README.md updated"

# ── STEP 10: Git commit & push ──────────────────────────────────
Write-Step 10 "Committing and pushing..."
git add .env.local README.md deploy-contract.ps1
git commit -m "feat: deploy Soroban contract - $contractId"
git push origin main

Write-Host "`n=== DEPLOYMENT COMPLETE ===" -ForegroundColor Green
Write-Host "Contract ID : $contractId" -ForegroundColor Green
Write-Host "Explorer    : https://stellar.expert/explorer/testnet/contract/$contractId" -ForegroundColor Green
Write-Host "`nRestart Vite (Ctrl+C then: npm run dev) to load new Contract ID`n"
