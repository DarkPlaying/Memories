using System;
using System.IO;
using Windows.Media.Ocr;
using Windows.Graphics.Imaging;
using Windows.Storage;
using Windows.Foundation;

class Program {
    static void Main(string[] args) {
        if (args.Length == 0) {
            Console.WriteLine("Usage: ocr.exe <image_path>");
            return;
        }
        string path = args[0];
        if (!File.Exists(path)) {
            Console.Write("Error: File not found");
            return;
        }
        try {
            // 1. Get file
            var fileOp = StorageFile.GetFileFromPathAsync(Path.GetFullPath(path));
            while (fileOp.Status == AsyncStatus.Started) {
                System.Threading.Thread.Sleep(5);
            }
            var file = fileOp.GetResults();

            // 2. Open stream
            var streamOp = file.OpenAsync(FileAccessMode.Read);
            while (streamOp.Status == AsyncStatus.Started) {
                System.Threading.Thread.Sleep(5);
            }
            var stream = streamOp.GetResults();

            // 3. Create decoder
            var decoderOp = BitmapDecoder.CreateAsync(stream);
            while (decoderOp.Status == AsyncStatus.Started) {
                System.Threading.Thread.Sleep(5);
            }
            var decoder = decoderOp.GetResults();

            // 4. Get software bitmap
            var bitmapOp = decoder.GetSoftwareBitmapAsync();
            while (bitmapOp.Status == AsyncStatus.Started) {
                System.Threading.Thread.Sleep(5);
            }
            var bitmap = bitmapOp.GetResults();

            // 5. Recognize text
            var engine = OcrEngine.TryCreateFromUserProfileLanguages();
            if (engine == null) {
                Console.Write("Error: Failed to create OCR Engine");
                return;
            }
            var ocrOp = engine.RecognizeAsync(bitmap);
            while (ocrOp.Status == AsyncStatus.Started) {
                System.Threading.Thread.Sleep(5);
            }
            var result = ocrOp.GetResults();

            Console.Write(result.Text);
        } catch (Exception ex) {
            var innerMsg = ex.InnerException != null ? " (" + ex.InnerException.Message + ")" : "";
            Console.Write("Error: " + ex.Message + innerMsg);
        }
    }
}
