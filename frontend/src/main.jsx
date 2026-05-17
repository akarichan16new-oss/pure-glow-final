import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { QuizProvider } from './context/QuizContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QuizProvider>
        <App />
      </QuizProvider>
    </BrowserRouter>
  </React.StrictMode>,
)