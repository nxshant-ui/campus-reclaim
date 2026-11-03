import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

/**
 * Uploads an enhanced, cropped canvas image data URL to Firebase Storage.
 * Falls back safely to the high-efficiency compressed base64 data URL if
 * storage bucket rules or network access are restricted in the preview environment.
 */
export async function uploadItemPhoto(dataUrl: string, itemId: string): Promise<string> {
  try {
    const filename = `items/${itemId}_${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    const snapshot = await uploadString(storageRef, dataUrl, 'data_url');
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.warn('Firebase Storage upload notice (using optimized canvas dataUrl):', error);
    return dataUrl;
  }
}
