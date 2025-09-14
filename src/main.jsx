import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const RootWrapper = import.meta.env.PROD ? React.StrictMode : React.Fragment

ReactDOM.createRoot(document.getElementById('root')).render(
  <RootWrapper>
    <App />
  </RootWrapper>
)
