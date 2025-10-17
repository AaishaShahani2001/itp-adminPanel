// frontend/src/pages/admin/InventoryManagement.js
import React from 'react';
import { Layout, Menu } from 'antd';
import { 
  DashboardOutlined, 
  ShoppingOutlined, 
  UserOutlined, 
  BarChartOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import InventoryList from '../../components/Inventory/InventoryList';

const { Header, Sider, Content } = Layout;

const InventoryManagement = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      key: '1',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/admin/dashboard')
    },
    {
      key: '2',
      icon: <ShoppingOutlined />,
      label: 'Inventory Management',
    },
    {
      key: '3',
      icon: <UserOutlined />,
      label: 'User Management',
    },
    {
      key: '4',
      icon: <BarChartOutlined />,
      label: 'Reports',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible>
        <div style={{ 
          height: 32, 
          margin: 16, 
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold'
        }}>
          PetPulse Admin
        </div>
        <Menu 
          theme="dark" 
          defaultSelectedKeys={['2']} 
          mode="inline" 
          items={menuItems} 
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: '#fff' }} />
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
          <InventoryList />
        </Content>
      </Layout>
    </Layout>
  );
};

export default InventoryManagement;