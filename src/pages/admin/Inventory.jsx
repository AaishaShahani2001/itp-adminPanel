// src/layouts/AdminLayout.jsx
import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';

const { Content, Header } = Layout;

const Inventory = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Layout */}
      <Layout>
        

        <Content style={{ margin: '16px', padding: '24px', background: '#dce5f4ff' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default Inventory;
