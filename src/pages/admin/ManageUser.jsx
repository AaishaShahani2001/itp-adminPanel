import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAdminContext } from "../../context/AdminContext";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ManageUser = () => {
  const {aToken} = useAdminContext();
  const [users, setUsers] = useState([]);
  const [dateFilter, setDateFilter] = useState("Newest");
  const [loading, setLoading] = useState(true);

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      const res = await axios.get("https://itp-backend-waw1.onrender.com/api/admin/get-user", {
        headers: {atoken: aToken},
      });
      if (res.data.success) {
        setUsers(res.data.users); // full user details
        console.log('Users fetched from database:', res.data.users);
      } else {
        console.error('Failed to fetch users:', res.data.message);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Sort by account creation date
  const sortedUsers = [...users].sort((a, b) => {
    if (dateFilter === "Newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
  });

  // Export users to PDF
  const exportUsersPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text("User Details Report", 40, 40);

    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 60);

    const body = sortedUsers.map((user) => [
      user.name || "-",
      user.email || "-",
      user.phone || "-",
      user.address || "-",
      user.gender || "-",
      user.birthday ? new Date(user.birthday).toLocaleDateString() : "-",
      user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-",
      user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "-"
    ]);

    autoTable(doc, {
      startY: 80,
      head: [["Name", "Email", "Phone", "Address", "Gender", "Birthday", "Created At", "Updated At"]],
      body,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3, valign: "middle" },
      headStyles: { fillColor: [37, 99, 235] },
      didDrawPage: () => {
        doc.setFontSize(9);
        doc.text(`Page ${doc.getNumberOfPages()}`, pageW - 60, doc.internal.pageSize.getHeight() - 20);
      },
    });

    let y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 100;
    doc.setFontSize(12);
    doc.text("Summary", 40, y);
    doc.setFontSize(10);
    y += 16;
    doc.text(`Total users: ${sortedUsers.length}`, 40, y);

    const maleUsers = sortedUsers.filter(u => u.gender === 'Male').length;
    const femaleUsers = sortedUsers.filter(u => u.gender === 'Female').length;
    const otherUsers = sortedUsers.length - maleUsers - femaleUsers;
    
    y += 14;
    doc.text(`Gender distribution: Male: ${maleUsers}, Female: ${femaleUsers}, Other: ${otherUsers}`, 40, y);

    const recentUsers = sortedUsers.filter(u => {
      const createdDate = new Date(u.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdDate > thirtyDaysAgo;
    }).length;
    
    y += 14;
    doc.text(`New users (last 30 days): ${recentUsers}`, 40, y);

    doc.save("user-details-report.pdf");
  };

  if (loading) {
    return (
      <div className="text-center mt-20 text-green-500 font-bold text-xl">
        Loading users...
      </div>
    );
  }

  return (
    <div className="container mx-auto my-10 p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-green-500 text-center mb-6">
        Manage Users
      </h2>

      {/* Filters and Actions */}
      <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
        {/* Download PDF Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportUsersPDF}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md shadow-lg transition duration-300 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </button>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <label className="font-semibold text-gray-700">Sort by Date:</label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-green-500 rounded-md px-3 py-1 outline-none cursor-pointer"
          >
            <option value="Newest">Newest First</option>
            <option value="Oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-green-500 text-white uppercase text-sm font-semibold">
              <th className="p-3 rounded-tl-lg">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Address</th>
              <th className="p-3">Gender</th>
              <th className="p-3">Birthday</th>
              <th className="p-3">Created At</th>
              <th className="p-3 rounded-tr-lg">Updated At</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.length > 0 ? (
              sortedUsers.map((user, index) => (
                <tr
                  key={index}
                  className="text-center border-b border-gray-200 hover:bg-green-50 transition duration-300"
                >
                  <td className="p-3 font-medium">{user.name || 'N/A'}</td>
                  <td className="p-3">{user.email || 'N/A'}</td>
                  <td className="p-3">{user.phone || 'N/A'}</td>
                  <td className="p-3">{user.address || 'N/A'}</td>
                  <td className="p-3">{user.gender || 'N/A'}</td>
                  <td className="p-3">
                    {user.birthday ? new Date(user.birthday).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-3">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-3">
                    {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center p-4 text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default ManageUser;