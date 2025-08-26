import React, { createContext, useContext } from 'react'
import useToast from '../hooks/useToast'
import Toast from '../components/Toast'

const ToastContext = createContext()

export const useToastContext = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const toast = useToast()

  return (
    <ToastContext.Provider value={toast}>
      {children}
    </ToastContext.Provider>
  )
}

export const ToastRenderer = () => {
  const toast = useToastContext()
  
  return (
    <Toast 
      toasts={toast.toasts} 
      onRemoveToast={toast.removeToast} 
    />
  )
}

export default ToastProvider