# Quick commit function for rapid development
# Usage: .\quick-commit.ps1 "Your commit message"

param(
    [string]$Message = "",
    [switch]$Push = $false,
    [switch]$Interactive = $false
)

function Write-ColorText {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

function Get-CommitMessage {
    if ($Message) {
        return $Message
    }
    
    if ($Interactive) {
        Write-ColorText "📝 Enter commit message (or press Enter for auto-generated):" "Yellow"
        $userMessage = Read-Host
        if ($userMessage) {
            return $userMessage
        }
    }
    
    # Auto-generate commit message based on changes
    $status = git status --porcelain
    if (-not $status) {
        return "chore: no changes detected"
    }
    
    $changes = @{
        "A" = @()  # Added
        "M" = @()  # Modified
        "D" = @()  # Deleted
        "R" = @()  # Renamed
        "??" = @() # Untracked
    }
    
    foreach ($line in $status) {
        $statusCode = $line.Substring(0, 2).Trim()
        $fileName = $line.Substring(3)
        
        if ($changes.ContainsKey($statusCode)) {
            $changes[$statusCode] += $fileName
        } else {
            $changes["M"] += $fileName
        }
    }
    
    $messageParts = @()
    
    if ($changes["A"].Count -gt 0) {
        $messageParts += "add $($changes["A"].Count) file$(if($changes["A"].Count -ne 1){'s'})"
    }
    if ($changes["M"].Count -gt 0) {
        $messageParts += "update $($changes["M"].Count) file$(if($changes["M"].Count -ne 1){'s'})"
    }
    if ($changes["D"].Count -gt 0) {
        $messageParts += "delete $($changes["D"].Count) file$(if($changes["D"].Count -ne 1){'s'})"
    }
    if ($changes["??"].Count -gt 0) {
        $messageParts += "add $($changes["??"].Count) new file$(if($changes["??"].Count -ne 1){'s'})"
    }
    
    if ($messageParts.Count -eq 0) {
        return "chore: update project files"
    }
    
    $action = $messageParts -join ", "
    return "auto: $action"
}

function Show-GitStatus {
    Write-ColorText "📊 Current git status:" "Blue"
    git status --short
    Write-Host ""
}

function Main {
    Write-ColorText "🚀 Quick Commit Tool" "Cyan"
    Write-Host ""
    
    # Check if we're in a git repository
    if (-not (Test-Path ".git")) {
        Write-ColorText "❌ Error: Not in a git repository" "Red"
        exit 1
    }
    
    # Show current status
    Show-GitStatus
    
    # Check for changes
    $status = git status --porcelain
    if (-not $status) {
        Write-ColorText "✅ No changes to commit" "Green"
        exit 0
    }
    
    # Get commit message
    $commitMessage = Get-CommitMessage
    Write-ColorText "💬 Commit message: $commitMessage" "Yellow"
    
    if ($Interactive) {
        Write-ColorText "❓ Proceed with commit? (y/N):" "Yellow"
        $confirm = Read-Host
        if ($confirm -notmatch "^[Yy]") {
            Write-ColorText "❌ Commit cancelled" "Red"
            exit 0
        }
    }
    
    # Add all changes
    Write-ColorText "➕ Adding all changes..." "Blue"
    git add .
    
    # Commit changes
    Write-ColorText "💾 Committing changes..." "Blue"
    git commit -m $commitMessage
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorText "✅ Successfully committed changes" "Green"
        
        # Show commit info
        Write-ColorText "📋 Commit details:" "Blue"
        git log -1 --oneline
        
        # Push if requested
        if ($Push) {
            Write-ColorText "🚀 Pushing to remote repository..." "Blue"
            $currentBranch = git branch --show-current
            git push origin $currentBranch
            
            if ($LASTEXITCODE -eq 0) {
                Write-ColorText "✅ Successfully pushed to remote" "Green"
            } else {
                Write-ColorText "❌ Failed to push to remote" "Red"
                exit 1
            }
        } else {
            Write-ColorText "💡 Tip: Use -Push flag to automatically push to remote" "Gray"
        }
    } else {
        Write-ColorText "❌ Failed to commit changes" "Red"
        exit 1
    }
    
    Write-ColorText "🎉 Quick commit completed!" "Cyan"
}

# Run main function
Main
