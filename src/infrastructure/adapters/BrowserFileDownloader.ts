import type { IFileDownloader } from '../../application/ports/IFileDownloader';

export class BrowserFileDownloader implements IFileDownloader {
  download(filename: string, content: string, mimeType: string): void {
    const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
