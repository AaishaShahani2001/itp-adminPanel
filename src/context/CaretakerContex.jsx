import { createContext, useContext } from "react";
import axios from 'axios'
import { useState } from "react";

axios.defaults.baseURL = "https://itp-backend-waw1.onrender.com";

export const CaretakerContext = createContext();

export const CaretakerProvider = ({ children }) => {

    const [cToken, setCToken] = useState(localStorage.getItem('cToken') ? localStorage.getItem('cToken') : '')

    const backendUrl = import.meta.env.VITE_BASE_URL

    const value = {
        cToken, setCToken, backendUrl
    }

    return (
        <CaretakerContext.Provider value={value}>
            { children }
        </CaretakerContext.Provider>
    )
}

export const useCaretakerContext = () => {
    return useContext(CaretakerContext)
}
