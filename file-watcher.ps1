# File Watcher Script for Auto-commit
# Watches for file changes and automatically commits them

param(
    [string]$WatchPath = ".",
    [int]$DelaySeconds = 5,
    [switch]$Push = $false,
    [string[]]$IgnorePatterns = @("*.log", "*.tmp", ".git/*", "node_modules/*", "*.exe")
)

Write-Host "👀 Starting file watcher for auto-commit..." -ForegroundColor Cyan
Write-Host "📁 Watching path: $WatchPath" -ForegroundColor Blue
Write-Host "⏱️  Commit delay: $DelaySeconds seconds" -ForegroundColor Blue
Write-Host "🚀 Auto-push: $Push" -ForegroundColor Blue

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository" -ForegroundColor Red
    exit 1
}

# Create file system watcher
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = Resolve-Path $WatchPath
$watcher.Filter = "*.*"
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

# Variables for debouncing
$lastChangeTime = Get-Date
$timer = $null

# Function to check if file should be ignored
function Should-IgnoreFile {
    param([string]$FilePath)
    
    foreach ($pattern in $IgnorePatterns) {
        if ($FilePath -like $pattern) {
            return $true
        }
    }
    return $false
}

# Function to commit changes
function Invoke-AutoCommit {
    Write-Host "🔄 Checking for changes to commit..." -ForegroundColor Yellow
    
    # Check for changes
    $status = git status --porcelain
    if (-not $status) {
        Write-Host "✅ No changes to commit" -ForegroundColor Green
        return
    }
    
    # Filter out ignored files
    $filteredChanges = @()
    foreach ($line in $status) {
        $filePath = $line.Substring(3)
        if (-not (Should-IgnoreFile $filePath)) {
            $filteredChanges += $line
        }
    }
    
    if ($filteredChanges.Count -eq 0) {
        Write-Host "✅ No relevant changes to commit (all changes ignored)" -ForegroundColor Green
        return
    }
    
    Write-Host "📝 Changes detected:" -ForegroundColor Yellow
    $filteredChanges | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    
    # Add all changes
    git add .
    
    # Create commit message with timestamp and file count
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $fileCount = $filteredChanges.Count
    $commitMessage = "auto: update $fileCount file$(if($fileCount -ne 1){'s'}) - $timestamp"
    
    # Commit changes
    Write-Host "💾 Committing changes..." -ForegroundColor Blue
    git commit -m $commitMessage
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully committed changes" -ForegroundColor Green
        
        # Push if requested
        if ($Push) {
            Write-Host "🚀 Pushing to remote repository..." -ForegroundColor Blue
            $currentBranch = git branch --show-current
            git push origin $currentBranch
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Successfully pushed to remote" -ForegroundColor Green
            } else {
                Write-Host "❌ Failed to push to remote" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "❌ Failed to commit changes" -ForegroundColor Red
    }
}

# Event handler for file changes
$action = {
    $path = $Event.SourceEventArgs.FullPath
    $changeType = $Event.SourceEventArgs.ChangeType
    $relativePath = $path.Replace((Get-Location).Path, "").TrimStart('\')
    
    # Skip if file should be ignored
    if (Should-IgnoreFile $relativePath) {
        return
    }
    
    Write-Host "📄 File changed: $relativePath ($changeType)" -ForegroundColor Gray
    
    # Update last change time
    $script:lastChangeTime = Get-Date
    
    # Cancel existing timer
    if ($script:timer) {
        $script:timer.Stop()
        $script:timer.Dispose()
    }
    
    # Create new timer for debouncing
    $script:timer = New-Object System.Timers.Timer
    $script:timer.Interval = $DelaySeconds * 1000
    $script:timer.AutoReset = $false
    
    # Timer event handler
    $timerAction = {
        Invoke-AutoCommit
    }
    
    Register-ObjectEvent -InputObject $script:timer -EventName Elapsed -Action $timerAction | Out-Null
    $script:timer.Start()
}

# Register event handlers
Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action $action | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName "Created" -Action $action | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName "Deleted" -Action $action | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName "Renamed" -Action $action | Out-Null

Write-Host "✅ File watcher started. Press Ctrl+C to stop." -ForegroundColor Green
Write-Host "🔍 Monitoring for changes..." -ForegroundColor Blue

try {
    # Keep the script running
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    # Cleanup
    $watcher.EnableRaisingEvents = $false
    $watcher.Dispose()
    if ($timer) {
        $timer.Stop()
        $timer.Dispose()
    }
    Get-EventSubscriber | Unregister-Event
    Write-Host "🛑 File watcher stopped." -ForegroundColor Red
}
