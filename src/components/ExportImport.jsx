import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { ExportIcon, ImportIcon, CancelIcon } from './Icons'

const ExportImportContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  align-items: center;
  
  @media (max-width: 768px) {
    display: none;
  }
`

const ExportImportButton = styled.button`
  background: none;
  border: none;
  padding: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  height: 2.5rem;
  color: ${props => props.theme.colors.text.primary};
  border-radius: ${props => props.theme.borderRadius.sm};
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 0.7;
    background: ${props => props.theme.colors.surface};
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  @media (min-width: 768px) {
    padding: 0.625rem;
    font-size: 1.2rem;
    min-width: 3rem;
    height: 3rem;
  }
`

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: ${props => props.theme.spacing.md};
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
`

const ModalContent = styled.div`
  background: ${props => props.theme.colors.card};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  max-width: 500px;
  width: 100%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  border: 1px solid ${props => props.theme.colors.border};
`

const ModalHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.lg};
`

const ModalTitle = styled.h2`
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.lg};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text.primary};
  margin: 0;
  flex: 1;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: ${props => props.theme.colors.text.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  
  &:hover {
    background: ${props => props.theme.colors.surface};
    color: ${props => props.theme.colors.text.primary};
  }
`

const ExportOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`

const FormatOption = styled.label`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  cursor: pointer;
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  
  &:hover {
    background: ${props => props.theme.colors.surface};
  }
`

const RadioInput = styled.input`
  margin: 0;
`

const FormatDescription = styled.div`
  flex: 1;
`

const FormatTitle = styled.div`
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};
`

const FormatSubtitle = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.xs};
`

const ActionButton = styled.button`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary} 0%, ${props => props.theme.colors.primaryHover} 100%);
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 120, 212, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const HiddenFileInput = styled.input`
  display: none;
`

const ImportDropZone = styled.div`
  border: 2px dashed ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  margin: ${props => props.theme.spacing.md} 0;
  background: ${props => props.theme.colors.surface};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background: ${props => props.theme.colors.card};
  }
  
  &.drag-over {
    border-color: ${props => props.theme.colors.primary};
    background: ${props => props.theme.colors.card};
    box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.1);
  }
`

const StatusMessage = styled.div`
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  margin-top: ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  
  &.success {
    background: rgba(16, 124, 16, 0.1);
    color: ${props => props.theme.colors.success};
    border: 1px solid rgba(16, 124, 16, 0.2);
  }
  
  &.error {
    background: rgba(209, 52, 56, 0.1);
    color: ${props => props.theme.colors.error};
    border: 1px solid rgba(209, 52, 56, 0.2);
  }
`

