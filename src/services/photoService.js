/**
 * PhotoService - Handles photo upload, management, and markdown integration
 * Works with GraphService to store photos on OneDrive
 */

import { filterLogger } from '../utils/logger'

class PhotoService {
  constructor(graphService) {
    this.graphService = graphService
  }

  /**
   * Generate unique filename for photo
   * Format: photo_timestamp_randomId.jpg
   * @returns {string} Unique filename
   */
  generatePhotoName() {
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substr(2, 9)
    return `photo_${timestamp}_${randomId}.jpg`
  }

  /**
   * Upload photo blob to OneDrive and return markdown reference
   * @param {Blob} photoBlob - Photo blob from camera/canvas
   * @param {string} altText - Optional alt text for accessibility
   * @returns {Promise<Object>} Upload result with markdown reference
   */
  async uploadPhoto(photoBlob, altText = 'Photo') {
    try {
      filterLogger.info('Starting photo upload', { 
        size: photoBlob.size,
        type: photoBlob.type 
      })

      const fileName = this.generatePhotoName()
      
      // Upload to OneDrive
      const response = await this.graphService.uploadPhoto(photoBlob, fileName)
      
      // Get download URL for immediate use
      const downloadUrl = response['@microsoft.graph.downloadUrl'] || 
                         await this.graphService.getPhotoUrl(fileName)

      const result = {
        fileName,
        markdown: `![${altText}](onedrive:photos/${fileName})`,
        downloadUrl,
        uploadResponse: response
      }

      filterLogger.info('Photo uploaded successfully', { 
        fileName,
        downloadUrl: !!downloadUrl
      })

      return result
    } catch (error) {
      filterLogger.error('Photo upload failed', { 
        error: error.message,
        size: photoBlob?.size
      })
      throw new Error(`Failed to upload photo: ${error.message}`)
    }
  }

