# References to Windows Metadata and Runtime Assemblies
$assemblies = @(
    "System.Runtime.WindowsRuntime",
    "System.Runtime",
    "System.Threading.Tasks",
    "C:\Windows\System32\WinMetadata\Windows.Foundation.winmd",
    "C:\Windows\System32\WinMetadata\Windows.Storage.winmd",
    "C:\Windows\System32\WinMetadata\Windows.Graphics.winmd",
    "C:\Windows\System32\WinMetadata\Windows.Media.winmd"
)

$source = @"
using System;
using System.IO;
using System.Threading.Tasks;
using Windows.Media.Ocr;
using Windows.Graphics.Imaging;
using Windows.Storage;

public class WinOcr {
    public static string RecognizeText(string imagePath) {
        try {
            var task = Task.Run(async () => {
                var file = await StorageFile.GetFileFromPathAsync(imagePath);
                using (var stream = await file.OpenAsync(FileAccessMode.Read)) {
                    var decoder = await BitmapDecoder.CreateAsync(stream);
                    var bitmap = await decoder.GetSoftwareBitmapAsync();
                    var engine = OcrEngine.TryCreateFromUserProfileLanguages();
                    if (engine == null) return "OCR Engine initialization failed";
                    var result = await engine.RecognizeAsync(bitmap);
                    return result.Text;
                }
            });
            task.Wait();
            return task.Result;
        } catch (Exception ex) {
            return "Error: " + ex.Message + (ex.InnerException != null ? " (" + ex.InnerException.Message + ")" : "");
        }
    }
}
"@

try {
    Add-Type -TypeDefinition $source -ReferencedAssemblies $assemblies -ErrorAction Stop
} catch {
    Write-Host "Compilation failed: $_"
    exit 1
}

$chatFolder = "c:\Users\Sanjay\Documents\memories\public\chat"
$files = Get-ChildItem -Path $chatFolder -Filter "*.jpeg" | Select-Object -First 3

foreach ($file in $files) {
    Write-Host "Processing $($file.Name)..."
    $text = [WinOcr]::RecognizeText($file.FullName)
    Write-Host "Extracted Text:"
    Write-Host "--------------------------------"
    Write-Host $text
    Write-Host "--------------------------------`n"
}
