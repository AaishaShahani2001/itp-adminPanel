import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAdminContext } from "../../context/AdminContext";

const AddCareTaker = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    speciality: "",
    experience: "",
    about: "",
    address: "",
  });

  const { aToken } = useAdminContext();
  const [image, setImage] = useState(null);

  //  handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') {
      if (/[A-Z]/.test(value)) {
        toast.error('Email must be lowercase.');
      }
      setFormData({ ...formData, email: value.toLowerCase() });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  //  Strong Validation Function
  const validateForm = () => {
    const { name, email, password, speciality, experience, about, address } = formData;

    // 1 Empty fields
    if (!name || !email || !password || !speciality || !experience || !about || !address) {
      toast.error("⚠ All fields are required!");
      return false;
    }

    // 2 Name format: only letters and spaces, at least 2 chars
    if (!/^[A-Za-z\s]{2,50}$/.test(name.trim())) {
      toast.error("Name must contain only letters and spaces (2–50 chars).");
      return false;
    }

    // 3 Email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      toast.error("Please enter a valid email address!");
      return false;
    }

    if (!password.trim()) toast.error("Password is required.");
    else if (password.length < 6)
      toast.error("Password must be at least 6 characters long.");
    else if (!/[A-Z]/.test(password))
      toast.error("Password must contain at least one uppercase letter.");
    else if (!/[0-9]/.test(password))
      toast.error("Password must contain at least one number.");

    // 5 Speciality validation: 2–50 chars, letters/spaces only
    if (!/^[A-Za-z\s]{2,50}$/.test(speciality.trim())) {
      toast.error("Speciality must contain only letters and spaces (2–50 chars).");
      return false;
    }

    // 6 Experience: must be positive and reasonable (0–60)
    if (isNaN(experience) || experience <= 0 || experience > 60) {
      toast.error("Experience must be a valid number between 1 and 60.");
      return false;
    }

    // 7 About: at least 20 characters
    if (about.trim().length < 20) {
      toast.error("About section must be at least 20 characters long.");
      return false;
    }

    // 8 Address: at least 10 characters
    if (address.trim().length < 10) {
      toast.error("Address must be at least 10 characters long.");
      return false;
    }

    // 9 Image validation
    if (!image) {
      toast.error("Please upload a caretaker image!");
      return false;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(image.type)) {
      toast.error("Only JPEG, PNG, or WEBP image formats are allowed!");
      return false;
    }

    //  Image size limit (2MB)
    const maxSize = 2 * 1024 * 1024;
    if (image.size > maxSize) {
      toast.error("Image size should be less than 2MB!");
      return false;
    }

    return true;
  };

  //  Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => data.append(key, formData[key]));
      data.append("image", image);

      const res = await axios.post("https://itp-backend-waw1.onrender.com/api/admin/add-caretaker", data, {
        headers: { aToken },
      });

      if (res.data.success) {
        toast.success("Caretaker added successfully!");
        setFormData({
          name: "",
          email: "",
          password: "",
          speciality: "",
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
          Add Care Taker
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
              name="experience"
              placeholder="Experience (Years)"
              value={formData.experience}
              onChange={handleChange}
              className="p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <textarea
              name="about"
              placeholder="About Care Taker"
              value={formData.about}
              onChange={handleChange}
              className="p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 h-24"
            ></textarea>
            <textarea
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
              className="p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 h-24"
            ></textarea>
          </div>

          {/* Image upload */}
          <div className="col-span-2 flex flex-col items-center gap-3 mt-3">
            <label className="w-full cursor-pointer bg-green-100 border border-green-600 text-green-700 rounded-lg p-3 text-center hover:bg-green-200">
              Upload Care Taker Image
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
              Add Care Taker
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCareTaker;
