import { Tag as StyledTag, TagDeleteButton } from '../styles/TodoStyles'

const Tag = ({ tag, onDelete, showDelete = true }) => {
  return (
    <StyledTag>
      {tag}
      {showDelete && (
        <TagDeleteButton 
          onClick={() => onDelete(tag)}
          title="Remove tag"
        >
          ×
        </TagDeleteButton>
      )}
    </StyledTag>
  )
}

export default Tag