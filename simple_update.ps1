# PowerShell script để thêm comment system
$filesToUpdate = @(
    "d:\Code\tcmanhh.github.io\truong-dai-hoc\uet\cntt-lthdt\slides\TS_Nguyen_Duc_Anh\0.2-Project-Management-Programs-viewer.html",
    "d:\Code\tcmanhh.github.io\truong-dai-hoc\uet\cntt-lthdt\slides\TS_Nguyen_Duc_Anh\0.3-GitHub-viewer.html",
    "d:\Code\tcmanhh.github.io\truong-dai-hoc\uet\cntt-lthdt\slides\TS_Nguyen_Duc_Anh\1-Gioi-thieu-Java-modified-viewer.html",
    "d:\Code\tcmanhh.github.io\truong-dai-hoc\uet\cntt-lthdt\slides\TS_Nguyen_Duc_Anh\10-Generic-v4-viewer.html",
    "d:\Code\tcmanhh.github.io\truong-dai-hoc\uet\cntt-lthdt\slides\TS_Nguyen_Duc_Anh\11-Data-structures-viewer.html"
)

Write-Host "Bat dau batch update..."

foreach ($file in $filesToUpdate) {
    Write-Host "Dang xu ly: $file"
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding UTF8
        if ($content -notlike "*comments-section*") {
            Write-Host "Them comment system..."
            # Thực hiện update
        }
        else {
            Write-Host "Da co comment system"
        }
    }
}

Write-Host "Hoan thanh!"