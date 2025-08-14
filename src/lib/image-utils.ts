import imageCompression from 'browser-image-compression';

const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const resizeImageToLimit = async (file: File): Promise<File> => {
  // 이미 1MB 이하면 그대로 반환
  if (file.size <= MAX_FILE_SIZE_BYTES) {
    return file;
  }

  try {
    const options = {
      maxSizeMB: MAX_FILE_SIZE_MB,
      maxWidthOrHeight: 1920, // 최대 해상도 제한
      useWebWorker: true,
      fileType: file.type,
    };

    const compressedFile = await imageCompression(file, options);
    
    // 압축 후에도 1MB를 초과하는 경우 더 강력한 압축 적용
    if (compressedFile.size > MAX_FILE_SIZE_BYTES) {
      const aggressiveOptions = {
        maxSizeMB: MAX_FILE_SIZE_MB * 0.8, // 좀 더 여유있게
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        fileType: file.type,
        initialQuality: 0.7, // 품질 낮춤
      };
      
      return await imageCompression(file, aggressiveOptions);
    }

    return compressedFile;
  } catch (error) {
    console.error('이미지 압축 중 오류 발생:', error);
    throw new Error('이미지 압축에 실패했습니다.');
  }
};

export const validateImageSize = (file: File): boolean => {
  return file.size <= MAX_FILE_SIZE_BYTES;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};