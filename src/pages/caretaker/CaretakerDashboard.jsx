import React from 'react'
import Title from '../../components/Title'

const CaretakerDashboard = () => {

  const newsItems = [
    "Remember to update pet vaccination records regularly.",
    "Pending adoptions need follow-up this week.",
    "Prepare care kits for upcoming pet visits.",
    "Keep the adoption records up-to-date for transparency.",
    "Ensure all pets are fed and groomed according to schedule."
  ]

  return (
    <div className="px-4 py-10 md:px-10 flex-1">
      <Title
        title="Caretaker Dashboard"
        subTitle="Latest updates and reminders for pet caretakers"
        align="left"
      />

      <div className="mt-10 space-y-6">
        {newsItems.map((news, index) => (
          <div
            key={index}
            className="p-6 rounded-2xl border border-gray-200 shadow-lg bg-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <p className="text-gray-700 text-lg">{news}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CaretakerDashboard