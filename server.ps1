# PowerShell Multi-Host HTTP Web Server for AI News Writing Assistant
$port = 8089
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")

try {
    $listener.Start()
} catch {
    Write-Host "Error starting listener: $_"
    exit 1
}

Write-Host "===================================================="
Write-Host "  AI News Writing Assistant Web Server Started!"
Write-Host "  URLs:"
Write-Host "  - http://localhost:$port/"
Write-Host "  - http://127.0.0.1:$port/"
Write-Host "===================================================="

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".svg"  = "image/svg+xml"
}

$baseDir = "c:\Users\user\Desktop\demo"

try {
    while ($listener.IsListening) {
        try {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response

            $rawPath = [System.Uri]::UnescapeDataString($request.Url.LocalPath)
            if ($rawPath -eq "/") { $rawPath = "/index.html" }

            $cleanPath = $rawPath.TrimStart('/').Replace('/', '\')
            $filePath = Join-Path $baseDir $cleanPath

            if (Test-Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "text/plain; charset=utf-8" }
                $response.ContentType = $contentType
                $response.AddHeader("Access-Control-Allow-Origin", "*")

                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
                $buf = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $rawPath")
                $response.ContentLength64 = $buf.Length
                $response.OutputStream.Write($buf, 0, $buf.Length)
            }
            $response.Close()
        } catch {
            Write-Host "Request handling error: $_"
        }
    }
} finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
}
