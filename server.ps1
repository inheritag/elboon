$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()
Write-Host "PowerShell Web Server running at http://localhost:8080/"
Write-Host "Press Ctrl+C to stop."

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        # Resolve request path
        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/" -or $urlPath -eq "") { 
            $urlPath = "/index.html" 
        }
        
        # Construct absolute file path
        $filePath = [System.IO.Path]::Combine((Get-Location).Path, $urlPath.TrimStart('/'))
        
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            
            # Set content-type header
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css" { "text/css" }
                ".js" { "application/javascript" }
                ".svg" { "image/svg+xml" }
                ".png" { "image/png" }
                ".jpg" { "image/jpeg" }
                default { "application/octet-stream" }
            }
            
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.ContentType = "text/plain"
            $response.ContentLength64 = $errBytes.Length
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    }
} catch {
    Write-Host "Error in web server: $_"
} finally {
    $listener.Stop()
    Write-Host "Server stopped."
}
