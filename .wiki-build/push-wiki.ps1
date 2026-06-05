# Run this after enabling the wiki in GitHub Settings
# It clones the wiki repo, copies all pages, and pushes.

$token  = "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"
$remote = "https://$($token)@github.com/edward-miller-lcg/TenantOnboardingDashboard.wiki.git"
$src    = "C:\projects\TenantOnboardingDashboard\.wiki-build"
$dest   = "C:\projects\TenantOnboardingDashboard\.wiki-repo"

# Clone (or re-init if already exists)
if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
git clone $remote $dest

# Copy pages (exclude this script)
Get-ChildItem "$src\*.md" | Copy-Item -Destination $dest -Force

# Commit and push
Set-Location $dest
git config user.email "edward.miller.lantana@gmail.com"
git config user.name  "edward-miller-lcg"
git add -A
git commit -m "Add wiki: full documentation for NHSNLink Onboarding MVP"
git push origin master   # GitHub wikis use 'master' not 'main'

Write-Host ""
Write-Host "Wiki pushed! View at: https://github.com/edward-miller-lcg/TenantOnboardingDashboard/wiki"
