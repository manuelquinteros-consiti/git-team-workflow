export interface IFileDownloader {
  download(filename: string, content: string, mimeType: string): void;
}
