import { createContext, useContext, useEffect, useState } from "react";
import { toast } from 'react-hot-toast';
import { useNavigate } from "react-router-dom";
import axios from 'axios'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

export const AppContext = createContext();

export const AppProvider = ({ children }) => {

    const navigate = useNavigate();
    const currency = import.meta.env.VITE_CURRENCY;

    const [token, setToken] = useState(null)
    const [user, setUser] = useState(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [showLogin, setShowLogin] = useState(false)

    const [pets, setPets] = useState([])

    //Function to fetch all pets from the server
    const fetchPets = async () => {
        try {
            const {data} = await axios.get('/api/caretaker/pets')

            data.success ? setPets(data.pets) : toast.error(data.message)
            
        } catch (error) {
            toast.error(error.message)
        }
    }

    //Function to log out the user
    const logout = () => {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
        setIsAdmin(false)
        axios.defaults.headers.common['Authorization'] = ''
        toast.success('You have been logged out')
    }

    //useEffect to retrieve the token from localStorage
    useEffect(()=>{
        const token = localStorage.getItem('token')
        setToken(token)
        fetchPets()
    }, [])

    //useEffect to fetch user data when token is available
    useEffect(()=>{
        if (token) {
            axios.defaults.headers.common['Authorization'] = `${token}`
            fetchUser()
        }
    }, [token])

    const value = {
        navigate, currency, axios, user, setUser, token, setToken, isAdmin, setIsAdmin,
        showLogin, setShowLogin, logout, fetchPets, pets, setPets
    }

    return (
        <AppContext.Provider value={value}>
            { children }
        </AppContext.Provider>
    )
}

export const useAppContext = () => {
    return useContext(AppContext)
}