const ExportImport = ({ todos, onImportTodos }) => {
  const [showExportModal, setShowExportModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [exportFormat, setExportFormat] = useState('json')
  const [status, setStatus] = useState({ type: '', message: '' })
  const fileInputRef = useRef(null)

  const exportFormats = {
    json: {
      title: 'JSON Format',
      subtitle: 'Complete data with all metadata',
      extension: 'json'
    },
    csv: {
      title: 'CSV Format',
      subtitle: 'Spreadsheet compatible',
      extension: 'csv'
    },
    txt: {
      title: 'Plain Text',
      subtitle: 'Simple text format',
      extension: 'txt'
    },
    md: {
      title: 'Markdown',
      subtitle: 'Formatted with checkboxes',
      extension: 'md'
    }
  }

  const generateExportData = (format) => {
    switch (format) {
      case 'json':
        return JSON.stringify({
          exportedAt: new Date().toISOString(),
          version: '1.0',
          todos: todos
        }, null, 2)

      case 'csv':
        const csvHeaders = 'Text,Tags,Priority,Completed,Created Date\n'
        const csvRows = todos.map(todo => {
          const tags = (todo.tags || []).join(';')
          const date = new Date(todo.timestamp).toLocaleDateString()
          return `"${todo.text}","${tags}",${todo.priority},${todo.completed},${date}`
        }).join('\n')
        return csvHeaders + csvRows

      case 'txt':
        return todos.map(todo => {
          const status = todo.completed ? '[✓]' : '[ ]'
          const tags = todo.tags?.length ? ` #${todo.tags.join(' #')}` : ''
          const priority = todo.priority !== 3 ? ` !${todo.priority}` : ''
          return `${status} ${todo.text}${tags}${priority}`
        }).join('\n')

      case 'md':
        const completedTodos = todos.filter(todo => todo.completed)
        const incompleteTodos = todos.filter(todo => !todo.completed)
        
        let markdown = '# Todo List\n\n'
        
        if (incompleteTodos.length > 0) {
          markdown += '## Pending\n\n'
          incompleteTodos.forEach(todo => {
            const tags = todo.tags?.length ? ` \`#${todo.tags.join(' #')}\`` : ''
            const priority = todo.priority !== 3 ? ` \`!${todo.priority}\`` : ''
            markdown += `- [ ] ${todo.text}${tags}${priority}\n`
          })
          markdown += '\n'
        }
        
        if (completedTodos.length > 0) {
          markdown += '## Completed\n\n'
          completedTodos.forEach(todo => {
            const tags = todo.tags?.length ? ` \`#${todo.tags.join(' #')}\`` : ''
            const priority = todo.priority !== 3 ? ` \`!${todo.priority}\`` : ''
            markdown += `- [x] ${todo.text}${tags}${priority}\n`
          })
        }
        
        return markdown

      default:
        return ''
    }
  }

  const handleExport = () => {
    try {
      const data = generateExportData(exportFormat)
      const blob = new Blob([data], { 
        type: exportFormat === 'json' ? 'application/json' : 'text/plain' 
      })
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `todos-${new Date().toISOString().split('T')[0]}.${exportFormats[exportFormat].extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      setStatus({ type: 'success', message: 'Export completed successfully!' })
      setTimeout(() => setShowExportModal(false), 1500)
    } catch (error) {
      setStatus({ type: 'error', message: 'Export failed: ' + error.message })
    }
  }

  const parseImportData = (content, filename) => {
    const extension = filename.split('.').pop().toLowerCase()
    
    try {
      switch (extension) {
        case 'json':
          const parsed = JSON.parse(content)
          return parsed.todos || parsed // Handle both wrapped and direct arrays
          
        case 'csv':
          const lines = content.split('\n')
          if (lines.length < 2) throw new Error('Invalid CSV format')
          
          const headers = lines[0].toLowerCase()
          return lines.slice(1)
            .filter(line => line.trim())
            .map((line, index) => {
              const values = line.match(/(".*?"|[^",]*)/g)?.map(v => v.replace(/^"|"$/g, ''))
              if (!values || values.length < 1) return null
              
              return {
                id: Date.now() + index,
                text: values[0] || '',
                tags: values[1] ? values[1].split(';').filter(Boolean) : [],
                priority: parseInt(values[2]) || 3,
                completed: values[3]?.toLowerCase() === 'true',
                timestamp: new Date().toISOString()
              }
            })
            .filter(Boolean)
            
        case 'txt':
        case 'md':
          return content.split('\n')
            .filter(line => line.trim())
            .map((line, index) => {
              // Parse markdown checkboxes or plain text
              const checkboxMatch = line.match(/^\s*-?\s*\[([x✓ ])\]\s*(.+)$/)
              const text = checkboxMatch ? checkboxMatch[2] : line.replace(/^\s*-?\s*/, '')
              const completed = checkboxMatch ? (checkboxMatch[1] === 'x' || checkboxMatch[1] === '✓') : false
              
              // Extract tags and priority
              const tagMatches = text.match(/#(\w+)/g) || []
              const tags = tagMatches.map(tag => tag.substring(1))
              
              const priorityMatch = text.match(/!([1-5])/)
              const priority = priorityMatch ? parseInt(priorityMatch[1]) : 3
              
              // Clean text
              const cleanText = text
                .replace(/#\w+/g, '')
                .replace(/!\d/g, '')
                .replace(/`/g, '')
                .trim()
              
              return {
                id: Date.now() + index,
                text: cleanText,
                tags,
                priority,
                completed,
                timestamp: new Date().toISOString()
              }
            })
            .filter(todo => todo.text)
            
        default:
          throw new Error('Unsupported file format')
      }
    } catch (error) {
      throw new Error(`Failed to parse ${extension.toUpperCase()}: ${error.message}`)
    }
  }

  const handleImport = async (file) => {
    try {
      const content = await file.text()
      const importedTodos = parseImportData(content, file.name)
      
      if (!Array.isArray(importedTodos) || importedTodos.length === 0) {
        throw new Error('No valid todos found in file')
      }
      
      onImportTodos(importedTodos)
      setStatus({ 
        type: 'success', 
        message: `Successfully imported ${importedTodos.length} todos!` 
      })
      setTimeout(() => setShowImportModal(false), 1500)
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImport(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over')
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleImport(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.currentTarget.classList.add('drag-over')
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over')
  }

  const closeModals = () => {
    setShowExportModal(false)
    setShowImportModal(false)
    setStatus({ type: '', message: '' })
  }

  return (
    <>
      <ExportImportContainer>
        <ExportImportButton 
          onClick={() => setShowExportModal(true)}
          title="Export todos"
        >
          <ExportIcon />
        </ExportImportButton>
        <ExportImportButton 
          onClick={() => setShowImportModal(true)}
          title="Import todos"
        >
          <ImportIcon />
        </ExportImportButton>
      </ExportImportContainer>

      {showExportModal && createPortal(
        <Modal onClick={closeModals}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Export Todos</ModalTitle>
              <CloseButton onClick={closeModals}>
                <CancelIcon />
              </CloseButton>
            </ModalHeader>
            
            <ExportOptions>
              {Object.entries(exportFormats).map(([key, format]) => (
                <FormatOption key={key}>
                  <RadioInput
                    type="radio"
                    name="exportFormat"
                    value={key}
                    checked={exportFormat === key}
                    onChange={(e) => setExportFormat(e.target.value)}
                  />
                  <FormatDescription>
                    <FormatTitle>{format.title}</FormatTitle>
                    <FormatSubtitle>{format.subtitle}</FormatSubtitle>
                  </FormatDescription>
                </FormatOption>
              ))}
            </ExportOptions>
            
            <ActionButton onClick={handleExport}>
              Export {todos.length} todos
            </ActionButton>
            
            {status.message && (
              <StatusMessage className={status.type}>
                {status.message}
              </StatusMessage>
            )}
          </ModalContent>
        </Modal>,
        document.body
      )}

      {showImportModal && createPortal(
        <Modal onClick={closeModals}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Import Todos</ModalTitle>
              <CloseButton onClick={closeModals}>
                <CancelIcon />
              </CloseButton>
            </ModalHeader>
            
            <ImportDropZone
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <div>
                <ImportIcon size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <div>Drop a file here or click to select</div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', opacity: 0.7 }}>
                  Supports JSON, CSV, TXT, and Markdown files
                </div>
              </div>
            </ImportDropZone>
            
            <HiddenFileInput
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,.txt,.md"
              onChange={handleFileSelect}
            />
            
            {status.message && (
              <StatusMessage className={status.type}>
                {status.message}
              </StatusMessage>
            )}
          </ModalContent>
        </Modal>,
        document.body
      )}
    </>
  )
}

export default ExportImport