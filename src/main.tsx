import React from 'react'
import ReactDOM from 'react-dom/client'
import './assets/scss/global.scss'
import MainRoute from './routes/MainRoute.tsx'

import "bootstrap/dist/css/bootstrap.min.css"

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainRoute />
  </React.StrictMode>,
)
