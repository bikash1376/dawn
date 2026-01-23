'use server'

import { uploadImage } from '@/lib/cloudinary';

export async function uploadImageAction(base64Data: string) {
    try {
        const url = await uploadImage(base64Data);
        return { url };
    } catch (e) {
        console.error("Upload failed", e);
        return { error: 'Upload failed' };
    }
}
