# Script to update old file paths to new organized structure
# Created: 2025-10-19

Write-Host "`n🔄 Cập nhật đường dẫn files sang cấu trúc mới...`n" -ForegroundColor Cyan

# Define path mappings (old -> new)
$pathMappings = @{
    # Performance docs
    'PERFORMANCE_OPTIMIZATION_REPORT\.md' = 'docs/performance/PERFORMANCE_OPTIMIZATION_REPORT.md'
    'OPTIMIZATION_CHECKLIST_V2\.md' = 'docs/performance/OPTIMIZATION_CHECKLIST_V2.md'
    'PERFORMANCE_AUDIT_FIXES\.md' = 'docs/performance/PERFORMANCE_AUDIT_FIXES.md'
    'WATERFALL_ANALYSIS\.md' = 'docs/performance/WATERFALL_ANALYSIS.md'
    'performance-audit-results\.json' = 'docs/performance/performance-audit-results.json'
    'SEARCH_PERFORMANCE_TEST\.html' = 'docs/performance/SEARCH_PERFORMANCE_TEST.html'
    
    # Search docs
    'SEARCH_FIX_DOCUMENTATION\.md' = 'docs/search/SEARCH_FIX_DOCUMENTATION.md'
    'SEARCH_FIX_SUMMARY\.md' = 'docs/search/SEARCH_FIX_SUMMARY.md'
    'SEARCH_QUICK_REFERENCE\.md' = 'docs/search/SEARCH_QUICK_REFERENCE.md'
    'SEARCH_BEFORE_AFTER_COMPARISON\.md' = 'docs/search/SEARCH_BEFORE_AFTER_COMPARISON.md'
    'search-results\.html' = 'docs/search/search-results.html'
    
    # Icon docs
    'ICON_SYSTEM_DOCUMENTATION\.md' = 'docs/icons/ICON_SYSTEM_DOCUMENTATION.md'
    'ICON_OPTIMIZATION_SUMMARY\.md' = 'docs/icons/ICON_OPTIMIZATION_SUMMARY.md'
    'QUICKSTART_SVG_MIGRATION\.md' = 'docs/icons/QUICKSTART_SVG_MIGRATION.md'
    
    # Audit docs
    'AUDIT_EXECUTIVE_SUMMARY\.md' = 'docs/audit/AUDIT_EXECUTIVE_SUMMARY.md'
    
    # Templates (for absolute paths)
    '"/header\.html"' = '"/templates/header.html"'
    "'/header\.html'" = "'/templates/header.html'"
    '"/footer\.html"' = '"/templates/footer.html"'
    "'/footer\.html'" = "'/templates/footer.html'"
    '"/breadcrumb\.html"' = '"/templates/breadcrumb.html"'
    "'/breadcrumb\.html'" = "'/templates/breadcrumb.html'"
    
    # Scripts
    'bulk_add_comments\.ps1' = 'scripts/bulk_add_comments.ps1'
    'migrate-to-svg-icons\.ps1' = 'scripts/migrate-to-svg-icons.ps1'
    'build-search-index\.js' = 'scripts/build-search-index.js'
}

# Files to update
$filesToUpdate = @(
    "index.html"
    "truong-dai-hoc.html"
    "truong-dai-hoc\uet.html"
    "docs\README.md"
    "scripts\README.md"
    "templates\README.md"
    "docs\FILE_STRUCTURE_MAP.md"
    "PROJECT_OVERVIEW.md"
    "REORGANIZATION_SUMMARY.md"
)

$totalUpdates = 0
$filesUpdated = 0

foreach ($file in $filesToUpdate) {
    $filePath = Join-Path "d:\Code\tcmanhh.github.io" $file
    
    if (-not (Test-Path $filePath)) {
        Write-Host "⚠️  Skip: $file (không tồn tại)" -ForegroundColor Yellow
        continue
    }
    
    $content = Get-Content $filePath -Raw -Encoding UTF8
    $originalContent = $content
    $fileUpdates = 0
    
    foreach ($oldPath in $pathMappings.Keys) {
        $newPath = $pathMappings[$oldPath]
        
        # Replace patterns
        $patterns = @(
            "(?<!/)$oldPath",  # Not preceded by /
            "href=[`"']$oldPath[`"']",
            "src=[`"']$oldPath[`"']",
            "\($oldPath\)",
            "``$oldPath``"
        )
        
        foreach ($pattern in $patterns) {
            if ($content -match $pattern) {
                $beforeCount = ([regex]::Matches($content, $pattern)).Count
                $replacement = $newPath
                
                # Special handling for different contexts
                if ($pattern -match "href=") {
                    $content = $content -replace "href=[`"']$oldPath[`"']", "href=`"$newPath`""
                }
                elseif ($pattern -match "src=") {
                    $content = $content -replace "src=[`"']$oldPath[`"']", "src=`"$newPath`""
                }
                elseif ($pattern -match "\(") {
                    $content = $content -replace "\($oldPath\)", "($newPath)"
                }
                elseif ($pattern -match "``") {
                    $content = $content -replace "``$oldPath``", "``$newPath``"
                }
                else {
                    $content = $content -replace "(?<!/)$oldPath", $newPath
                }
                
                $afterCount = ([regex]::Matches($content, $pattern)).Count
                $updateCount = $beforeCount - $afterCount
                
                if ($updateCount -gt 0) {
                    $fileUpdates += $updateCount
                    Write-Host "  ✓ $file: $oldPath → $newPath ($updateCount)" -ForegroundColor Gray
                }
            }
        }
    }
    
    if ($content -ne $originalContent) {
        $content | Out-File -FilePath $filePath -Encoding UTF8 -NoNewline
        $filesUpdated++
        $totalUpdates += $fileUpdates
        Write-Host "✅ Updated: $file ($fileUpdates replacements)" -ForegroundColor Green
    }
    else {
        Write-Host "⏭️  Skip: $file (no changes)" -ForegroundColor Gray
    }
}

Write-Host "`n📊 SUMMARY:" -ForegroundColor Cyan
Write-Host "  Files checked: $($filesToUpdate.Count)" -ForegroundColor White
Write-Host "  Files updated: $filesUpdated" -ForegroundColor Green
Write-Host "  Total replacements: $totalUpdates" -ForegroundColor Green
Write-Host "`n✅ Done!`n" -ForegroundColor Green
