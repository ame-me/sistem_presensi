<#
.SYNOPSIS
    Launcher for Claude Code CLI with LiteLLM Custom Gateway Authentication
.DESCRIPTION
    Launches Claude Code via LiteLLM unified endpoint with latest Claude models.
    Supports saving the API key securely to disk.
#>

param (
    [string]$BaseUrl = "https://api.koboillm.com"
)

# File path to store the encrypted key
$KeyFilePath = Join-Path $HOME ".claude_litellm_key.xml"

function Show-Menu {
    Clear-Host
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "   Claude Code (LiteLLM Authenticated)    " -ForegroundColor White
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Target URL: $BaseUrl" -ForegroundColor Gray
    Write-Host "Key Status: " -NoNewline
    if (Test-Path $KeyFilePath) {
        Write-Host "Loaded from secure storage" -ForegroundColor Green
    } else {
        Write-Host "Temporary session (Not saved)" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Select a Model:" -ForegroundColor Yellow
    Write-Host "1. Haiku 4.5  (anthropic/claude-haiku-4-5)"
    Write-Host "2. Sonnet 4.6 (anthropic/claude-sonnet-4-6)"
    Write-Host "3. Opus 4.6   (anthropic/claude-opus-4-6)"
    Write-Host "4. Custom     (Enter manually)"
    Write-Host ""
    Write-Host "R. Reset/Delete Saved Key"
    Write-Host "Q. Quit"
    Write-Host ""
}

# --- Authentication Logic ---

$ApiKey = $null

# 1. Try to load existing key
if (Test-Path $KeyFilePath) {
    try {
        $Credential = Import-Clixml -Path $KeyFilePath
        $ApiKey = $Credential.GetNetworkCredential().Password
    } catch {
        Write-Warning "Could not decrypt saved key. You may have changed your password or user."
        Remove-Item $KeyFilePath -ErrorAction SilentlyContinue
    }
}

# 2. If no key found, ask for it
if ([string]::IsNullOrWhiteSpace($ApiKey)) {
    Write-Host "Authentication Required" -ForegroundColor Cyan
    $secureKey = Read-Host -Prompt "Enter your LiteLLM Proxy API Key" -AsSecureString
    
    if (-not $secureKey) {
        Write-Warning "No key provided. Exiting."
        Exit
    }

    # Convert to plain text for session use
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
    $ApiKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

    # Ask to save
    Write-Host ""
    $saveDecision = Read-Host "Do you want to save this key securely for next time? (Y/N)"
    if ($saveDecision -eq 'Y' -or $saveDecision -eq 'y') {
        # Create a PSCredential object and export it encrypted
        $Credential = New-Object System.Management.Automation.PSCredential ("LiteLLMUser", $secureKey)
        $Credential | Export-Clixml -Path $KeyFilePath
        Write-Host "Key saved to $KeyFilePath" -ForegroundColor Green
        Start-Sleep -Seconds 1
    }
}

# --- Main Loop ---

while ($true) {
    Show-Menu
    $selection = Read-Host "Enter selection"

    $selectedModel = $null

    switch ($selection) {
        "1" { $selectedModel = "anthropic/claude-haiku-4-5" }
        "2" { $selectedModel = "anthropic/claude-sonnet-4-6" }
        "3" { $selectedModel = "anthropic/claude-opus-4-6" }
        "4" { $selectedModel = Read-Host "Enter exact model name" }
        "R" { 
            if (Test-Path $KeyFilePath) {
                Remove-Item $KeyFilePath
                Write-Host "Saved key deleted. Restart script to enter a new one." -ForegroundColor Yellow
                Exit
            } else {
                Write-Host "No saved key found to delete." -ForegroundColor Red
                Start-Sleep -Seconds 1
            }
        }
        "r" { 
             # Handle lowercase 'r' same as above
             if (Test-Path $KeyFilePath) {
                Remove-Item $KeyFilePath
                Write-Host "Saved key deleted. Restart script to enter a new one." -ForegroundColor Yellow
                Exit
            }
        }
        "Q" { Exit }
        "q" { Exit }
        Default { 
            Write-Warning "Invalid selection."
        }
    }

    if ($selectedModel) {
        Write-Host ""
        Write-Host "Configuring session..." -ForegroundColor DarkGray
        
        $env:ANTHROPIC_BASE_URL = $BaseUrl
        $env:ANTHROPIC_AUTH_TOKEN = $ApiKey
        $env:CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = "1"

        Write-Host "Launching Claude Code..." -ForegroundColor Green
        Write-Host "Model: $selectedModel" -ForegroundColor Gray
        Write-Host "------------------------------------------" -ForegroundColor DarkGray

        & claude --model $selectedModel

        # Security cleanup
        $env:ANTHROPIC_AUTH_TOKEN = $null
        
        Write-Host ""
        Write-Host "Session ended." -ForegroundColor Cyan
        Pause
        break
    }
}