import React, { useEffect, useState } from "react";
import Title from "../../components/Title";
import toast from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";
import { useAdminContext } from "../../context/AdminContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


const ManageAdoption = () => {
  const { currency, axios } = useAppContext();
  const { aToken } = useAdminContext();

  const [adoptions, setAdoptions] = useState([]);
  const [filteredAdoptions, setFilteredAdoptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(null);
  const [showFinishConfirm, setShowFinishConfirm] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    payment: 'all',
    petSpecies: 'all',
    dateRange: 'all'
  });

  const fetchAdminAdoptions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await axios.get("/api/admin/getAdoption", {headers: {aToken}});

      if (data.success) {
        setAdoptions(data.adoptions);
        setFilteredAdoptions(data.adoptions);
      } else {
        setError(data.message || "Failed to fetch adoptions");
      }
    } catch (error) {
      setError("No adoptions found.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter function
  const applyFilters = () => {
    let filtered = [...adoptions];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(adopt => adopt.status === filters.status);
    }

    // Payment filter
    if (filters.payment !== 'all') {
      const isPaid = filters.payment === 'paid';
      filtered = filtered.filter(adopt => adopt.isPaid === isPaid);
    }

    // Pet species filter
    if (filters.petSpecies !== 'all') {
      filtered = filtered.filter(adopt => adopt.pet?.species === filters.petSpecies);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (filters.dateRange) {
        case 'today':
          filtered = filtered.filter(adopt => {
            const adoptDate = new Date(adopt.date);
            return adoptDate >= today;
          });
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          filtered = filtered.filter(adopt => {
            const adoptDate = new Date(adopt.date);
            return adoptDate >= weekAgo;
          });
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          filtered = filtered.filter(adopt => {
            const adoptDate = new Date(adopt.date);
            return adoptDate >= monthAgo;
          });
          break;
        default:
          break;
      }
    }

    setFilteredAdoptions(filtered);
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };


  const updateAdoptionStatus = async (adoptionId, status, visit = null) => {
    try {
      const { data } = await axios.put("/api/admin/change-status", { adoptionId, status, visit }, { headers: {aToken} });

      if (data.success) {
        toast.success(data.message);
        fetchAdminAdoptions();
        setShowDatePicker(null);
        setShowFinishConfirm(null);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Cancel adoption
  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this adoption?")) return;
    try {
      const response = await axios.delete(`/api/admin/cancel-adoption/${id}`, {headers: {aToken}});

      if (response.data.success) {
        toast.success("Adoption canceled!");
        fetchAdminAdoptions();
      } else {
        toast.error(response.data.message || "Failed to cancel adoption");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const exportAdoptionsPDF = () => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(18);
  doc.text("Adoption Management Summary", 40, 40);

  // Generated Date
  doc.setFontSize(11);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 60);

  // Build Table Body
  const body = filteredAdoptions.map((a) => [
    `${a.pet?.species || "-"} / ${a.pet?.breed || "-"}`,
    a.name || "N/A",
    a.age || "N/A",
    a.phone || "N/A",
    a.occupation || "N/A",
    a.experience || "N/A",
    a.livingSpace || "N/A",
    a.otherPets || "N/A",
    a.timeCommitment || "N/A",
    a.child || "N/A",
    a.emergencyContact || "N/A",
    a.address || "N/A",
    a.reason || "N/A",
    `${currency} ${a.pet?.price ?? "-"}`,
    a.date ? new Date(a.date).toLocaleDateString() : "N/A",
    a.visit ? new Date(a.visit).toLocaleDateString() : "Not set",
    a.status || "N/A",
    a.isPaid ? 'Paid' : 'Not Paid'
  ]);

  autoTable(doc, {
    startY: 80,
    head: [["Pet", "Name", "Age", "Phone", "Occupation", "Experience", "Living Space", "Other Pets", "Time Commitment", "Child Details", "Emergency Contact", "Address", "Reason", "Price", "Adoption Date", "Visit Date", "Status", "Payment"]],
    body,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 3, valign: "middle" },
    headStyles: { fillColor: [16, 163, 127] },
    didDrawPage: () => {
      doc.setFontSize(9);
      doc.text(`Page ${doc.getNumberOfPages()}`, pageW - 60, doc.internal.pageSize.getHeight() - 20);
    },
  });

    // Summary
    let y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 100;
    doc.setFontSize(12);
    doc.text("Summary", 40, y);
    doc.setFontSize(10);
    y += 16;
    doc.text(`Total adoptions: ${filteredAdoptions.length}`, 40, y);

    const pending = filteredAdoptions.filter((a) => a.status === "pending").length;
    const approved = filteredAdoptions.filter((a) => a.status === "approved").length;
    const completed = filteredAdoptions.filter((a) => a.status === "completed").length;
    const rejected = filteredAdoptions.filter((a) => a.status === "rejected").length;

    y += 14;
    doc.text(`Pending: ${pending}, Approved: ${approved}, Completed: ${completed}, Rejected: ${rejected}`, 40, y);

    doc.save("adoption-management-summary.pdf");
  };


  useEffect(() => {
    if (aToken) {
      fetchAdminAdoptions();
    } else {
      setError("Admin token not available");
      setIsLoading(false);
    }
  }, [aToken]);

  // Apply filters whenever filters or adoptions change
  useEffect(() => {
    applyFilters();
  }, [filters, adoptions]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="px-4 pt-10 md:px-10 w-full">
    <Title title="Manage Adoptions" subTitle="Track all adopter adoptions, approve or reject the requests, and manage adoption statuses." align="left"/>

      {/* Filters Section */}
      <div className="mt-6 p-6">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Payment Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment</label>
            <select
              value={filters.payment}
              onChange={(e) => handleFilterChange('payment', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Not Paid</option>
            </select>
          </div>

          {/* Pet Species Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pet Species</label>
            <select
              value={filters.petSpecies}
              onChange={(e) => handleFilterChange('petSpecies', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
            >
              <option value="all">All Species</option>
              {[...new Set(adoptions.map(adopt => adopt.pet?.species).filter(Boolean))].map(species => (
                <option key={species} value={species}>{species}</option>
              ))}
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="w-full rounded-2xl overflow-hidden shadow-xl border border-gray-200 mt-6 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-primary/30">
              <tr className="border-b border-gray-200">
                <th className="px-6 py-4 font-semibold">Pet</th>
                <th className="px-6 py-4 font-semibold">Adopter</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold">Adoption Date</th>
                <th className="px-6 py-4 font-semibold">Appointment</th>
                <th className="px-6 py-4 font-semibold">Payment</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAdoptions.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 text-lg font-medium">No adoptions found</p>
                      <p className="text-gray-400 text-sm">
                        {adoptions.length === 0 
                          ? "Adoption applications will appear here" 
                          : "No adoptions match your current filters. Try adjusting your search criteria."
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAdoptions.map((adopt, index) => (
                  <tr key={adopt._id} className={`hover:bg-gray-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={adopt.pet?.image || ""}
                          alt={adopt.pet?.breed || "Pet"}
                          className="h-14 w-14 rounded-xl object-cover shadow-md border-2 border-white"
                          onError={(e) => {
                            e.target.src = "/path/to/default-image.jpg";
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 text-sm">
                            {adopt.pet?.species || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {adopt.pet?.breed || "Unknown"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{adopt.name || "N/A"}</p>
                        <p className="text-xs text-gray-500">Age: {adopt.age || "N/A"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{adopt.phone || "N/A"}</p>
                        <p className="text-xs text-gray-500 truncate">{adopt.occupation || "N/A"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 font-medium">
                        {currency} {adopt.pet?.price || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {new Date(adopt.date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${
                        adopt.visit ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {adopt.visit
                          ? new Date(adopt.visit).toLocaleDateString()
                          : "Not scheduled"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        adopt.isPaid 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          adopt.isPaid ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        {adopt.isPaid ? 'Paid' : "Unpaid"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        adopt.status === "pending"
                          ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                          : adopt.status === "approved"
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : adopt.status === "completed"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          adopt.status === "pending"
                            ? "bg-yellow-500"
                            : adopt.status === "approved"
                            ? "bg-green-500"
                            : adopt.status === "completed"
                            ? "bg-blue-500"
                            : "bg-red-500"
                        }`}></div>
                        {adopt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setShowDetailsModal(adopt)}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors duration-200 border border-blue-200"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Details
                        </button>
                        
                        {adopt.status === "pending" && (
                          <select
                            onChange={(e) => updateAdoptionStatus(adopt._id, e.target.value)}
                            value={adopt.status}
                            className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white"
                          >
                            <option value="pending" disabled>Pending</option>
                            <option value="approved">Approve</option>
                            <option value="rejected">Reject</option>
                          </select>
                        )}
                        
                        {adopt.status === "approved" && adopt.isPaid && (
                          <div className="flex flex-col gap-1">
                            {adopt.visit ? (
                              <button
                                onClick={() => setShowFinishConfirm(adopt._id)}
                                className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors duration-200 border border-green-200"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Complete
                              </button>
                            ) : (
                              <button
                                onClick={() => setShowDatePicker(adopt._id)}
                                className="inline-flex items-center px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-100 transition-colors duration-200 border border-orange-200"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Set Visit
                              </button>
                            )}
                          </div>
                        )}
                        
                        {/* Show payment status for approved but not paid adoptions */}
                        {adopt.status === "approved" && !adopt.isPaid && (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-medium border border-yellow-200">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              Awaiting Payment
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex justify-end mt-4">
        <button
          onClick={exportAdoptionsPDF}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white text-sm font-semibold hover:bg-emerald-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 16l4-5h-3V4h-2v7H8l4 5z"/><path d="M20 18H4v2h16v-2z"/>
          </svg>
          Download Adoption PDF
        </button>
      </div>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-md w-full shadow-2xl border border-white/20">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Select Visit Date
              </h3>
              <input
                type="date"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                onChange={(e) =>
                  updateAdoptionStatus(showDatePicker, "approved", e.target.value)
                }
              />
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setShowDatePicker(null)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Finish Confirmation Modal */}
      {showFinishConfirm && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-md w-full shadow-2xl border border-white/20">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Complete Adoption?
              </h3>
              <p className="text-gray-600 mb-6">Are you sure you want to mark this adoption as completed?</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowFinishConfirm(null)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateAdoptionStatus(showFinishConfirm, "completed")}
                  className="px-6 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 font-medium"
                >
                  Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed View Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Adoption Details</h2>
                  <p className="text-gray-600 mt-1">Complete information about this adoption application</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pet Information */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Pet Information
                  </h3>
                  <div className="flex items-center gap-4">
                    <img
                      src={showDetailsModal.pet?.image || ""}
                      alt={showDetailsModal.pet?.breed || "Pet"}
                      className="h-24 w-24 rounded-xl object-cover shadow-lg"
                    />
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-800">{showDetailsModal.pet?.species || "Unknown"}</h4>
                      <p className="text-gray-600 font-medium">{showDetailsModal.pet?.breed || "Unknown"}</p>
                      <p className="text-lg font-bold text-blue-600 mt-1">{currency} {showDetailsModal.pet?.price || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Personal Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-green-100">
                      <span className="font-semibold text-gray-700">Name:</span>
                      <span className="text-gray-800 font-medium">{showDetailsModal.name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-green-100">
                      <span className="font-semibold text-gray-700">Age:</span>
                      <span className="text-gray-800 font-medium">{showDetailsModal.age || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-green-100">
                      <span className="font-semibold text-gray-700">Phone:</span>
                      <span className="text-gray-800 font-medium">{showDetailsModal.phone || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-green-100">
                      <span className="font-semibold text-gray-700">Occupation:</span>
                      <span className="text-gray-800 font-medium">{showDetailsModal.occupation || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-green-100">
                      <span className="font-semibold text-gray-700">Emergency Contact:</span>
                      <span className="text-gray-800 font-medium">{showDetailsModal.emergencyContact || "N/A"}</span>
                    </div>
                    <div className="py-2">
                      <span className="font-semibold text-gray-700 block mb-1">Address:</span>
                      <span className="text-gray-800 text-sm">{showDetailsModal.address || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* NIC Document */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    NIC Document
                  </h3>
                  {showDetailsModal.nicImage ? (
                    <div className="flex justify-center">
                      <img 
                        src={showDetailsModal.nicImage} 
                        alt="NIC Document" 
                        className="max-w-full h-auto max-h-96 rounded-lg shadow-lg border-2 border-blue-200 object-cover"
                        onError={(e) => {
                          // Hide the broken image and show error message
                          e.target.style.display = 'none';
                          const errorDiv = document.createElement('div');
                          errorDiv.className = 'text-center py-8';
                          errorDiv.innerHTML = `
                            <svg class="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <p class="text-red-500">NIC image unavailable</p>
                            <p class="text-xs text-gray-500 mt-2">Image URL has expired or is invalid</p>
                            <p class="text-xs text-gray-400 mt-1">Please re-upload the NIC document</p>
                          `;
                          e.target.parentNode.appendChild(errorDiv);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500">NIC document not uploaded</p>
                    </div>
                  )}
                  <p className="text-center text-sm text-gray-600 mt-2">National Identity Card</p>
                </div>

                {/* Pet Care Information */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pet Care Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-purple-100">
                      <span className="font-semibold text-gray-700">Experience:</span>
                      <span className="text-gray-800 font-medium capitalize">{showDetailsModal.experience || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-purple-100">
                      <span className="font-semibold text-gray-700">Living Space:</span>
                      <span className="text-gray-800 font-medium capitalize">{showDetailsModal.livingSpace || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-purple-100">
                      <span className="font-semibold text-gray-700">Other Pets:</span>
                      <span className="text-gray-800 font-medium capitalize">{showDetailsModal.otherPets || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-purple-100">
                      <span className="font-semibold text-gray-700">Time Commitment:</span>
                      <span className="text-gray-800 font-medium capitalize">{showDetailsModal.timeCommitment || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-semibold text-gray-700">Child Details:</span>
                      <span className="text-gray-800 font-medium capitalize">{showDetailsModal.child || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Adoption Details */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Adoption Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-orange-100">
                      <span className="font-semibold text-gray-700">Adoption Date:</span>
                      <span className="text-gray-800 font-medium">{new Date(showDetailsModal.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-orange-100">
                      <span className="font-semibold text-gray-700">Visit Date:</span>
                      <span className="text-gray-800 font-medium">{showDetailsModal.visit ? new Date(showDetailsModal.visit).toLocaleDateString() : "Not scheduled"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-orange-100">
                      <span className="font-semibold text-gray-700">Status:</span>
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        showDetailsModal.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : showDetailsModal.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : showDetailsModal.status === "completed"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {showDetailsModal.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-semibold text-gray-700">Payment:</span>
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        showDetailsModal.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {showDetailsModal.isPaid ? 'Paid' : 'Not Paid'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="mt-8">
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Reason for Adoption
                  </h3>
                  <div className="bg-white rounded-lg p-4 border border-gray-100">
                    <p className="text-gray-700 leading-relaxed">{showDetailsModal.reason || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    
  );
};

export default ManageAdoption;