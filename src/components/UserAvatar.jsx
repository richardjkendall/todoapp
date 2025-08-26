import { useState } from 'react'
import styled from 'styled-components'

const AvatarContainer = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.primary};
  border: 2px solid ${props => props.theme.colors.border};
  flex-shrink: 0;
  position: relative;
`

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
`

const AvatarInitials = styled.div`
  color: white;
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  font-family: ${props => props.theme.typography.fontFamily};
  text-transform: uppercase;
  user-select: none;
`

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const UserAvatar = ({ user, profilePhoto, isLoadingPhoto = false }) => {
  const [imageError, setImageError] = useState(false)
  
  // Generate initials from user display name
  const getInitials = (displayName) => {
    if (!displayName) return '?'
    
    const names = displayName.trim().split(' ')
    if (names.length === 1) {
      return names[0].charAt(0)
    }
    
    // Take first letter of first name and first letter of last name
    return names[0].charAt(0) + names[names.length - 1].charAt(0)
  }
  
  const handleImageError = () => {
    setImageError(true)
  }
  
  const handleImageLoad = () => {
    setImageError(false)
  }

  // Show loading spinner while fetching photo
  if (isLoadingPhoto) {
    return (
      <AvatarContainer>
        <LoadingSpinner />
      </AvatarContainer>
    )
  }
  
  // Show profile photo if available and no error
  if (profilePhoto && !imageError) {
    return (
      <AvatarContainer>
        <AvatarImage 
          src={profilePhoto} 
          alt={user?.displayName || 'User avatar'}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      </AvatarContainer>
    )
  }
  
  // Fallback to initials
  const initials = getInitials(user?.displayName || user?.name)
  
  return (
    <AvatarContainer>
      <AvatarInitials>
        {initials}
      </AvatarInitials>
    </AvatarContainer>
  )
}

export default UserAvatar