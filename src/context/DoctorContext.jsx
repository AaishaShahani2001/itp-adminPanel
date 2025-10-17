import { createContext, useContext } from "react";
import axios from 'axios'
import { useState } from "react";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

export const DoctorContext = createContext();

export const DoctorProvider = ({ children }) => {

    const [dToken, setDToken] = useState(localStorage.getItem('dToken') ? localStorage.getItem('dToken') : '')

    const backendUrl = import.meta.env.VITE_BASE_URL

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