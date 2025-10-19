import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAdminContext } from "../../context/AdminContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


const API_BASE = "http://localhost:3000/api/admin";

const ManageStaffs = () => {
  const { aToken } = useAdminContext();
  const [doctors, setDoctors] = useState([]);
  const [caretakers, setCaretakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [doctorSpeciality, setDoctorSpeciality] = useState("");
  const [caretakerSpeciality, setCaretakerSpeciality] = useState("");

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editType, setEditType] = useState(null); // 'doctor' | 'caretaker'
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    speciality: "",
    degree: "",
    experience: "",
    about: "",
    address: "",
    image: null,
  });

  // Fetch doctors from backend
  const fetchDoctors = async () => {
    try {
      const res = await axios.get(`${API_BASE}/doctors`, {
        headers: { aToken },
      });
      if (res.data.success) setDoctors(res.data.doctors || []);
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  };

  // Fetch caretakers from backend
  const fetchCaretakers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/caretakers`, {
        headers: { aToken },
      });
      if (res.data.success) setCaretakers(res.data.caretakers || []);
    } catch (err) {
      console.error("Error fetching caretakers:", err);
    }
  };

  useEffect(() => {
    (async () => {
      await Promise.all([fetchDoctors(), fetchCaretakers()]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derived lists with filters
  const filteredDoctors = doctors.filter((d) => {
    const q = search.toLowerCase();
    const matchesQuery =
      (d.name || "").toLowerCase().includes(q) ||
      (d.email || "").toLowerCase().includes(q) ||
      (d.speciality || "").toLowerCase().includes(q);
    const matchesSpec = doctorSpeciality ? d.speciality === doctorSpeciality : true;
    return matchesQuery && matchesSpec;
  });

  const filteredCaretakers = caretakers.filter((c) => {
    const q = search.toLowerCase();
    const matchesQuery =
      (c.name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.speciality || "").toLowerCase().includes(q);
    const matchesSpec = caretakerSpeciality ? c.speciality === caretakerSpeciality : true;
    return matchesQuery && matchesSpec;
  });

  const uniqueDoctorSpecs = Array.from(
    new Set(doctors.map((d) => d.speciality).filter(Boolean))
  );
  const uniqueCaretakerSpecs = Array.from(
    new Set(caretakers.map((c) => c.speciality).filter(Boolean))
  );

  // Actions: Edit/Delete
  const openEdit = (type, item) => {
    setEditType(type);
    setEditItem(item);
    setEditForm({
      name: item.name || "",
      email: item.email || "",
      speciality: item.speciality || "",
      degree: type === "doctor" ? item.degree || "" : "",
      experience: item.experience || "",
      about: item.about || "",
      address: item.address || "",
      image: null,
    });
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setEditType(null);
    setEditItem(null);
    setEditForm({
      name: "",
      email: "",
      speciality: "",
      degree: "",
      experience: "",
      about: "",
      address: "",
      image: null,
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((p) => ({ ...p, [name]: value }));
  };

  const handleEditImage = (e) => {
    const file = e.target.files?.[0];
    setEditForm((p) => ({ ...p, image: file || null }));
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editItem || !editType) return;
    try {
      const data = new FormData();
      Object.entries(editForm).forEach(([k, v]) => {
        if (k === "image") return;
        if (v !== undefined && v !== null) data.append(k, v);
      });
      if (editForm.image) data.append("image", editForm.image);

      const url =
        editType === "doctor"
          ? `${API_BASE}/update-doctor/${editItem._id}`
          : `${API_BASE}/update-caretaker/${editItem._id}`;

      await axios.put(url, data, {
        headers: {
          aToken,
          "Content-Type": "multipart/form-data",
        },
      });

      await Promise.all([fetchDoctors(), fetchCaretakers()]);
      closeEdit();
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const deleteItem = async (type, id) => {
    const label = type === "doctor" ? "doctor" : "caretaker";
    const ok = window.confirm(
      `Are you sure you want to remove this ${label}? This action cannot be undone.`
    );
    if (!ok) return;
    try {
      const url =
        type === "doctor"
          ? `${API_BASE}/delete-doctor/${id}`
          : `${API_BASE}/delete-caretaker/${id}`;
      await axios.delete(url, { headers: { aToken } });
      await Promise.all([fetchDoctors(), fetchCaretakers()]);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // PDF per row
  const downloadDoctorPDF = (rows) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text("Doctors Report", 40, 40);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 60);

    const body = rows.map((d) => [
      d.name || "-",
      d.email || "-",
      d.speciality || "-",
      d.degree || "-",
      d.experience != null ? `${d.experience} yrs` : "-",
      d.address || "-",
    ]);

    autoTable(doc, {
      startY: 80,
      head: [["Name", "Email", "Speciality", "Degree", "Experience", "Address"]],
      body,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3, valign: "middle" },
      headStyles: { fillColor: [37, 99, 235] },
      didDrawPage: () => {
        doc.setFontSize(9);
        doc.text(
          `Page ${doc.getNumberOfPages()}`,
          pageW - 60,
          doc.internal.pageSize.getHeight() - 20
        );
      },
    });

    const y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 100;
    doc.setFontSize(12);
    doc.text("Summary", 40, y);
    doc.setFontSize(10);
    doc.text(`Total doctors: ${rows.length}`, 40, y + 16);

    doc.save("doctors-report.pdf");
  };

  const downloadCaretakerPDF = (rows) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text("Caretakers Report", 40, 40);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 60);

    const body = rows.map((c) => [
      c.name || "-",
      c.email || "-",
      c.speciality || "-",
      c.experience != null ? `${c.experience} yrs` : "-",
      c.address || "-",
    ]);

    autoTable(doc, {
      startY: 80,
      head: [["Name", "Email", "Speciality", "Experience", "Address"]],
      body,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3, valign: "middle" },
      headStyles: { fillColor: [16, 185, 129] },
      didDrawPage: () => {
        doc.setFontSize(9);
        doc.text(
          `Page ${doc.getNumberOfPages()}`,
          pageW - 60,
          doc.internal.pageSize.getHeight() - 20
        );
      },
    });

    const y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 100;
    doc.setFontSize(12);
    doc.text("Summary", 40, y);
    doc.setFontSize(10);
    doc.text(`Total caretakers: ${rows.length}`, 40, y + 16);

    doc.save("caretakers-report.pdf");
  };

  if (loading) {
    return (
      <div className="text-center mt-20 text-green-500 font-bold text-xl">
        Loading staff...
      </div>
    );
  }

  return (
    <div className="container mx-auto my-10 p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-green-500 text-center mb-8">
        Manage Staffs
      </h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-3 border rounded-lg shadow-sm"
          placeholder="Search by name, email, speciality"
        />
        <select
          value={doctorSpeciality}
          onChange={(e) => setDoctorSpeciality(e.target.value)}
          className="p-3 border rounded-lg shadow-sm"
        >
          <option value="">All Doctor Specialities</option>
          {uniqueDoctorSpecs.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={caretakerSpeciality}
          onChange={(e) => setCaretakerSpeciality(e.target.value)}
          className="p-3 border rounded-lg shadow-sm"
        >
          <option value="">All Caretaker Specialities</option>
          {uniqueCaretakerSpecs.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Doctors Section */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-semibold text-blue-700">Doctors</h3>
        <button
          onClick={() => downloadDoctorPDF(filteredDoctors)}
          className="px-4 py-2 rounded bg-gray-800 text-white"
        >
          Download Doctors PDF
        </button>
      </div>
      <div className="overflow-x-auto mb-10">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-blue-500 text-white uppercase text-sm font-semibold">
              <th className="p-3 rounded-tl-lg">Image</th>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Speciality</th>
              <th className="p-3">Degree</th>
              <th className="p-3">Experience</th>
              <th className="p-3">About</th>
              <th className="p-3">Address</th>
              <th className="p-3 rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDoctors.length > 0 ? (
              filteredDoctors.map((doc) => (
                <tr
                  key={doc._id}
                  className="text-center border-b border-gray-200 hover:bg-green-50"
                >
                  <td className="p-3">
                    <img
                      src={doc.image || "/placeholder-avatar.png"}
                      alt={doc.name || "Doctor"}
                      className="w-16 h-16 object-cover rounded-full mx-auto"
                    />
                  </td>
                  <td className="p-3">{doc.name}</td>
                  <td className="p-3">{doc.email}</td>
                  <td className="p-3">{doc.speciality}</td>
                  <td className="p-3">{doc.degree}</td>
                  <td className="p-3">
                    {doc.experience != null ? `${doc.experience} yrs` : "-"}
                  </td>
                  <td className="p-3">{doc.about}</td>
                  <td className="p-3">{doc.address}</td>
                  <td className="p-3 space-x-2">
                    <button
                      onClick={() => openEdit("doctor", doc)}
                      className="px-3 py-1 bg-blue-500 text-white rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteItem("doctor", doc._id)}
                      className="px-3 py-1 bg-red-500 text-white rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="text-center p-4 text-gray-500">
                  No doctors found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Caretakers Section */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-semibold text-green-700">Caretakers</h3>
        <button
          onClick={() => downloadCaretakerPDF(filteredCaretakers)}
          className="px-4 py-2 rounded bg-gray-800 text-white"
        >
          Download Caretakers PDF
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-green-500 text-white uppercase text-sm font-semibold">
              <th className="p-3 rounded-tl-lg">Image</th>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Speciality</th>
              <th className="p-3">Experience</th>
              <th className="p-3">About</th>
              <th className="p-3">Address</th>
              <th className="p-3 rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCaretakers.length > 0 ? (
              filteredCaretakers.map((ct) => (
                <tr
                  key={ct._id}
                  className="text-center border-b border-gray-200 hover:bg-green-50"
                >
                  <td className="p-3">
                    <img
                      src={ct.image || "/placeholder-avatar.png"}
                      alt={ct.name || "Caretaker"}
                      className="w-16 h-16 object-cover rounded-full mx-auto"
                    />
                  </td>
                  <td className="p-3">{ct.name}</td>
                  <td className="p-3">{ct.email}</td>
                  <td className="p-3">{ct.speciality}</td>
                  <td className="p-3">
                    {ct.experience != null ? `${ct.experience} yrs` : "-"}
                  </td>
                  <td className="p-3">{ct.about}</td>
                  <td className="p-3">{ct.address}</td>
                  <td className="p-3 space-x-2">
                    <button
                      onClick={() => openEdit("caretaker", ct)}
                      className="px-3 py-1 bg-blue-500 text-white rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteItem("caretaker", ct._id)}
                      className="px-3 py-1 bg-red-500 text-white rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center p-4 text-gray-500">
                  No caretakers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <h4 className="text-xl font-semibold mb-4">
              Edit {editType === "doctor" ? "Doctor" : "Caretaker"}
            </h4>
            <form
              onSubmit={submitEdit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <input
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
                className="p-2 border rounded"
                placeholder="Name"
              />
              <input
                name="email"
                value={editForm.email}
                onChange={handleEditChange}
                className="p-2 border rounded"
                placeholder="Email"
              />
              <input
                name="speciality"
                value={editForm.speciality}
                onChange={handleEditChange}
                className="p-2 border rounded"
                placeholder="Speciality"
              />
              {editType === "doctor" && (
                <input
                  name="degree"
                  value={editForm.degree}
                  onChange={handleEditChange}
                  className="p-2 border rounded"
                  placeholder="Degree"
                />
              )}
              <input
                name="experience"
                value={editForm.experience}
                onChange={handleEditChange}
                className="p-2 border rounded"
                placeholder="Experience"
              />
              <textarea
                name="about"
                value={editForm.about}
                onChange={handleEditChange}
                className="p-2 border rounded col-span-1 md:col-span-2"
                placeholder="About"
                rows={3}
              />
              <textarea
                name="address"
                value={editForm.address}
                onChange={handleEditChange}
                className="p-2 border rounded col-span-1 md:col-span-2"
                placeholder="Address"
                rows={3}
              />
              <div className="col-span-1 md:col-span-2">
                <input type="file" accept="image/*" onChange={handleEditImage} />
              </div>
              <div className="col-span-1 md:col-span-2 flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="px-4 py-2 rounded border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-green-600 text-white"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStaffs;
