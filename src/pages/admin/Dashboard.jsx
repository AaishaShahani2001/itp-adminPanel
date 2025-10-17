// src/pages/admin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, message } from 'antd';
import {
  ShoppingOutlined,
  WarningOutlined,
  TeamOutlined,
  TagOutlined,
} from '@ant-design/icons';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { getDashboardStats } from '../../services/api';

const { Title } = Typography;

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    totalSuppliers: 0,
    discountedProducts: 0,
    products: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        console.log('📊 Dashboard data:', data); // debug log
        setStats(data);
      } catch (err) {
        console.error('❌ Dashboard error:', err.response?.data || err.message);
        message.error('Failed to load dashboard stats');
      }
    };
    fetchStats();
  }, []);

  const COLORS = ['#3DED97', '#1890ff', '#ff7300', '#8884d8', '#ff4d4f'];

  // 📦 Inventory by Category
  const inventoryData = (stats.products || []).reduce((acc, item) => {
    const category = item.category || 'Other';
    const existing = acc.find((c) => c.category === category);
    if (existing) existing.value += 1;
    else acc.push({ category, value: 1 });
    return acc;
  }, []);

  // 📊 Stock Levels by Product
  const stockData = (stats.products || []).map((p) => ({
    name: p.name,
    quantity: p.quantity,
  }));

  // ⏳ Expiry Status
  const expiryData = (stats.products || []).reduce((acc, p) => {
    if (!p.expiryDate) return acc;
    const today = new Date();
    const expiry = new Date(p.expiryDate);

    let status = 'Fresh';
    if (expiry < today) status = 'Expired';
    else if (expiry <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
      status = 'Near Expiry';
    }

    const existing = acc.find((e) => e.status === status);
    if (existing) existing.value += 1;
    else acc.push({ status, value: 1 });
    return acc;
  }, []);

  return (
    <div>
      <Title level={2}>Admin Dashboard</Title>

      {/* Top Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Products"
              value={stats.totalProducts}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Low Stock Items"
              value={stats.lowStock}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Suppliers"
              value={stats.totalSuppliers}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Discounted Products"
              value={stats.discountedProducts}
              prefix={<TagOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={16}>
        <Col span={12}>
          <Card title="📦 Inventory Distribution">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={inventoryData}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                >
                  {inventoryData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="📊 Stock Levels by Product">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stockData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantity" fill="#1890ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="⏳ Product Expiry Status">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={expiryData}
                  dataKey="value"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                >
                  {expiryData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
