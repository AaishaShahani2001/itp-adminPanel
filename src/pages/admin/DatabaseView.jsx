// src/pages/Admin/DatabaseView.jsx
import React, { useState, useEffect } from 'react';
import { Card, Table, message, Tabs } from 'antd';
import { getProducts } from '../../services/api';

const { TabPane } = Tabs;

const DatabaseView = () => {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // For now, just fetch products. You'd need a users API endpoint
      const productsData = await getProducts();
      setProducts(productsData);
    } catch (error) {
      message.error('Failed to fetch data');
    }
    setLoading(false);
  };

  const userColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    { title: 'ID', dataIndex: '_id', key: '_id' },
  ];

  const productColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Price', dataIndex: 'price', key: 'price', render: price => `$${price}` },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
    { title: 'ID', dataIndex: '_id', key: '_id' },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1>Database Viewer</h1>
      <Card>
        <Tabs defaultActiveKey="products">
          <TabPane tab="Products" key="products">
            <Table 
              columns={productColumns} 
              dataSource={products} 
              loading={loading}
              rowKey="_id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab="Users" key="users">
            <Table 
              columns={userColumns} 
              dataSource={users} 
              loading={loading}
              rowKey="_id"
              pagination={{ pageSize: 10 }}
            />
            <p>Note: Add a users API endpoint to see real data here</p>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default DatabaseView;