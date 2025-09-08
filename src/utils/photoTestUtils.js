/**
 * Photo Upload Test Utilities
 * Helper functions to test photo upload functionality
 */

import { filterLogger } from './logger'

/**
 * Create a test image blob from canvas
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} text - Text to draw on image
 * @returns {Promise<Blob>} Test image blob
 */
export async function createTestImageBlob(width = 400, height = 300, text = 'Test Photo') {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  
  const ctx = canvas.getContext('2d')
  
  // Fill background
  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(0, 0, width, height)
  
  // Draw border
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, width - 2, height - 2)
  
  // Draw text
  ctx.fillStyle = '#333'
  ctx.font = '24px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, width / 2, height / 2)
  
  // Add timestamp
  ctx.font = '12px Arial'
  ctx.fillText(new Date().toLocaleString(), width / 2, height / 2 + 40)
  
  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Failed to create test image blob'))
      }
    }, 'image/jpeg', 0.8)
  })
}

/**
 * Test photo service upload functionality
 * @param {PhotoService} photoService - PhotoService instance
 * @returns {Promise<Object>} Test results
 */
export async function testPhotoUpload(photoService) {
  const testResults = {
    success: false,
    error: null,
    uploadResult: null,
    downloadUrl: null,
    cleanup: false
  }

  try {
    filterLogger.info('Starting photo upload test')

    // Create test image
    const testBlob = await createTestImageBlob(400, 300, 'Upload Test')
    filterLogger.debug('Test image created', { size: testBlob.size })

    // Upload photo
    const uploadResult = await photoService.uploadPhoto(testBlob, 'Test Upload')
    testResults.uploadResult = uploadResult
    filterLogger.info('Photo upload test successful', { 
      fileName: uploadResult.fileName,
      markdown: uploadResult.markdown
    })

    // Verify download URL works
    if (uploadResult.downloadUrl) {
      testResults.downloadUrl = uploadResult.downloadUrl
      filterLogger.debug('Download URL available', { url: !!uploadResult.downloadUrl })
    }

    // Test photo info retrieval
    const photoInfo = await photoService.getPhotoInfo(uploadResult.fileName)
    if (photoInfo) {
      filterLogger.debug('Photo info retrieved', { 
        fileName: photoInfo.fileName,
        size: photoInfo.size
      })
    }

    // Cleanup test photo
    const cleanupSuccess = await photoService.deletePhoto(uploadResult.fileName)
    testResults.cleanup = cleanupSuccess
    
    if (cleanupSuccess) {
      filterLogger.info('Test photo cleaned up successfully')
    } else {
      filterLogger.warn('Failed to cleanup test photo', { 
        fileName: uploadResult.fileName 
      })
    }

    testResults.success = true
    
  } catch (error) {
    testResults.error = error.message
    filterLogger.error('Photo upload test failed', { error: error.message })
  }

  return testResults
}

/**
 * Test photo markdown parsing
 * @param {PhotoService} photoService - PhotoService instance
 * @returns {Object} Test results
 */
export function testPhotoMarkdownParsing(photoService) {
  const testCases = [
    {
      input: 'Simple todo with no photos',
      expected: 0
    },
    {
      input: 'Todo with one photo ![Photo](onedrive:photos/photo_123_abc.jpg) here',
      expected: 1
    },
    {
      input: 'Multiple photos: ![Photo1](onedrive:photos/photo_123_abc.jpg) and ![Photo2](onedrive:photos/photo_456_def.jpg)',
      expected: 2
    },
    {
      input: 'Mixed content with URL https://example.com and photo ![Screenshot](onedrive:photos/photo_789_ghi.jpg)',
      expected: 1
    },
    {
      input: 'No OneDrive photos ![External](https://example.com/image.jpg) should not match',
      expected: 0
    }
  ]

  const results = testCases.map((testCase, index) => {
    const photoRefs = photoService.extractPhotoRefs(testCase.input)
    const success = photoRefs.length === testCase.expected
    
    return {
      testCase: index + 1,
      input: testCase.input,
      expected: testCase.expected,
      actual: photoRefs.length,
      success,
      photos: photoRefs.map(ref => ref.fileName)
    }
  })

  const allPassed = results.every(result => result.success)
  
  filterLogger.info('Photo markdown parsing test completed', {
    totalTests: results.length,
    passed: results.filter(r => r.success).length,
    allPassed
  })

  return {
    allPassed,
    results
  }
}

/**
 * Run all photo service tests
 * @param {PhotoService} photoService - PhotoService instance
 * @returns {Promise<Object>} Complete test results
 */
export async function runPhotoServiceTests(photoService) {
  if (!photoService) {
    return {
      success: false,
      error: 'PhotoService not available (user may not be authenticated)'
    }
  }

  const testResults = {
    success: false,
    uploadTest: null,
    parsingTest: null,
    error: null
  }

  try {
    filterLogger.info('Running complete photo service test suite')

    // Test markdown parsing (no network required)
    testResults.parsingTest = testPhotoMarkdownParsing(photoService)

    // Test upload functionality (requires network)
    testResults.uploadTest = await testPhotoUpload(photoService)

    testResults.success = testResults.parsingTest.allPassed && testResults.uploadTest.success

    filterLogger.info('Photo service test suite completed', {
      success: testResults.success,
      parsingPassed: testResults.parsingTest.allPassed,
      uploadPassed: testResults.uploadTest.success
    })

  } catch (error) {
    testResults.error = error.message
    filterLogger.error('Photo service test suite failed', { error: error.message })
  }

  return testResults
}