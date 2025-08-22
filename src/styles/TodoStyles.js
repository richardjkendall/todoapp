import styled, { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    background-color: #ffffff;
    color: #333;
    line-height: 1.5;
  }
  
  #root {
    min-height: 100vh;
  }
`

export const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  
  @media (min-width: 768px) {
    padding: 2rem;
  }
  
  @media (min-width: 1024px) {
    padding: 3rem;
  }
`

export const Title = styled.h1`
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
  font-size: 2rem;
  
  @media (min-width: 768px) {
    font-size: 3rem;
    margin-bottom: 3rem;
  }
`

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (min-width: 768px) {
    flex-direction: row;
    gap: 1.5rem;
    margin-bottom: 3rem;
  }
`

export const FormRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
  
  @media (min-width: 768px) {
    flex-direction: row;
    align-items: flex-start;
  }
`

export const Select = styled.select`
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
  
  @media (min-width: 768px) {
    padding: 1rem;
    font-size: 1.1rem;
    min-width: 150px;
  }
`

export const EditRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  
  @media (min-width: 768px) {
    gap: 1rem;
  }
`

export const EditSelect = styled.select`
  padding: 0.5rem;
  border: 2px solid #007bff;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
  min-width: 140px;
  flex-shrink: 0;
  
  &:focus {
    outline: none;
    border-color: #0056b3;
  }
  
  @media (min-width: 768px) {
    font-size: 1.1rem;
    min-width: 160px;
  }
`

export const Input = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
  
  @media (min-width: 768px) {
    padding: 1rem;
    font-size: 1.1rem;
  }
`

export const Textarea = styled.textarea`
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  resize: none;
  min-height: auto;
  overflow: hidden;
  line-height: 1.25;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
  
  @media (min-width: 768px) {
    padding: 1rem;
    font-size: 1.1rem;
  }
`

export const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  align-self: flex-start;
  height: fit-content;
  
  &:hover {
    background-color: #0056b3;
  }
  
  @media (min-width: 768px) {
    padding: 1rem 2rem;
    font-size: 1.1rem;
    min-width: 150px;
  }
`

export const TodoList = styled.ul`
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  @media (min-width: 768px) {
    gap: 1rem;
  }
`

export const TodoItem = styled.li`
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  border-left: 4px solid ${props => props.priorityColor || '#007bff'};
  font-size: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  cursor: ${props => props.isDragging ? 'grabbing' : 'grab'};
  opacity: ${props => props.isDragging ? 0.5 : 1};
  transform: ${props => props.isDragging ? 'rotate(2deg)' : 'none'};
  transition: opacity 0.2s, transform 0.2s;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: 0;
    right: 0;
    height: 2px;
    background-color: ${props => props.showDropIndicator ? '#007bff' : 'transparent'};
    transition: background-color 0.2s;
  }
  
  &.drag-over-invalid {
    background-color: #f8d7da;
    cursor: not-allowed;
  }
  
  @media (min-width: 768px) {
    padding: 1.5rem;
    font-size: 1.1rem;
  }
`

export const TodoNumber = styled.div`
  color: #6c757d;
  font-weight: 600;
  font-size: 0.875rem;
  min-width: 1.5rem;
  padding-top: 0.125rem;
  text-align: center;
  
  @media (min-width: 768px) {
    font-size: 1rem;
    min-width: 2rem;
  }
`

export const TodoLeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 1.5rem;
  
  @media (min-width: 768px) {
    min-width: 2rem;
  }
`

export const TodoContent = styled.div`
  flex: 1;
`

export const TodoHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
  
  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`

export const TodoTimestamp = styled.span`
  color: #6c757d;
`

export const PriorityIndicator = styled.div`
  color: ${props => props.priorityColor || '#007bff'};
  font-weight: 600;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  text-align: center;
  
  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`

export const TodoText = styled.div`
  margin-bottom: ${props => props.hasTags ? '0.5rem' : '0'};
  text-decoration: ${props => props.completed ? 'line-through' : 'none'};
  color: ${props => props.completed ? '#6c757d' : 'inherit'};
  white-space: pre-wrap;
  word-wrap: break-word;
`

export const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`

export const Tag = styled.span`
  background-color: #007bff;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  
  @media (min-width: 768px) {
    font-size: 0.875rem;
    padding: 0.375rem 0.75rem;
  }
`

export const TagDeleteButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  font-size: 0.875rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    opacity: 0.8;
  }
`

export const CompleteButton = styled.button`
  background: none;
  border: none;
  padding: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  height: 2.5rem;
  
  &:hover {
    opacity: 0.7;
  }
  
  @media (min-width: 768px) {
    padding: 0.625rem;
    font-size: 1.2rem;
    min-width: 3rem;
    height: 3rem;
  }
`

export const EditInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 2px solid #007bff;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #0056b3;
  }
  
  @media (min-width: 768px) {
    font-size: 1.1rem;
  }
`

export const EditTextarea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 2px solid #007bff;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  resize: none;
  min-height: auto;
  overflow: hidden;
  line-height: 1.25;
  
  &:focus {
    outline: none;
    border-color: #0056b3;
  }
  
  @media (min-width: 768px) {
    font-size: 1.1rem;
  }
`

export const TodoActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
  align-self: flex-start;
  padding-top: 0.125rem;
`

export const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
`

export const EditButton = styled.button`
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
  
  &:hover {
    opacity: 0.7;
  }
  
  @media (min-width: 768px) {
    padding: 0.625rem;
    font-size: 1.2rem;
    min-width: 3rem;
    height: 3rem;
  }
`

export const CancelButton = styled.button`
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
  
  &:hover {
    opacity: 0.7;
  }
  
  @media (min-width: 768px) {
    padding: 0.625rem;
    font-size: 1.2rem;
    min-width: 3rem;
    height: 3rem;
  }
`

export const DeleteButton = styled.button`
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
  
  &:hover {
    opacity: 0.7;
  }
  
  @media (min-width: 768px) {
    padding: 0.625rem;
    font-size: 1.2rem;
    min-width: 3rem;
    height: 3rem;
  }
`