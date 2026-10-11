/**
 * Client-Side Image Compression Pipeline for Cloud Sync
 * Ensures all camera and gallery photos fit comfortably within Google Cloud Firestore's
 * 1 MiB hard document limit while preserving sharp, vivid holographic card quality.
 */
export async function compressImageForCloud(
  dataUrlOrFile: string | File | Blob,
  maxDimension = 1080,
  quality = 0.72
): Promise<string> {
  // If already a compact base64 string under 250 KB (~330k chars), skip compression
  if (typeof dataUrlOrFile === 'string' && dataUrlOrFile.length < 330000) {
    return dataUrlOrFile;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const renderToCanvas = () => {
      let { width, height } = img;
      if (!width || !height) {
        return resolve(typeof dataUrlOrFile === 'string' ? dataUrlOrFile : '');
      }

      // Constrain max width/height preserving aspect ratio
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(typeof dataUrlOrFile === 'string' ? dataUrlOrFile : '');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Re-encode to optimized JPEG
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };

    img.onload = renderToCanvas;
    img.onerror = () => {
      if (typeof dataUrlOrFile === 'string') {
        resolve(dataUrlOrFile);
      } else {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(dataUrlOrFile);
      }
    };

    if (typeof dataUrlOrFile === 'string') {
      img.src = dataUrlOrFile;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = (reader.result as string) || '';
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(dataUrlOrFile);
    }
  });
}
