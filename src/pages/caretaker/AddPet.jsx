import React, { useState } from 'react'
import Title from '../../components/Title'
import { assets } from '../../assets/assets'
import { useAppContext } from '../../context/AppContext'
import { useCaretakerContext } from '../../context/CaretakerContex'
import toast, { Toaster } from 'react-hot-toast'

const AddPet = () => {
  const { axios, currency } = useAppContext()
  const { cToken } = useCaretakerContext()

  const [image, setImage] = useState(null)
  const [pet, setPet] = useState({
    species: '',
    breed: '',
    gender: '',
    color: '',
    diet: '',
    age: '',
    price: '',
    medical: '',
    born: '',
    weight: '',
    goodWithKids: '',
    goodWithPets: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  // Strong validation functions
  const validateSpecies = (value) => {
    if (!value.trim()) return 'Species is required'
    if (value.length < 2) return 'Species must be at least 2 characters'
    if (value.length > 50) return 'Species cannot exceed 50 characters'
    if (!/^[a-zA-Z\s]+$/.test(value)) return 'Species can only contain letters and spaces'
    return ''
  }

  const validateBreed = (value) => {
    if (!value.trim()) return 'Breed is required'
    if (value.length < 2) return 'Breed must be at least 2 characters'
    if (value.length > 50) return 'Breed cannot exceed 50 characters'
    if (!/^[a-zA-Z\s]+$/.test(value)) return 'Breed can only contain letters and spaces'
    return ''
  }

  const validateGender = (value) => {
    if (!value.trim()) return 'Gender is required'
    if (!['Male', 'Female', 'male', 'female'].includes(value)) return 'Gender must be either Male or Female'
    return ''
  }

  const validateColor = (value) => {
    if (!value.trim()) return 'Color is required'
    if (value.length < 2) return 'Color must be at least 2 characters'
    if (value.length > 30) return 'Color cannot exceed 30 characters'
    if (!/^[a-zA-Z\s]+$/.test(value)) return 'Color can only contain letters and spaces'
    return ''
  }

  const validateDiet = (value) => {
    if (!value.trim()) return 'Diet is required'
    if (value.length < 3) return 'Diet must be at least 3 characters'
    if (value.length > 100) return 'Diet cannot exceed 100 characters'
    return ''
  }

  const validateAge = (value) => {
    if (!value.trim()) return 'Age is required'
    const num = Number(value)
    if (isNaN(num)) return 'Age must be a number'
    if (!Number.isInteger(num)) return 'Age must be a whole number'
    if (num < 0) return 'Age cannot be negative'
    if (num > 30) return 'Age cannot exceed 30 years'
    return ''
  }

  const validatePrice = (value) => {
    if (!value.trim()) return 'Price is required'
    const num = Number(value)
    if (isNaN(num)) return 'Price must be a number'
    if (num < 0) return 'Price cannot be negative'
    if (num > 100000) return 'Price cannot exceed 100,000'
    return ''
  }

  const validateMedical = (value) => {
    if (!value.trim()) return 'Medical information is required'
    if (value.length < 5) return 'Medical information must be at least 5 characters'
    if (value.length > 500) return 'Medical information cannot exceed 500 characters'
    return ''
  }

  const validateBorn = (value) => {
    if (!value.trim()) return 'Birth date is required'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Birth date must be in YYYY-MM-DD format'
    const date = new Date(value)
    const today = new Date()
    const minDate = new Date('1900-01-01')
    if (isNaN(date.getTime())) return 'Invalid date format'
    if (date > today) return 'Birth date cannot be in the future'
    if (date < minDate) return 'Birth date cannot be before 1900'
    return ''
  }

  const validateWeight = (value) => {
    if (!value.trim()) return 'Weight is required'
    const num = Number(value)
    if (isNaN(num)) return 'Weight must be a number'
    if (num < 0) return 'Weight cannot be negative'
    if (num > 200) return 'Weight seems too high for a pet'
    return ''
  }


  // Handle text fields with strong validation
  const handleTextChange = (field, value) => {
    setPet({ ...pet, [field]: value })
    let error = ''
    
    switch (field) {
      case 'species':
        error = validateSpecies(value)
        break
      case 'breed':
        error = validateBreed(value)
        break
      case 'gender':
        error = validateGender(value)
        break
      case 'color':
        error = validateColor(value)
        break
      case 'diet':
        error = validateDiet(value)
        break
      case 'medical':
        error = validateMedical(value)
        break
      case 'born':
        error = validateBorn(value)
        break
      default:
        error = ''
    }
    
    setErrors((prev) => ({ ...prev, [field]: error }))
  }

  // Handle number fields with strong validation
  const handleNumberChange = (field, value) => {
    setPet({ ...pet, [field]: value })
    let error = ''
    
    if (field === 'age') {
      error = validateAge(value)
    } else if (field === 'price') {
      error = validatePrice(value)
    } else if (field === 'weight') {
      error = validateWeight(value)
    }
    
    setErrors((prev) => ({ ...prev, [field]: error }))
  }


  const validateAllFields = () => {
    // Check image
    if (!image) {
      toast.error('Please upload an image of the pet.')
      return false
    }

    // Validate image file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(image.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed.')
      return false
    }

    if (image.size > maxSize) {
      toast.error('Image size must be less than 5MB.')
      return false
    }

    // Validate all fields
    const fieldValidations = {
      species: validateSpecies(pet.species),
      breed: validateBreed(pet.breed),
      gender: validateGender(pet.gender),
      color: validateColor(pet.color),
      diet: validateDiet(pet.diet),
      age: validateAge(pet.age),
      price: validatePrice(pet.price),
      medical: validateMedical(pet.medical),
      born: validateBorn(pet.born),
      weight: validateWeight(pet.weight)
    }

    // Check for any validation errors
    const hasErrors = Object.values(fieldValidations).some(error => error !== '')
    
    if (hasErrors) {
      // Update errors state
      setErrors(fieldValidations)
      toast.error('Please fix all validation errors before submitting.')
      return false
    }

    return true
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    if (isLoading) return
    if (!validateAllFields()) return

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', image)
      formData.append('petDATA', JSON.stringify(pet))

      const { data } = await axios.post('/api/caretaker/add-pet', formData, {
        headers: { cToken }
      })

      if (data.success) {
        toast.success('Pet added successfully!')
        setImage(null)
        setPet({
          species: '',
          breed: '',
          gender: '',
          color: '',
          diet: '',
          age: '',
          price: '',
          medical: '',
          born: '',
          weight: '',
          goodWithKids: '',
          goodWithPets: ''
        })
        setErrors({})
      } else {
        toast.error(data.message || 'Failed to add pet.')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="px-4 py-10 md:px-10 flex-1">
      <Toaster position="top-right" reverseOrder={false} />
      <Title
        title="Add New Pet"
        subTitle="Fill in details to list a new pet for adoption, including pricing, availability, and pet details"
        align="left"
      />

      <form
        onSubmit={onSubmitHandler}
        className="flex flex-col gap-5 text-gray-500 text-sm mt-6 max-w-xl"
      >
        {/* Pet Image */}
        <div className="flex items-center gap-2 w-full">
          <label htmlFor="pet-image">
            <img
              src={image ? URL.createObjectURL(image) : assets.uploadIcon}
              alt=""
              className="h-14 rounded cursor-pointer"
            />
            <input
              type="file"
              id="pet-image"
              accept="image/*"
              hidden
              onChange={(e) => setImage(e.target.files[0])}
            />
          </label>
          <p className="text-sm text-gray-500"> Upload a picture of the pet </p>
        </div>

        {/* Species, Breed, Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {['species', 'breed'].map((field) => (
            <div key={field} className="flex flex-col w-full">
              <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
              <input
                type="text"
                placeholder={`Enter ${field}`}
                value={pet[field]}
                onChange={(e) => handleTextChange(field, e.target.value)}
                className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
                maxLength={field === 'species' || field === 'breed' ? 50 : undefined}
              />
              {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
            </div>
          ))}
          <div className="flex flex-col w-full">
            <label>Gender</label>
            <select
              value={pet.gender}
              onChange={(e) => handleTextChange('gender', e.target.value)}
              className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
            >
              <option value="">Select a gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
          </div>
        </div>

        {/* Price, Age, Born */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex flex-col w-full">
            <label>Price ({currency})</label>
            <input
              type="number"
              min="0"
              max="100000"
              step="0.01"
              placeholder="Enter price"
              value={pet.price}
              onChange={(e) => handleNumberChange('price', e.target.value)}
              className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
            />
            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
          </div>
          <div className="flex flex-col w-full">
            <label>Age (years)</label>
            <input
              type="number"
              min="0"
              max="30"
              step="1"
              placeholder="Enter age"
              value={pet.age}
              onChange={(e) => handleNumberChange('age', e.target.value)}
              className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
            />
            {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
          </div>
          <div className="flex flex-col w-full">
            <label>Born</label>
            <input
              type="date"
              value={pet.born}
              onChange={(e) => handleTextChange('born', e.target.value)}
              className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
            />
            {errors.born && <p className="text-red-500 text-xs mt-1">{errors.born}</p>}
          </div>
        </div>

        {/* Weight */}
        <div className="flex flex-col w-full">
          <label>Weight (kg)</label>
          <input
            type="number"
            min="0"
            max="200"
            step="0.1"
            placeholder="Enter weight"
            value={pet.weight}
            onChange={(e) => handleNumberChange('weight', e.target.value)}
            className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
          />
          {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight}</p>}
        </div>

        {/* Social Compatibility */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col w-full">
            <label>Good with Kids</label>
            <select
              value={pet.goodWithKids}
              onChange={(e) => handleTextChange('goodWithKids', e.target.value)}
              className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
            >
              <option value="">Select compatibility</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Unknown">Unknown</option>
            </select>
            {errors.goodWithKids && <p className="text-red-500 text-xs mt-1">{errors.goodWithKids}</p>}
          </div>
          <div className="flex flex-col w-full">
            <label>Good with Other Pets</label>
            <select
              value={pet.goodWithPets}
              onChange={(e) => handleTextChange('goodWithPets', e.target.value)}
              className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
            >
              <option value="">Select compatibility</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Unknown">Unknown</option>
            </select>
            {errors.goodWithPets && <p className="text-red-500 text-xs mt-1">{errors.goodWithPets}</p>}
          </div>
        </div>

        {/* Color, Diet, Medical */}
        {['color', 'diet', 'medical'].map((field) => (
          <div key={field} className="flex flex-col w-full">
            <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
            <textarea
              rows={1}
              placeholder={`Enter ${field}`}
              value={pet[field]}
              onChange={(e) => handleTextChange(field, e.target.value)}
              className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
              maxLength={field === 'medical' ? 500 : field === 'diet' ? 100 : field === 'color' ? 30 : undefined}
            ></textarea>
            {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
          </div>
        ))}


        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 mt-4 bg-primary text-white rounded-md font-medium w-max cursor-pointer disabled:opacity-70"
        >
          <img src={assets.tickIcon} alt="" />
          {isLoading ? 'Listing...' : 'List The Pet'}
        </button>
      </form>
    </div>
  )
}

export default AddPet
