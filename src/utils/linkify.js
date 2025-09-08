/**
 * URL detection and linkification utilities
 */

// Comprehensive URL regex that matches various URL patterns
const URL_REGEX = /((?:https?:\/\/|www\.)[^\s<>[\]{}`'"]*[^\s<>[\]{}`'".,;:!?])/gi

// Markdown image regex that matches ![alt text](src) format
const IMAGE_REGEX = /!\[([^\]]*)\]\(([^\)]+)\)/gi

/**
 * Check if text contains URLs
 * @param {string} text - Text to check
 * @returns {boolean} True if text contains URLs
 */
export function containsUrls(text) {
  if (!text || typeof text !== 'string') return false
  return URL_REGEX.test(text)
}

/**
 * Check if text contains markdown images
 * @param {string} text - Text to check
 * @returns {boolean} True if text contains markdown images
 */
export function containsImages(text) {
  if (!text || typeof text !== 'string') return false
  return IMAGE_REGEX.test(text)
}

/**
 * Check if text contains URLs or images
 * @param {string} text - Text to check
 * @returns {boolean} True if text contains URLs or images
 */
export function containsMediaContent(text) {
  return containsUrls(text) || containsImages(text)
}

/**
 * Extract all URLs from text
 * @param {string} text - Text to extract URLs from
 * @returns {Array<string>} Array of found URLs
 */
export function extractUrls(text) {
  if (!text || typeof text !== 'string') return []
  const matches = text.match(URL_REGEX)
  return matches ? matches.map(url => normalizeUrl(url)) : []
}

/**
 * Extract all image references from text
 * @param {string} text - Text to extract images from
 * @returns {Array<{alt: string, src: string}>} Array of found images
 */
export function extractImages(text) {
  if (!text || typeof text !== 'string') return []
  const matches = []
  
  IMAGE_REGEX.lastIndex = 0
  let match
  while ((match = IMAGE_REGEX.exec(text)) !== null) {
    matches.push({
      alt: match[1] || 'Image',
      src: match[2]
    })
  }
  
  return matches
}

/**
 * Normalize URL by adding protocol if missing
 * @param {string} url - URL to normalize
 * @returns {string} Normalized URL with protocol
 */
function normalizeUrl(url) {
  if (!url) return ''
  
  // Add protocol if missing
  if (!url.match(/^https?:\/\//i)) {
    return 'https://' + url
  }
  
  return url
}

/**
 * Split text into segments, separating URLs and images from regular text
 * @param {string} text - Text to split
 * @returns {Array<{type: 'text'|'url'|'image', content: string, href?: string, alt?: string, src?: string}>} Array of text segments
 */
export function splitTextWithUrls(text) {
  if (!text || typeof text !== 'string') {
    return [{ type: 'text', content: '' }]
  }

  const segments = []
  let lastIndex = 0
  
  // Combine all matches (URLs and images) and sort by position
  const allMatches = []
  
  // Find all URL matches
  URL_REGEX.lastIndex = 0
  let urlMatch
  while ((urlMatch = URL_REGEX.exec(text)) !== null) {
    allMatches.push({
      type: 'url',
      match: urlMatch,
      start: urlMatch.index,
      end: urlMatch.index + urlMatch[0].length
    })
  }
  
  // Find all image matches
  IMAGE_REGEX.lastIndex = 0
  let imageMatch
  while ((imageMatch = IMAGE_REGEX.exec(text)) !== null) {
    allMatches.push({
      type: 'image',
      match: imageMatch,
      start: imageMatch.index,
      end: imageMatch.index + imageMatch[0].length
    })
  }
  
  // Sort matches by start position
  allMatches.sort((a, b) => a.start - b.start)
  
  // Process matches in order
  for (const matchInfo of allMatches) {
    const { type, match, start, end } = matchInfo
    
    // Add text before match if any
    if (start > lastIndex) {
      const beforeText = text.slice(lastIndex, start)
      if (beforeText) {
        segments.push({ type: 'text', content: beforeText })
      }
    }
    
    if (type === 'url') {
      // Add URL segment
      const url = match[0]
      segments.push({
        type: 'url',
        content: url,
        href: normalizeUrl(url)
      })
    } else if (type === 'image') {
      // Add image segment
      const [fullMatch, alt, src] = match
      segments.push({
        type: 'image',
        content: fullMatch,
        alt: alt || 'Image',
        src: src
      })
    }
    
    lastIndex = end
  }
  
  // Add remaining text after last match
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex)
    if (remainingText) {
      segments.push({ type: 'text', content: remainingText })
    }
  }
  
  // If no matches found, return the original text
  if (segments.length === 0) {
    segments.push({ type: 'text', content: text })
  }
  
  return segments
}

/**
 * Legacy function name for backward compatibility
 * @param {string} text - Text to split
 * @returns {Array} Array of text segments
 */
export function splitTextWithMedia(text) {
  return splitTextWithUrls(text)
}