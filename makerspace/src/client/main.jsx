import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Provider } from 'react-redux'
import store from './store/reduxStore.js'
import { SnackbarProvider } from 'notistack'


ReactDOM.createRoot(document.getElementById('root')).render(
    <Provider store={store}>
        <SnackbarProvider
             anchorOrigin={{
                vertical: 'top',
                horizontal: 'center',
              }}

        >
                <App />
        </SnackbarProvider>
    </Provider>
   
)
