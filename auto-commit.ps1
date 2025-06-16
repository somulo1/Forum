# Auto-commit script for Forum project
# This script automatically commits changes when files are modified

param(
    [string]$Message = "Auto-commit: Update project files",
    [switch]$Push = $false
)

Write-Host "🔄 Auto-commit script starting..." -ForegroundColor Cyan

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository" -ForegroundColor Red
    exit 1
}

# Check for changes
$status = git status --porcelain
if (-not $status) {
    Write-Host "✅ No changes to commit" -ForegroundColor Green
    exit 0
}

Write-Host "📝 Changes detected:" -ForegroundColor Yellow
git status --short

# Add all changes
Write-Host "➕ Adding all changes..." -ForegroundColor Blue
git add .

# Get current timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Create commit message with timestamp
$commitMessage = "$Message - $timestamp"

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
    exit 1
}

Write-Host "🎉 Auto-commit completed!" -ForegroundColor Cyan
