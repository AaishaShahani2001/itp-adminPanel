import React from 'react'
import { useAdminContext } from '../context/AdminContext'
import { useCaretakerContext } from '../context/CaretakerContex';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { useDoctorContext } from '../context/DoctorContext';

const Navbar = () => {

    const {aToken, setAToken} = useAdminContext();
    const {cToken, setCToken} = useCaretakerContext();
    const {dToken, setDToken} = useDoctorContext();

    const navigate = useNavigate()

    const logout = () => {
        navigate('/')

        if (aToken) {
            aToken && setAToken('')
            aToken && localStorage.removeItem('aToken')
        }

        else if (cToken) {
            cToken && setCToken('')
            cToken && localStorage.removeItem('cToken')
        }

        else {
            dToken && setDToken('')
            dToken && localStorage.removeItem('dToken')
        }
    }

  return (
    <div className='flex justify-between items-center px-4 sm:px-10 py-3 border-b bg-white'>
        <div className='flex items-center gap-2 text-xs'>
            <div className='flex'>
                <img src={assets.logo} alt="" className='w-10 ml-3 mr-2' />
                <p className='font-semibold text-4xl md:text-[30px]'>PetPulse</p>
            </div>
            <p className='border px-2.5 py-0.5 rounded-full border-gray-500 text-gray-600'>{aToken ? 'Admin' : cToken ? 'Caretaker' : 'Doctor'}</p>
        </div>
        <button onClick={logout} className='bg-red-500 text-white text-sm px-10 py-2 rounded-full'>Logout</button>
    </div>
  )
}

export default Navbar;