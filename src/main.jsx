import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { SnackbarProvider } from "notistack";
import { AppProvider } from './context/AppContext.jsx'
import { AdminProvider } from './context/AdminContext.jsx'
import { CaretakerProvider } from './context/CaretakerContex.jsx'
import { DoctorProvider } from './context/DoctorContext.jsx'


createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <AppProvider>
  <AdminProvider>
  <CaretakerProvider>
    <DoctorProvider>
    <SnackbarProvider
      maxSnack={4}
      autoHideDuration={5000}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      preventDuplicate>
      <App />
    </SnackbarProvider>
    </DoctorProvider>
    </CaretakerProvider>
    </AdminProvider>
    </AppProvider>
  </BrowserRouter>,
)
