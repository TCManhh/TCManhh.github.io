# SCRIPT CHUAN HOA TAT CA VIEWER FILES
# Ap dung template tu c1-viewer.html

$ErrorActionPreference = "Stop"
$rootPath = "d:\Code\tcmanhh.github.io"
$referenceFile = "$rootPath\truong-dai-hoc\uet\cntt-csdl\slides\GVkhoaCNTT-documents\c1-viewer.html"

Write-Host "`n=== CHUAN HOA TAT CA VIEWER FILES ===" -ForegroundColor Cyan

# Doc reference template
$referenceContent = Get-Content $referenceFile -Raw -Encoding UTF8

# Tim tat ca viewer files
$viewerFiles = Get-ChildItem -Path "$rootPath\truong-dai-hoc" -Filter "*-viewer.html" -Recurse -File

Write-Host "Tim thay: $($viewerFiles.Count) viewer files`n" -ForegroundColor Yellow

$successCount = 0
$skipCount = 0
$errorCount = 0
$errors = @()

foreach ($file in $viewerFiles) {
    try {
        Write-Host "  Processing: $($file.Name)" -ForegroundColor Gray
        
        # Doc file hien tai
        $currentContent = Get-Content $file.FullName -Raw -Encoding UTF8
        
        # Trich xuat title
        if ($currentContent -match '<title>(.*?)</title>') {
            $title = $matches[1]
        } else {
            $title = "Slide - StuShare"
            Write-Host "     WARNING: No title found, using default" -ForegroundColor DarkYellow
        }
        
        # Trich xuat data-pdf-url
        $pdfUrlPattern = 'data-pdf-url="([^"]*)"'
        if ($currentContent -match $pdfUrlPattern) {
            $pdfUrl = $matches[1]
        } else {
            Write-Host "     WARNING: No data-pdf-url found, skipping" -ForegroundColor DarkYellow
            $skipCount++
            continue
        }
        
        # Kiem tra neu da chuan
        $hasNewPdfJs = $currentContent -match 'pdf\.js/2\.16\.105'
        $hasLayoutJs = $currentContent -match '/assets/js/layout\.js'
        $hasPdfViewerJs = $currentContent -match '/assets/js/pdf-viewer\.js'
        
        if ($hasNewPdfJs -and $hasLayoutJs -and $hasPdfViewerJs) {
            Write-Host "     OK: Already standardized" -ForegroundColor Green
            $skipCount++
            continue
        }
        
        # Tao noi dung moi tu template
        $newContent = $referenceContent
        
        # Thay the title
        $newContent = $newContent -replace '<title>.*?</title>', "<title>$title</title>"
        
        # Thay the data-pdf-url
        $urlReplacement = "data-pdf-url=`"$pdfUrl`""
        $newContent = $newContent -replace 'data-pdf-url="[^"]*"', $urlReplacement
        
        # Ghi de file
        $newContent | Out-File -FilePath $file.FullName -Encoding UTF8 -NoNewline
        
        Write-Host "     SUCCESS: Standardized" -ForegroundColor Green
        $successCount++
        
    } catch {
        Write-Host "     ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
        $errors += @{
            File = $file.Name
            Error = $_.Exception.Message
        }
    }
}

# Tong ket
Write-Host "`n=== KET QUA CHUAN HOA ===" -ForegroundColor Cyan
Write-Host "  Success:  $successCount files" -ForegroundColor Green
Write-Host "  Skipped:  $skipCount files (already standardized or missing data)" -ForegroundColor Yellow
Write-Host "  Errors:   $errorCount files" -ForegroundColor Red
Write-Host "  Total:    $($viewerFiles.Count) files`n" -ForegroundColor White

if ($errorCount -gt 0) {
    Write-Host "`nERROR DETAILS:" -ForegroundColor Red
    foreach ($err in $errors) {
        Write-Host "   - $($err.File): $($err.Error)" -ForegroundColor DarkRed
    }
}

if ($successCount -gt 0) {
    Write-Host "`n=== DA CHUAN HOA $successCount VIEWER FILES! ===" -ForegroundColor Green
    Write-Host "`nCHANGES APPLIED:" -ForegroundColor Yellow
    Write-Host "   - Updated PDF.js to 2.16.105" -ForegroundColor Gray
    Write-Host "   - Script paths: /assets/js/layout.js, /assets/js/pdf-viewer.js" -ForegroundColor Gray
    Write-Host "   - HTML5 doctype & clean structure" -ForegroundColor Gray
    Write-Host "   - Consistent canvas layout (left/right)" -ForegroundColor Gray
    Write-Host "   - Fixed breadcrumb class on body" -ForegroundColor Gray
    Write-Host "   - Font Awesome 6.4.2" -ForegroundColor Gray
}
