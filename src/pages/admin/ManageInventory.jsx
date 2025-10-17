//pages/admin/ManageInventory.jsx
import React from 'react';
import { Layout, Card, App } from 'antd';
import ProductList from '../../components/Inventory/ProductList';

const { Content } = Layout;

const ManageInventory = () => {
  return (
    <Content style={{ padding: '24px', background: '#fff', color: '#000' }}>
      <h1>Manage Inventory</h1>
      <Card>
        <App>
          <ProductList />
        </App>
      </Card>
    </Content>
  );
};

export default ManageInventory;
