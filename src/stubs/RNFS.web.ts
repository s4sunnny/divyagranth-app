// Web stub for react-native-fs — file downloads/storage not available on web.
// DownloadService will silently skip downloads; everything else stays functional.

const RNFS = {
  DocumentDirectoryPath: '/web-documents',

  async exists(_path: string): Promise<boolean> {
    return false;
  },

  async mkdir(_path: string): Promise<void> {},

  async unlink(_path: string): Promise<void> {},

  async stat(_path: string): Promise<{size: number}> {
    return {size: 0};
  },

  downloadFile(_options: {
    fromUrl: string;
    toFile: string;
    progress?: (res: any) => void;
    progressInterval?: number;
  }): {promise: Promise<{statusCode: number}>} {
    return {
      promise: Promise.reject(
        new Error('File downloads are not available on web.'),
      ),
    };
  },
};

export default RNFS;
