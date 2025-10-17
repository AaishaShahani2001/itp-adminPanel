import React, { useState,  useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminContext } from "../context/AdminContext";
import axios from 'axios'
import { toast } from "react-toastify";
import { useCaretakerContext } from "../context/CaretakerContex";
import { useDoctorContext } from "../context/DoctorContext";

const Login = () => {
  const navigate = useNavigate();

  const [state, setState] = useState("Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const {setAToken, backendUrl} = useAdminContext();
  const {setCToken} = useCaretakerContext();
  const {setDToken} = useDoctorContext();

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    try {
      if (state === 'Admin') {
        const {data} = await axios.post(backendUrl + '/api/admin/login', {email, password})

        if (data.success) {
          localStorage.setItem('aToken', data.token)
          setAToken(data.token)
          navigate('/admin/dashboard')
        }

        else {
          toast.error(data.message)
        }
      }

      else if (state === 'Caretaker') {
        const {data} = await axios.post(backendUrl + '/api/caretaker/login', {email, password})

        if (data.success) {
          localStorage.setItem('cToken', data.token)
          setCToken(data.token)
          navigate('/caretaker/dashboard')
        }

        else {
          toast.error(data.message)
        }
      }

      else {
        const {data} = await axios.post(backendUrl + '/api/doctor/login', {email, password})

        if (data.success) {
          localStorage.setItem('dToken', data.token)
          setDToken(data.token)
          navigate('/doctor/dashboard')
        }

        else {
          toast.error(data.message)
        }
      }
      
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className="min-h-[100vh] flex items-center bg-green-100/80 backdrop-blur-md">
  <div className="flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border border-green-200 rounded-xl text-[#5E5E5E] text-sm shadow-lg bg-white/70 backdrop-blur-sm">
        <p className="text-2xl font-semibold m-auto">
          <span className="text-primary">{state}</span> Login
        </p>

        <div className="w-full">
          <p>Email</p>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            className="border border-[#DADADA] rounded w-full p-2 mt-1"
            type="email"
            required
          />
        </div>

        <div className="w-full">
          <p>Password</p>
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            className="border border-[#DADADA] rounded w-full p-2 mt-1"
            type="password"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-primary text-white w-full py-2 rounded-md text-base"
        >
          Login
        </button>

        {/* Switch between roles */}
        {state !== "Admin" && (
          <p>
            Admin Login?{" "}
            <span
              className="text-primary underline cursor-pointer"
              onClick={() => setState("Admin")}
            >
              Click here
            </span>
          </p>
        )}

        {state !== "Doctor" && (
          <p>
            Doctor Login?{" "}
            <span
              className="text-primary underline cursor-pointer"
              onClick={() => setState("Doctor")}
            >
              Click here
            </span>
          </p>
        )}

        {state !== "Caretaker" && (
          <p>
            Caretaker Login?{" "}
            <span
              className="text-primary underline cursor-pointer"
              onClick={() => setState("Caretaker")}
            >
              Click here
            </span>
          </p>
        )}
      </div>
    </form>
  );
};

export default Login;