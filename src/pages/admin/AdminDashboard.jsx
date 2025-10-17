import React, { useEffect, useState } from 'react';
import { assets } from '../../assets/assets';
import Title from '../../components/Title';
import { useAdminContext } from '../../context/AdminContext';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { axios } = useAppContext();
  const { aToken } = useAdminContext();

  const [data, setData] = useState({
    totalPet: 0,
    totalAdoption: 0,
    pendingAdoption: 0,
    completedAdoption: 0,
    rejectedAdoption: 0,
    revenue_Adoption: 0
  });

  const [loading, setLoading] = useState(true);

  const dashboardCards = [
    { title: "Total Pets", value: data.totalPet, icon: assets.petIcon },
    { title: "Total Adoptions", value: data.totalAdoption, icon: assets.list },
    { title: "Pending Adoptions", value: data.pendingAdoption, icon: assets.add },
    { title: "Completed Adoptions", value: data.completedAdoption, icon: assets.list },
    { title: "Rejected Adoptions", value: data.rejectedAdoption, icon: assets.add },
    { title: "Revenue (Adoption)", value: `Rs. ${data.revenue_Adoption}`, icon: assets.dashboard }
  ];

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: response } = await axios.get('/api/admin/dashboard', {
        headers: { aToken }
      });

      if (response.success) {
        setData(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (aToken) {
      fetchDashboardData();
    }
  }, [aToken]);

  if (loading) return <div className="text-center mt-20">Loading dashboard...</div>;

  return (
    <div className='px-4 pt-10 md:px-10 flex-1'>
      <Title 
        title='Admin Dashboard' 
        subTitle='Monitor overall platform performance including total pets, adoptions, revenue, and recent activities' 
        align='left' 
      />

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-10 w-full">
        {dashboardCards.map((card, index) => {
          // Assign different background & text colors for each card
          const bgClasses = [
            "bg-blue-50 text-blue-700",
            "bg-green-50 text-green-700",
            "bg-yellow-50 text-yellow-700",
            "bg-purple-50 text-purple-700",
            "bg-red-50 text-red-700"
          ];

          return (
            <div
              key={index}
              className={`flex flex-col justify-between p-6 rounded-2xl shadow-lg transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${bgClasses[index % bgClasses.length]}`}
            >
              {/* Top: Title and Icon */}
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold">{card.title}</h1>
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/30">
                  <img src={card.icon} className="h-8 w-8" alt={card.title} />
                </div>
              </div>

              {/* Bottom: Value */}
              <div className="mt-6">
                <p className="text-4xl font-bold">{card.value}</p>
              </div>

              {/* Optional small description or trend */}
              {card.trend && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                  <img src={assets.arrowUp} alt="up" className="w-3 h-3" />
                  <span>{card.trend}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDashboard;
