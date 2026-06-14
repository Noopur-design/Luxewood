import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import RoomsApp from './RoomsApp.jsx'

const container = document.getElementById('rooms-app')
if (container) {
  createRoot(container).render(
    <StrictMode>
      <RoomsApp />
    </StrictMode>
  )
}
