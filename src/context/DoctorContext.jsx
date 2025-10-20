import { createContext, useContext } from "react";
import axios from 'axios'
import { useState } from "react";

axios.defaults.baseURL = "https://itp-backend-waw1.onrender.com";

export const DoctorContext = createContext();

export const DoctorProvider = ({ children }) => {

    const [dToken, setDToken] = useState(localStorage.getItem('dToken') ? localStorage.getItem('dToken') : '')

    const backendUrl = "https://itp-backend-waw1.onrender.com"

    const value = {
        dToken, setDToken, backendUrl
    }

    return (
        <DoctorContext.Provider value={value}>
            { children }
        </DoctorContext.Provider>
    )
}

export const useDoctorContext = () => {
    return useContext(DoctorContext)
}