  /**
   * Extract photo references from todo text
   * Finds all markdown image references with onedrive:photos/ URLs
   * @param {string} todoText - Todo text to parse
   * @returns {Array<Object>} Array of photo references
   */
  extractPhotoRefs(todoText) {
    if (!todoText || typeof todoText !== 'string') {
      return []
    }

    const regex = /!\[([^\]]*)\]\(onedrive:photos\/([^)]+)\)/g
    const photos = []
    let match

    while ((match = regex.exec(todoText)) !== null) {
      photos.push({
        alt: match[1] || 'Photo',
        fileName: match[2],
        markdown: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length
      })
    }

    filterLogger.debug('Extracted photo references', { 
      count: photos.length,
      photos: photos.map(p => p.fileName)
    })

    return photos
  }

  /**
   * Get photo download URL from OneDrive
   * @param {string} fileName - Photo filename
   * @returns {Promise<string|null>} Download URL or null if not found
   */
  async getPhotoUrl(fileName) {
    try {
      const url = await this.graphService.getPhotoUrl(fileName)
      if (url) {
        filterLogger.debug('Photo URL retrieved', { fileName })
      } else {
        filterLogger.warn('Photo URL not found', { fileName })
      }
      return url
    } catch (error) {
      filterLogger.error('Failed to get photo URL', { 
        fileName, 
        error: error.message 
      })
      return null
    }
  }

  /**
   * Get photo metadata from OneDrive
   * @param {string} fileName - Photo filename
   * @returns {Promise<Object|null>} Photo metadata or null if not found
   */
  async getPhotoInfo(fileName) {
    try {
      const info = await this.graphService.getPhotoInfo(fileName)
      if (info) {
        filterLogger.debug('Photo info retrieved', { fileName, size: info.size })
      }
      return info
    } catch (error) {
      filterLogger.error('Failed to get photo info', { 
        fileName, 
        error: error.message 
      })
      return null
    }
  }

  /**
   * Delete photo from OneDrive
   * @param {string} fileName - Photo filename to delete
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deletePhoto(fileName) {
    try {
      await this.graphService.deletePhoto(fileName)
      filterLogger.info('Photo deleted', { fileName })
      return true
    } catch (error) {
      filterLogger.error('Failed to delete photo', { 
        fileName, 
        error: error.message 
      })
      return false
    }
  }

  /**
   * Find and cleanup orphaned photos (photos not referenced by any todos)
   * @param {Array<Object>} allTodos - All todo items to check references against
   * @returns {Promise<Object>} Cleanup results
   */
  async cleanupOrphanedPhotos(allTodos) {
    try {
      filterLogger.info('Starting orphaned photo cleanup', { 
        todoCount: allTodos.length 
      })

      // Get all photos from OneDrive
      const allPhotos = await this.graphService.listPhotos()
      const photoFileNames = allPhotos.map(photo => photo.name)

      // Get all photo references from todos
      const referencedPhotos = new Set()
      allTodos.forEach(todo => {
        if (todo.text) {
          const photoRefs = this.extractPhotoRefs(todo.text)
          photoRefs.forEach(ref => referencedPhotos.add(ref.fileName))
        }
      })

      // Find orphaned photos
      const orphanedPhotos = photoFileNames.filter(fileName => 
        !referencedPhotos.has(fileName)
      )

      const results = {
        totalPhotos: photoFileNames.length,
        referencedPhotos: referencedPhotos.size,
        orphanedPhotos: orphanedPhotos.length,
        deletedPhotos: 0,
        errors: []
      }

      // Delete orphaned photos
      if (orphanedPhotos.length > 0) {
        filterLogger.info('Found orphaned photos', { 
          count: orphanedPhotos.length,
          photos: orphanedPhotos
        })

        for (const fileName of orphanedPhotos) {
          try {
            await this.deletePhoto(fileName)
            results.deletedPhotos++
          } catch (error) {
            results.errors.push({ fileName, error: error.message })
          }
        }
      }

      filterLogger.info('Photo cleanup completed', results)
      return results
    } catch (error) {
      filterLogger.error('Photo cleanup failed', { error: error.message })
      throw error
    }
  }

  /**
   * Validate photo blob before upload
   * @param {Blob} photoBlob - Photo blob to validate
   * @returns {Object} Validation result
   */
  validatePhotoBlob(photoBlob) {
    const result = {
      valid: true,
      errors: []
    }

    if (!photoBlob || !(photoBlob instanceof Blob)) {
      result.valid = false
      result.errors.push('Invalid photo data')
      return result
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (photoBlob.size > maxSize) {
      result.valid = false
      result.errors.push('Photo is too large (max 10MB)')
    }

    // Check file type
    if (!photoBlob.type.startsWith('image/')) {
      result.valid = false
      result.errors.push('Invalid file type (must be an image)')
    }

    // Minimum size check (avoid empty files)
    if (photoBlob.size < 1024) { // 1KB minimum
      result.valid = false
      result.errors.push('Photo file is too small')
    }

    return result
  }

  /**
   * Convert canvas to compressed JPEG blob
   * @param {HTMLCanvasElement} canvas - Canvas element with photo
   * @param {number} quality - JPEG quality (0.0 to 1.0)
   * @returns {Promise<Blob>} Compressed photo blob
   */
  async canvasToBlob(canvas, quality = 0.8) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create photo blob from canvas'))
        }
      }, 'image/jpeg', quality)
    })
  }

  /**
   * Get storage statistics for photos
   * @returns {Promise<Object>} Storage statistics
   */
  async getStorageStats() {
    try {
      const photos = await this.graphService.listPhotos()
      const totalSize = photos.reduce((sum, photo) => sum + (photo.size || 0), 0)
      
      const stats = {
        photoCount: photos.length,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        photos: photos.map(photo => ({
          name: photo.name,
          size: photo.size,
          lastModified: photo.lastModifiedDateTime
        }))
      }

      filterLogger.debug('Storage stats retrieved', stats)
      return stats
    } catch (error) {
      filterLogger.error('Failed to get storage stats', { error: error.message })
      throw error
    }
  }
}

export default PhotoService