import { SupabaseClient } from '@supabase/supabase-js'

interface ImageUploadOptions {
  file: File
  userId: string
  supabase: SupabaseClient
  bucketName?: string
  previousUrl?: string | null
}

interface ImageUploadResult {
  publicUrl: string
  error?: string
}

export async function uploadImage({
  file,
  userId,
  supabase,
  bucketName = 'profile_picture',
  previousUrl
}: ImageUploadOptions): Promise<ImageUploadResult> {
  // Verify authentication
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    console.error('Session error:', sessionError)
    return { error: 'Authentication error', publicUrl: '' }
  }

  if (!session) {
    console.error('No active session found')
    return { error: 'User not authenticated', publicUrl: '' }
  }

  // Verify user ID matches the authenticated user
  if (session.user.id !== userId) {
    console.error('User ID mismatch:', { sessionUserId: session.user.id, providedUserId: userId })
    return { error: 'User ID mismatch', publicUrl: '' }
  }

  console.log('Authentication verified:', {
    sessionUserId: session.user.id,
    providedUserId: userId
  })

  // Validate file type
  const fileType = file.type
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg']
  if (!validTypes.includes(fileType)) {
    return { error: 'Only JPG and PNG files are allowed', publicUrl: '' }
  }

  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return { error: 'File size must be less than 5MB', publicUrl: '' }
  }

  try {
    // Generate clean filename with proper extension
    const fileExt = fileType === 'image/jpeg' ? 'jpg' : 'png'
    // Ensure the path exactly matches our RLS policy structure
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    
    console.log('Upload attempt details:', {
      bucketName,
      userId,
      fileName,
      fileType,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`
    })
    
    // Delete previous image if exists
    if (previousUrl) {
      try {
        // Extract the user ID and filename from the URL
        const urlParts = previousUrl.split('/')
        const previousFileName = urlParts[urlParts.length - 1]
        const previousUserId = urlParts[urlParts.length - 2]
        const previousPath = `${previousUserId}/${previousFileName}`
        
        console.log('Attempting to delete previous image:', {
          previousUrl,
          previousPath,
          previousUserId,
          currentUserId: userId
        })
        
        if (previousPath && previousUserId === userId) {
          await supabase.storage
            .from(bucketName)
            .remove([previousPath])
        }
      } catch (error) {
        console.error('Error removing old image:', error)
        // Continue with upload even if delete fails
      }
    }

    console.log('Attempting file upload with params:', {
      bucket: bucketName,
      path: fileName,
      contentType: fileType,
      cacheControl: '3600'
    })

    // Upload with metadata
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: fileType
      })

    if (uploadError) {
      console.error('Upload error details:', {
        error: uploadError,
        errorMessage: uploadError.message,
        errorName: uploadError.name
      })
      throw uploadError
    }

    console.log('Upload successful:', uploadData)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    console.log('Generated public URL:', publicUrl)

    return { publicUrl }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      error: error instanceof Error ? error.message : 'Failed to upload image',
      publicUrl: ''
    }
  }
} 