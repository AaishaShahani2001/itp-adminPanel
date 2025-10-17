import CaretakerDashboard from './pages/caretaker/CaretakerDashboard.jsx';
import Login from './pages/Login.jsx';
import ManageAdoption from './pages/admin/ManageAdoption.jsx';
import CaretackerDashboard from './pages/caretaker/CaretackerDashboard.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import DoctorDashboard from './pages/doctor/DoctorDashboard.jsx';
import { Route, Routes } from 'react-router-dom';
import AddPet from './pages/caretaker/AddPet.jsx';
import ManagePet from './pages/caretaker/ManagePet.jsx';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAdminContext } from './context/AdminContext.jsx';
import Navbar from './components/Navbar.jsx';
import SideBar from './components/SideBar.jsx';
import { useCaretakerContext } from './context/CaretakerContex.jsx';
import { useDoctorContext } from './context/DoctorContext.jsx';
import Inventory from './pages/admin/Inventory.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import ManageInventory from './pages/admin/ManageInventory.jsx';
import Sales from './pages/admin/Sales.jsx';
import LowStock from './pages/admin/LowStock.jsx';
import Categories from './pages/admin/Categories.jsx';
import Suppliers from './pages/admin/Suppliers.jsx';
import AddDoctor from './pages/admin/AddDoctor.jsx';
import AddCareTaker from './pages/admin/AddCareTaker.jsx';
import ManageUser from './pages/admin/ManageUser.jsx';


const App = () => {

  const {aToken} = useAdminContext();
  const {cToken} = useCaretakerContext();
  const {dToken} = useDoctorContext();

  return aToken ? (
    <div className='bg-[#f8f9fd]'>

      <ToastContainer />

      <Navbar />

      <div className='flex items-start'>
        <SideBar />

        <Routes>
          <Route path='/' element={<></>} />
          <Route path='/login' element={<></>} />
          <Route path='/admin/dashboard' element={<AdminDashboard />} />
          <Route path='/admin/add-doctor' element={<AddDoctor />} />
          <Route path='/admin/add-caretaker' element={<AddCareTaker />} />
          <Route path='/admin/manage-user' element={<ManageUser />} />
          <Route path='/admin/manage-adoption' element={<ManageAdoption />} />
          <Route path="/admin/manage-inventory" element={<Inventory />}>

          <Route path="dashboard" element={<Dashboard />} />
            <Route path="inventory" element={<ManageInventory />} />
            <Route path="sales" element={<Sales />} />
            <Route path="low-stock" element={<LowStock />} />
            <Route path="categories" element={<Categories />} />
            <Route path="suppliers" element={<Suppliers />} />
          </Route>

        </Routes>
      </div>
    </div>
  ) : cToken ? (
    <div className='bg-[#f8f9fd]'>

      <ToastContainer />

      <Navbar />

      <div className='flex items-start'>
        <SideBar />

        <Routes>
          <Route path='/' element={<></>} />
          <Route path='/caretaker/dashboard' element={<CaretakerDashboard />} />
          <Route path="/caretaker/manage-care" element={<CaretackerDashboard />} />
          <Route path="/caretaker/add-pet" element={<AddPet />} />
          <Route path="/caretaker/manage-pet" element={<ManagePet />} />
        </Routes>
      </div>
    </div>
  ) : dToken ? (
    <div className='bg-[#f8f9fd]'>

      <ToastContainer />

      <Navbar />

      <div className='flex items-start'>
        <DoctorDashboard />
      </div>
    </div>
  ) : (
    <>
      <Login />
      <ToastContainer />
    </>
  )
}

export default App