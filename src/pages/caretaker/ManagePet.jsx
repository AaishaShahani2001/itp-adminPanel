import React, { useEffect, useState } from 'react';
import { assets } from '../../assets/assets';
import Title from '../../components/Title';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ManagePet = () => {
  const { axios, currency } = useAppContext();
  const [pets, setPets] = useState([]);
  const [editingPet, setEditingPet] = useState(null);
  const [editForm, setEditForm] = useState({
    species: '',
    breed: '',
    gender: '',
    color: '',
    diet: '',
    medical: '',
    age: '',
    price: '',
    born: '',
    weight: '',
    goodWithKids: '',
    goodWithPets: '',
    image: null,
  });

  const fetchCaretakerPet = async () => {
  try {
    const { data } = await axios.get('/api/caretaker/pets');
    if (data.success) {
      setPets(data.pets);
      console.log('Fetched pets:', data.pets.map(p => ({ _id: p._id, species: p.species }))); // Ensure _id is logged
    } else {
      toast.error(data.message);
    }
  } catch (error) {
    console.error('Fetch error:', error.response?.data || error.message);
    toast.error(error.message);
  }
};

const deletePet = async (petId) => {
    const confirm = window.confirm(
      "Are you sure you want to remove this pet? This action cannot be undone."
    );

    if (!confirm) return;

    try {
      const { data } = await axios.post("/api/caretaker/remove-pet", { petId });

      if (data.success) {
        toast.success(data.message);
        // Remove the deleted pet from the state
        setPets((prevPets) => prevPets.filter((pet) => pet._id !== petId));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to remove pet");
    }
  };

  const exportPetsPDF = () => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(18);
  doc.text("Pet Management Summary", 40, 40);

  // Generated date
  doc.setFontSize(11);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 60);

  // Build rows
  const body = pets.map((p) => [
    p.species || "-",
    p.breed || "-",
    p.gender || "-",
    p.color || "-",
    p.age ? `${p.age} yrs` : "-",
    p.weight ? `${p.weight} kg` : "-",
    `${currency} ${p.price ?? "-"}`,
    p.diet || "-",
    p.medical || "-",
    p.born || "-",
    p.goodWithKids || "-",
    p.goodWithPets || "-",
  ]);

  autoTable(doc, {
    startY: 80,
    head: [["Species", "Breed", "Gender", "Color", "Age", "Weight", "Price", "Diet", "Medical", "Born", "Good with Kids", "Good with Pets"]],
    body,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4, valign: "middle" },
    headStyles: { fillColor: [37, 99, 235] },
    didDrawPage: () => {
      doc.setFontSize(9);
      doc.text(`Page ${doc.getNumberOfPages()}`, pageW - 60, doc.internal.pageSize.getHeight() - 20);
    },
  });

  // Summary block
  let y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 100;
  doc.setFontSize(12);
  doc.text("Summary", 40, y);
  doc.setFontSize(10);
  y += 16;
  doc.text(`Total pets: ${pets.length}`, 40, y);

  const dogs = pets.filter(p => p.species?.toLowerCase() === "dog").length;
  const cats = pets.filter(p => p.species?.toLowerCase() === "cat").length;
  const rabbits = pets.filter(p => p.species?.toLowerCase() === "rabbit").length;
  const others = pets.length - (dogs + cats + rabbits);

  y += 14;
  doc.text(`By type: Dogs ${dogs}, Cats ${cats}, Rabbits ${rabbits}, Others ${others}`, 40, y);

  doc.save("pet-management-summary.pdf");
};


  useEffect(() => {
    fetchCaretakerPet();
  }, []);

  const handleEditClick = (pet) => {
    console.log('Selected pet for edit:', { _id: pet._id, species: pet.species });
    if (!pet || !pet._id) {
      console.error('Invalid pet object:', pet);
      toast.error('Invalid pet selected for editing');
      return;
    }
    setEditingPet(pet);
    setEditForm({
      species: pet.species || '',
      breed: pet.breed || '',
      gender: pet.gender || '',
      color: pet.color || '',
      diet: pet.diet || '',
      medical: pet.medical || '',
      age: pet.age || '',
      price: pet.price || '',
      born: pet.born || '',
      weight: pet.weight || '',
      goodWithKids: pet.goodWithKids || '',
      goodWithPets: pet.goodWithPets || '',
      image: pet.image || null,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setEditForm((prev) => ({ ...prev, image: file || prev.image }));
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editingPet || !editingPet._id) {
      console.error('Invalid editingPet or _id:', editingPet);
      toast.error('Invalid pet data. Please try selecting again.');
      setEditingPet(null); // Reset to close the modal
      return;
    }

    const formData = new FormData();
    Object.keys(editForm).forEach((key) => {
      if (key === 'image' && editForm[key] instanceof File) {
        formData.append(key, editForm[key]);
      } else if (key === 'image' && typeof editForm[key] === 'string') {
        formData.append(key, editForm[key]);
      } else if (key === 'age' || key === 'price' || key === 'weight') {
        formData.append(key, editForm[key] !== '' ? parseFloat(editForm[key]) : '');
      } else {
        formData.append(key, editForm[key] || '');
      }
    });
    console.log('Submitting edit for pet ID:', editingPet._id, 'FormData:', Object.fromEntries(formData));

    try {
      const { data } = await axios.put(`/api/caretaker/edit-pet/${editingPet._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('Edit response:', data);

      if (data.success) {
        setPets((prevPets) =>
          prevPets.map((pet) =>
            pet._id === editingPet._id ? { ...pet, ...data.pet } : pet
          )
        );
        setEditingPet(null);
        setEditForm({
          species: '',
          breed: '',
          gender: '',
          color: '',
          diet: '',
          medical: '',
          age: '',
          price: '',
          born: '',
          weight: '',
          goodWithKids: '',
          goodWithPets: '',
          image: null,
        });
        toast.success('Pet updated successfully');
      } else {
        toast.error(data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Edit error:', error.response?.data || error.message, error.stack);
      toast.error(error.response?.data?.message || 'Failed to update pet');
    }
  };

  const handleCloseEdit = () => {
    setEditingPet(null);
    setEditForm({
      species: '',
      breed: '',
      gender: '',
      color: '',
      diet: '',
      medical: '',
      age: '',
      price: '',
      born: '',
      weight: '',
      goodWithKids: '',
      goodWithPets: '',
      image: null,
    });
  };

  return (
    <div className='px-4 pt-10 md:px-10 w-full'>
      <Title
        title='Manage Pets'
        subTitle='View all listed pets, update their details, or remove them from the list.'
        align='left'
      />

      <div className='max-w-7xl w-full rounded-md overflow-hidden border border-borderColor mt-6'>
        <table className='w-full border-collapse text-left text-sm text-gray-600'>
          <thead className='text-gray-500'>
            <tr>
              <th className='p-3 font-medium'>Pet</th>
              <th className='p-3 font-medium'>Gender</th>
              <th className='p-3 font-medium'>Color</th>
              <th className='p-3 font-medium'>Age</th>
              <th className='p-3 font-medium'>Weight</th>
              <th className='p-3 font-medium'>Price</th>
              <th className='p-3 font-medium'>Good with Kids</th>
              <th className='p-3 font-medium'>Good with Pets</th>
              <th className='p-3 font-medium'>Action</th>
            </tr>
          </thead>
          <tbody>
            {pets.map((pet, index) => (
              <tr key={pet._id || index} className='border-t border-borderColor'>
                <td className='p-3 flex items-center gap-3'>
                  <img
                    src={pet.image}
                    alt=''
                    className='h-12 w-12 aspect-square rounded-md object-cover'
                  />
                  <div className='max-md:hidden'>
                    <p className='font-medium'>
                      {pet.species} ● {pet.breed}
                    </p>
                    <p className='text-xs text-gray-500'>Born on: {pet.born}</p>
                  </div>
                </td>
                <td className='p-3'>{pet.gender}</td>
                <td className='p-3'>{pet.color}</td>
                <td className='p-3'>{pet.age}</td>
                <td className='p-3'>{pet.weight ? `${pet.weight} kg` : '-'}</td>
                <td className='p-3'>{currency} {pet.price}</td>
                <td className='p-3'>{pet.goodWithKids || '-'}</td>
                <td className='p-3'>{pet.goodWithPets || '-'}</td>
                <td className='flex items-center p-3 gap-5'>
                  <img
                    src={assets.edit_black}
                    alt='edit'
                    className='cursor-pointer'
                    onClick={() => handleEditClick(pet)}/>
                  <button
                        onClick={() => deletePet(pet._id)}
                        className='border border-red-700 px-2 py-2 rounded-full hover:bg-red-400 hover:text-white transition-all'>
                        Remove Pet
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end mt-4">
  <button
    onClick={exportPetsPDF}
    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-semibold hover:bg-blue-700"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 16l4-5h-3V4h-2v7H8l4 5z"/><path d="M20 18H4v2h16v-2z"/>
    </svg>
    Download PDF
  </button>
</div>

      {editingPet && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4'>
          <div className='w-full max-w-4xl max-h-[90vh] overflow-y-auto'>
            <div className='bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-2xl overflow-hidden'>
              {/* Header */}
              <div className='bg-primary px-8 py-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h2 className='text-3xl font-bold text-white'>Edit Pet Details</h2>
                    <p className='text-blue-100 mt-1'>Update your pet's information</p>
                  </div>
                  <button
                    onClick={handleCloseEdit}
                    className='text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full'
                  >
                    <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitEdit} className='p-8 space-y-6'>
                {/* Basic Information Section */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <label className='block text-sm font-semibold text-gray-700'>Species</label>
                    <input
                      type='text'
                      name='species'
                      value={editForm.species}
                      onChange={handleInputChange}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm'
                      placeholder='Enter species'
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <label className='block text-sm font-semibold text-gray-700'>Breed</label>
                    <input
                      type='text'
                      name='breed'
                      value={editForm.breed}
                      onChange={handleInputChange}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm'
                      placeholder='Enter breed'
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <label className='block text-sm font-semibold text-gray-700'>Gender</label>
                    <select
                      name='gender'
                      value={editForm.gender}
                      onChange={handleInputChange}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm'
                      required
                    >
                      <option value=''>Select gender</option>
                      <option value='Male'>Male</option>
                      <option value='Female'>Female</option>
                    </select>
                  </div>
                  <div className='space-y-2'>
                    <label className='block text-sm font-semibold text-gray-700'>Color</label>
                    <input
                      type='text'
                      name='color'
                      value={editForm.color}
                      onChange={handleInputChange}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm'
                      placeholder='Enter color'
                      required
                    />
                  </div>
                </div>

                {/* Physical Details Section */}
                <div className='border-t border-gray-200 pt-6'>
                  <h3 className='text-lg font-semibold text-gray-800 mb-4 flex items-center'>
                    Physical Details
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                    <div className='space-y-2'>
                      <label className='block text-sm font-semibold text-gray-700'>Age (years)</label>
                      <input
                        type='number'
                        name='age'
                        value={editForm.age}
                        onChange={handleInputChange}
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm'
                        placeholder='Enter age'
                        min='0'
                        max='50'
                        required
                      />
                    </div>
                    <div className='space-y-2'>
                      <label className='block text-sm font-semibold text-gray-700'>Weight (kg)</label>
                      <input
                        type='number'
                        name='weight'
                        value={editForm.weight}
                        onChange={handleInputChange}
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm'
                        step='0.1'
                        min='0'
                        max='200'
                        placeholder='Enter weight'
                        required
                      />
                    </div>
                    <div className='space-y-2'>
                      <label className='block text-sm font-semibold text-gray-700'>Price ({currency})</label>
                      <input
                        type='number'
                        name='price'
                        value={editForm.price}
                        onChange={handleInputChange}
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm'
                        placeholder='Enter price'
                        min='0'
                        step='0.01'
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Care Information Section */}
                <div className='border-t border-gray-200 pt-6'>
                  <h3 className='text-lg font-semibold text-gray-800 mb-4 flex items-center'>
                    Care Information
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-2'>
                      <label className='block text-sm font-semibold text-gray-700'>Diet</label>
                      <input
                        type='text'
                        name='diet'
                        value={editForm.diet}
                        onChange={handleInputChange}
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm'
                        placeholder='Enter diet requirements'
                        required
                      />
                    </div>
                    <div className='space-y-2'>
                      <label className='block text-sm font-semibold text-gray-700'>Born Date</label>
                      <input
                        type='date'
                        name='born'
                        value={editForm.born}
                        onChange={handleInputChange}
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm'
                        required
                      />
                    </div>
                  </div>
                  <div className='mt-6'>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>Medical Information</label>
                    <textarea
                      name='medical'
                      value={editForm.medical}
                      onChange={handleInputChange}
                      rows={3}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm resize-none'
                      placeholder='Enter medical information and health status'
                      required
                    />
                  </div>
                </div>
                {/* Social Compatibility Section */}
                <div className='border-t border-gray-200 pt-6'>
                  <h3 className='text-lg font-semibold text-gray-800 mb-4 flex items-center'>
                    Social Compatibility
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-2'>
                      <label className='block text-sm font-semibold text-gray-700'>Good with Kids</label>
                      <select
                        name='goodWithKids'
                        value={editForm.goodWithKids}
                        onChange={handleInputChange}
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm'
                        required
                      >
                        <option value=''>Select compatibility</option>
                        <option value='Yes'>Yes</option>
                        <option value='No'>No</option>
                        <option value='Unknown'>Unknown</option>
                      </select>
                    </div>
                    <div className='space-y-2'>
                      <label className='block text-sm font-semibold text-gray-700'>Good with Other Pets</label>
                      <select
                        name='goodWithPets'
                        value={editForm.goodWithPets}
                        onChange={handleInputChange}
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm'
                        required
                      >
                        <option value=''>Select compatibility</option>
                        <option value='Yes'>Yes</option>
                        <option value='No'>No</option>
                        <option value='Unknown'>Unknown</option>
                      </select>
                    </div>
                  </div>
                </div>
                {/* Image Upload Section */}
                <div className='border-t border-gray-200 pt-6'>
                  <h3 className='text-lg font-semibold text-gray-800 mb-4 flex items-center'>
                    Pet Image
                  </h3>
                  <div className='space-y-4'>
                    {editForm.image && typeof editForm.image === 'string' && (
                      <div className='flex items-center space-x-4'>
                        <img
                          src={editForm.image}
                          alt='Current Pet'
                          className='h-24 w-24 object-cover rounded-lg border-2 border-gray-200 shadow-sm'
                        />
                        <div>
                          <p className='text-sm font-medium text-gray-700'>Current Image</p>
                          <p className='text-xs text-gray-500'>Upload a new image to replace this one</p>
                        </div>
                      </div>
                    )}
                    <div className='relative'>
                      <input
                        type='file'
                        name='image'
                        onChange={handleImageChange}
                        accept='image/*'
                        className='w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100'
                      />
                      <p className='text-xs text-gray-500 mt-2'>Upload a high-quality image of your pet (JPG, PNG, or WebP)</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='border-t border-gray-200 pt-6 flex flex-col sm:flex-row gap-4 justify-end'>
                  <button
                    type='button'
                    onClick={handleCloseEdit}
                    className='px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium flex items-center justify-center'
                  >
                    <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                    Cancel
                  </button>
                  <button
                    type='submit'
                    className='px-6 py-3 bg-primary text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium flex items-center justify-center shadow-lg hover:shadow-xl'
                  >
                    <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                    </svg>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePet;