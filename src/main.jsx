// src/main.jsx (소문자 m)
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // App.jsx를 불러옴
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)