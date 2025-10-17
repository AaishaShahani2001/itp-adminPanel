import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAdminContext } from "../../context/AdminContext";

const AddDoctor = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    speciality: "",
    degree: "",
    experience: "",
    about: "",
    address: "",
  });

   const {aToken} = useAdminContext()

  const [image, setImage] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });
      data.append("image", image);

      const res = await axios.post("http://localhost:3000/api/admin/add-doctor", data, {
        headers: { atoken: aToken},
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setFormData({
          name: "",
          email: "",
          password: "",
          speciality: "",
          degree: "",
          experience: "",
          about: "",
          address: "",
        });
        setImage(null);
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong!");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-full bg-gradient-to-r from-green-50 via-white to-green-100">
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-2xl p-10">
        <h2 className="text-3xl font-extrabold text-green-700 mb-6 text-center">
          Add Doctor
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className="p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              className="p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              name="speciality"
              placeholder="Speciality"
              value={formData.speciality}
              onChange={handleChange}
              className="p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            <input
              type="text"
              name="degree"
              placeholder="Degree"
              value={formData.degree}
              onChange={handleChange}
              className="p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              name="experience"
              placeholder="Experience (Years)"
              value={formData.experience}
              onChange={handleChange}
              className="p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <textarea
              name="about"
              placeholder="About Doctor"
              value={formData.about}
              onChange={handleChange}
              className="p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 h-24"
            ></textarea>
            <textarea
              name="address"
              placeholder="Clinic Address"
              value={formData.address}
              onChange={handleChange}
              className="p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 h-24"
            ></textarea>
          </div>

          {/* Full width for image upload */}
          <div className="col-span-2 flex flex-col items-center gap-3 mt-3">
            <label className="w-full cursor-pointer bg-green-100 border border-green-600 text-green-700 rounded-lg p-3 text-center hover:bg-green-200">
              Upload Doctor Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
            {image && (
              <img
                src={URL.createObjectURL(image)}
                alt="preview"
                className="w-28 h-28 object-cover rounded-full shadow-md"
              />
            )}
          </div>

          {/* Submit button */}
          <div className="col-span-2 flex justify-center mt-4">
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300"
            >
              Add Doctor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDoctor;
