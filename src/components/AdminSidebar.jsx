// src/layouts/AdminSidebar.jsx
import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Sider } = Layout;

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { key: '/admin/manage-inventory/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/admin/manage-inventory/inventory', icon: <ShoppingOutlined />, label: 'Products' },
    { key: '/admin/manage-inventory/categories', icon: <AppstoreOutlined />, label: 'Categories' },
    { key: '/admin/manage-inventory/suppliers', icon: <TeamOutlined />, label: 'Suppliers' },
    { key: '/admin/manage-inventory/sales', icon: <ShoppingOutlined />, label: 'Sales' },
  ];

  const handleMenuClick = (e) => {
  
      navigate(e.key);
  };

  return (
    <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}
     style={{
          background:'#070754ff',
        }}>
      <div
        style={{
          height: 60,
          margin: 16,
          color: 'white',
          fontWeight: 'bold',
          fontSize: 16,
          textAlign: 'center',
          lineHeight: '28px',
        }}
      >
        Inventory<br />Management System
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          background:'#070754ff',
        }}
      />
      
      <style>
        {`
          .ant-menu-dark .ant-menu-item-selected {
            background-color: #1890ff !important;
          }
          .ant-menu-dark .ant-menu-item-selected a {
            color: #fff !important;
          }
        `}
      </style>
    </Sider>
  );
};

export default AdminSidebar;
