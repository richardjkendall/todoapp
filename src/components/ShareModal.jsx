import styled from 'styled-components'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CopyIcon, CancelIcon, ShareIcon, EmailIcon, QRIcon } from './Icons'
import { generateShareUrl, validateTodoForSharing } from '../utils/todoSharing'
import { useAuth } from '../context/AuthContext'
import QRCode from 'qrcode'

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: ${props => props.theme.spacing.md};
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
`

const ModalContainer = styled.div`
  background: ${props => props.theme.colors.card};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  
  @media (max-width: 767px) {
    padding: ${props => props.theme.spacing.lg};
    margin: ${props => props.theme.spacing.md};
  }
`

const ModalTitle = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
  text-align: center;
`

const TodoPreview = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-left: 4px solid ${props => props.theme.colors.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
`


const ShareMethods = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.lg};
  
  @media (max-width: 767px) {
    grid-template-columns: 1fr;
  }
`

const ShareMethod = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  color: ${props => props.theme.colors.text.secondary};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.sm};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.primary}10;
    border-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.primary};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const ShareMethodIcon = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  background: transparent;
  color: ${props => props.theme.colors.text.secondary};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.base};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  
  &:hover {
    background: ${props => props.theme.colors.surface};
    color: ${props => props.theme.colors.text.primary};
  }
`

const QRModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: ${props => props.theme.spacing.md};
`

const QRModalContainer = styled.div`
  background: ${props => props.theme.colors.card};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  max-width: 400px;
  width: 100%;
  text-align: center;
`

const QRModalTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.lg};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
`

const QRCodeContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${props => props.theme.spacing.lg};
  
  canvas {
    border-radius: ${props => props.theme.borderRadius.md};
  }
`

const QRInstructions = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  margin-bottom: ${props => props.theme.spacing.lg};
  line-height: ${props => props.theme.typography.lineHeight.normal};
`


const StatusMessage = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
  
  ${props => props.type === 'success' && `
    background: ${props.theme.colors.success}20;
    color: ${props.theme.colors.success};
    border: 1px solid ${props.theme.colors.success}40;
  `}
  
  ${props => props.type === 'error' && `
    background: ${props.theme.colors.danger}20;
    color: ${props.theme.colors.danger};
    border: 1px solid ${props.theme.colors.danger}40;
  `}
`

