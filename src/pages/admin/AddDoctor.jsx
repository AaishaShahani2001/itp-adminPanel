import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAdminContext } from "../../context/AdminContext";

const AddDoctor = () => {
  const { aToken } = useAdminContext();

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

  const [errors, setErrors] = useState({});
  const [image, setImage] = useState(null);

  //  Validate all inputs
  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Full name is required.";
    if (!formData.email.trim()) newErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Invalid email format.";

    if (!formData.password.trim()) newErrors.password = "Password is required.";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters long.";
    else if (!/[A-Z]/.test(formData.password))
      newErrors.password = "Password must contain at least one uppercase letter.";
    else if (!/[0-9]/.test(formData.password))
      newErrors.password = "Password must contain at least one number.";

    if (!formData.speciality.trim())
      newErrors.speciality = "Speciality is required.";
    if (!formData.degree.trim()) newErrors.degree = "Degree is required.";
    if (!formData.experience.trim())
      newErrors.experience = "Experience is required.";
    else if (isNaN(formData.experience) || Number(formData.experience) < 0)
      newErrors.experience = "Experience must be a valid number.";

    if (!formData.about.trim()) newErrors.about = "About section cannot be empty.";
    if (!formData.address.trim()) newErrors.address = "Address is required.";
    if (!image) newErrors.image = "Doctor image is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload a valid image file.");
      } else if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size should be less than 2MB.");
      } else {
        setImage(file);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted errors.");
      return;
    }

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });
      data.append("image", image);

      const res = await axios.post(
        "http://localhost:3000/api/admin/add-doctor",
        data,
        { headers: { atoken: aToken } }
      );

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
        setErrors({});
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
            <div>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 w-full"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 w-full"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 w-full"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <input
                type="text"
                name="speciality"
                placeholder="Speciality"
                value={formData.speciality}
                onChange={handleChange}
                className="p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 w-full"
              />
              {errors.speciality && <p className="text-red-500 text-sm mt-1">{errors.speciality}</p>}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            <div>
              <input
                type="text"
                name="degree"
                placeholder="Degree"
                value={formData.degree}
                onChange={handleChange}
                className="p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 w-full"
              />
              {errors.degree && <p className="text-red-500 text-sm mt-1">{errors.degree}</p>}
            </div>

            <div>
              <input
                type="text"
                name="experience"
                placeholder="Experience (Years)"
                value={formData.experience}
                onChange={handleChange}
                className="p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 w-full"
              />
              {errors.experience && <p className="text-red-500 text-sm mt-1">{errors.experience}</p>}
            </div>

            <div>
              <textarea
                name="about"
                placeholder="About Doctor"
                value={formData.about}
                onChange={handleChange}
                className="p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 w-full h-24"
              ></textarea>
              {errors.about && <p className="text-red-500 text-sm mt-1">{errors.about}</p>}
            </div>

            <div>
              <textarea
                name="address"
                placeholder="Clinic Address"
                value={formData.address}
                onChange={handleChange}
                className="p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 w-full h-24"
              ></textarea>
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>
          </div>

          {/* Image upload */}
          <div className="col-span-2 flex flex-col items-center gap-3 mt-3">
            <label className="w-full cursor-pointer bg-green-100 border border-green-600 text-green-700 rounded-lg p-3 text-center hover:bg-green-200">
              Upload Doctor Image
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
            {image && (
              <img
                src={URL.createObjectURL(image)}
                alt="preview"
                className="w-28 h-28 object-cover rounded-full shadow-md"
              />
            )}
            {errors.image && <p className="text-red-500 text-sm">{errors.image}</p>}
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