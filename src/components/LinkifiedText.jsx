import React from 'react'
import styled from 'styled-components'
import { splitTextWithUrls } from '../utils/linkify'
import TodoImage from './TodoImage'

const StyledLink = styled.a`
  color: ${props => props.completed 
    ? props.theme.colors.text.tertiary 
    : props.theme.colors.primary};
  text-decoration: underline;
  text-decoration-color: ${props => props.completed 
    ? props.theme.colors.text.tertiary + '60'
    : props.theme.colors.primary + '40'};
  transition: all 0.2s ease;
  
  &:hover {
    color: ${props => props.completed 
      ? props.theme.colors.text.secondary
      : (props.theme.colors.primaryHover || props.theme.colors.primary)};
    text-decoration-color: ${props => props.completed 
      ? props.theme.colors.text.secondary
      : (props.theme.colors.primaryHover || props.theme.colors.primary)};
  }
  
  &:visited {
    color: ${props => props.completed 
      ? props.theme.colors.text.tertiary + 'AA'
      : props.theme.colors.primary + 'CC'};
  }
  
  /* Prevent long URLs from breaking layout */
  word-break: break-all;
  
  /* Subtle indication that this is clickable */
  &:active {
    transform: scale(0.98);
  }
  
  @media (max-width: 767px) {
    /* More prominent touch target on mobile */
    padding: 2px 0;
    margin: -2px 0;
  }
`

const LinkifiedText = ({ children, completed, ...props }) => {
  const text = children || ''
  const segments = splitTextWithUrls(text)
  
  return (
    <span {...props}>
      {segments.map((segment, index) => {
        if (segment.type === 'url') {
          return (
            <StyledLink
              key={index}
              href={segment.href}
              target="_blank"
              rel="noopener noreferrer"
              completed={completed}
              onClick={(e) => {
                // Stop propagation to prevent todo item interactions
                e.stopPropagation()
              }}
              title={`Open ${segment.href} in new tab`}
            >
              {segment.content}
            </StyledLink>
          )
        } else if (segment.type === 'image') {
          return (
            <TodoImage
              key={index}
              src={segment.src}
              alt={segment.alt}
              completed={completed}
            />
          )
        } else {
          return <span key={index}>{segment.content}</span>
        }
      })}
    </span>
  )
}

export default LinkifiedText