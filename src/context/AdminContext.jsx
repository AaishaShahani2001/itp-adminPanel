import { createContext, useContext } from "react";
import axios from 'axios'
import { useState } from "react";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

export const AdminContext = createContext();

export const AdminProvider = ({ children }) => {

    const [aToken, setAToken] = useState(localStorage.getItem('aToken') ? localStorage.getItem('aToken') : '')

    const backendUrl = import.meta.env.VITE_BASE_URL

    const value = {
        aToken, setAToken, backendUrl
    }

    return (
        <AdminContext.Provider value={value}>
            { children }
        </AdminContext.Provider>
    )
}

export const useAdminContext = () => {
    return useContext(AdminContext)
}