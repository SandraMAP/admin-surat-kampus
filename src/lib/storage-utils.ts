import { supabase } from '@/integrations/supabase/client';

export const getSignedUrl = async (fileUrl: string): Promise<string | null> => {
  try {
    // Check if this is a Supabase storage URL
    if (!fileUrl.includes('supabase.co/storage/v1/object/public/')) {
      // If it's not a Supabase storage URL, return as-is
      return fileUrl;
    }

    // Extract the bucket and path from the URL
    // Format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file
    const urlParts = fileUrl.split('/storage/v1/object/public/');
    if (urlParts.length !== 2) {
      return fileUrl;
    }

    const pathPart = urlParts[1];
    const slashIndex = pathPart.indexOf('/');
    if (slashIndex === -1) {
      return fileUrl;
    }

    const bucket = pathPart.substring(0, slashIndex);
    const path = pathPart.substring(slashIndex + 1);

    // Create a signed URL that expires in 1 hour
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600); // 1 hour expiry

    if (error) {
      console.error('Error creating signed URL:', error);
      return fileUrl; // Fallback to original URL
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error in getSignedUrl:', error);
    return fileUrl;
  }
};

export const downloadFile = async (fileUrl: string, fileName?: string) => {
  try {
    const signedUrl = await getSignedUrl(fileUrl);
    if (!signedUrl) {
      throw new Error('Could not generate download URL');
    }

    // Fetch the file
    const response = await fetch(signedUrl);
    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'surat.pdf';
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};
