import styled from 'styled-components'

const IconBase = styled.svg`
  width: 1em;
  height: 1em;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
`

export const EditIcon = (props) => (
  <IconBase {...props} viewBox="0 0 24 24">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </IconBase>
)

export const CheckIcon = (props) => (
  <IconBase {...props} viewBox="0 0 24 24">
    <polyline points="20,6 9,17 4,12" />
  </IconBase>
)

export const UndoIcon = (props) => (
  <IconBase {...props} viewBox="0 0 24 24">
    <path d="M3 7v6h6" />
    <path d="m21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </IconBase>
)

export const DeleteIcon = (props) => (
  <IconBase {...props} viewBox="0 0 24 24">
    <polyline points="3,6 5,6 21,6" />
    <path d="m19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </IconBase>
)

export const SaveIcon = (props) => (
  <IconBase {...props} viewBox="0 0 24 24">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17,21 17,13 7,13 7,21" />
    <polyline points="7,3 7,8 15,8" />
  </IconBase>
)

export const CancelIcon = (props) => (
  <IconBase {...props} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </IconBase>
)

export const SearchIcon = (props) => (
  <IconBase {...props} viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </IconBase>
)

export const PlusIcon = (props) => (
  <IconBase {...props} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12h8" />
    <path d="M12 8v8" />
  </IconBase>
)

export const ExportIcon = (props) => (
  <IconBase {...props} viewBox="0 0 24 24">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7,10 12,15 17,10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </IconBase>
)

export const ImportIcon = (props) => (
  <IconBase {...props} viewBox="0 0 24 24">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17,8 12,3 7,8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </IconBase>
)

export const SignInIcon = (props) => (
  <IconBase {...props} viewBox="0 0 24 24">
    <path d="m15 3 4 4-4 4" />
    <path d="M19 7h-6" />
    <rect x="3" y="3" width="12" height="18" rx="2" ry="2" />
  </IconBase>
)

export const SignOutIcon = (props) => (
  <IconBase {...props} viewBox="0 0 24 24">
    <path d="m9 21h6a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H9" />
    <polyline points="16,17 21,12 16,7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </IconBase>
)

export const WarningIcon = (props) => (
  <IconBase {...props} viewBox="0 0 24 24">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </IconBase>
)

export const InfoIcon = (props) => (
  <IconBase {...props} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </IconBase>
)

export const CloudIcon = (props) => (
  <IconBase {...props} viewBox="0 0 24 24">
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
  </IconBase>
)

export const GitHubIcon = (props) => (
  <IconBase {...props} viewBox="0 0 24 24">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </IconBase>
)