const ShareModal = ({ todo, onClose }) => {
  const { user, isAuthenticated } = useAuth()
  const [shareUrl, setShareUrl] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [statusType, setStatusType] = useState('')
  const [canNativeShare, setCanNativeShare] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const qrCanvasRef = useRef(null)

  useEffect(() => {
    if (!todo) return

    // Validate todo for sharing
    const validation = validateTodoForSharing(todo)
    if (!validation.valid) {
      setStatusMessage(validation.error)
      setStatusType('error')
      return
    }

    // Generate share URL with user information if authenticated
    try {
      const shareOptions = {}
      if (isAuthenticated && user && user.name) {
        shareOptions.userName = user.name
      }
      const url = generateShareUrl(todo, shareOptions)
      setShareUrl(url)
    } catch (error) {
      console.error('Share URL generation error:', error)
      setStatusMessage('Failed to create share link')
      setStatusType('error')
    }

    // Check if native sharing is available
    setCanNativeShare(!!navigator.share)
  }, [todo, isAuthenticated, user])

  const showStatus = (message, type = 'success') => {
    setStatusMessage(message)
    setStatusType(type)
    setTimeout(() => {
      setStatusMessage('')
      setStatusType('')
    }, 3000)
  }

  const handleCopyUrl = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl)
        showStatus('Link copied to clipboard!')
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = shareUrl
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        showStatus('Link copied to clipboard!')
      }
    } catch (error) {
      showStatus('Failed to copy link', 'error')
    }
  }

  const handleNativeShare = async () => {
    if (!navigator.share) {
      showStatus('Native sharing not supported', 'error')
      return
    }

    try {
      const shareData = {
        title: 'Shared Todo from LongList',
        text: `Check out this todo: "${todo.text}"`,
        url: shareUrl
      }

      // Check if the data can be shared (only if canShare is available)
      if (navigator.canShare) {
        try {
          if (!navigator.canShare(shareData)) {
            showStatus('This content cannot be shared', 'error')
            return
          }
        } catch {
          // Ignore canShare errors and proceed with share attempt
        }
      }

      await navigator.share(shareData)
      showStatus('Shared successfully!')
    } catch (err) {
      if (err.name !== 'AbortError') {
        showStatus('Failed to share', 'error')
      }
    }
  }

  const handleEmailShare = () => {
    const subject = encodeURIComponent('Shared Todo from LongList')
    const body = encodeURIComponent(`Check out this todo: "${todo.text}"\n\n${shareUrl}`)
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`
    
    try {
      window.open(mailtoUrl, '_blank')
      showStatus('Email client opened!')
    } catch {
      showStatus('Failed to open email client', 'error')
    }
  }

  const handleQRShare = async () => {
    setShowQRModal(true)
  }

  // Generate QR code when modal is shown and ref is available
  useEffect(() => {
    if (showQRModal && qrCanvasRef.current && shareUrl) {
      const generateQR = async () => {
        try {
          await QRCode.toCanvas(qrCanvasRef.current, shareUrl, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          })
        } catch (err) {
          console.error('QR code generation failed:', err)
          showStatus('Failed to generate QR code', 'error')
          setShowQRModal(false)
        }
      }
      
      // Small delay to ensure canvas is rendered
      setTimeout(generateQR, 50)
    }
  }, [showQRModal, shareUrl])

  const handleCloseQRModal = () => {
    setShowQRModal(false)
  }

  if (!todo) return null

  return createPortal(
    <>
      <ModalOverlay onClick={onClose}>
        <ModalContainer onClick={e => e.stopPropagation()}>
          <ModalTitle>Share Todo</ModalTitle>
          
          <TodoPreview>
            Sharing: "{todo.text}"
          </TodoPreview>

          {statusMessage && (
            <StatusMessage type={statusType}>
              {statusMessage}
            </StatusMessage>
          )}

          {shareUrl && (
            <ShareMethods>
                {canNativeShare && (
                  <ShareMethod onClick={handleNativeShare}>
                    <ShareMethodIcon>
                      <ShareIcon />
                    </ShareMethodIcon>
                    Share
                  </ShareMethod>
                )}
                
                <ShareMethod onClick={handleCopyUrl}>
                  <ShareMethodIcon>
                    <CopyIcon />
                  </ShareMethodIcon>
                  Copy Link
                </ShareMethod>
                
                <ShareMethod onClick={handleEmailShare}>
                  <ShareMethodIcon>
                    <EmailIcon />
                  </ShareMethodIcon>
                  Email
                </ShareMethod>
                
                <ShareMethod onClick={handleQRShare}>
                  <ShareMethodIcon>
                    <QRIcon />
                  </ShareMethodIcon>
                  QR Code
                </ShareMethod>
              </ShareMethods>
          )}

          <CloseButton onClick={onClose}>
            <CancelIcon />
            Close
          </CloseButton>
        </ModalContainer>
      </ModalOverlay>
      
      {/* QR Code Modal */}
      {showQRModal && (
        <QRModalOverlay onClick={handleCloseQRModal}>
          <QRModalContainer onClick={e => e.stopPropagation()}>
            <QRModalTitle>Scan QR Code</QRModalTitle>
            <QRCodeContainer>
              <canvas ref={qrCanvasRef} />
            </QRCodeContainer>
            <QRInstructions>
              Scan this QR code with your phone's camera to open the shared todo
            </QRInstructions>
            <CloseButton onClick={handleCloseQRModal}>
              <CancelIcon />
              Close
            </CloseButton>
          </QRModalContainer>
        </QRModalOverlay>
      )}
    </>,
    document.body
  )
}

export default ShareModal