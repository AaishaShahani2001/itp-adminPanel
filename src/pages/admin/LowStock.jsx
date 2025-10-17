// src/pages/Admin/LowStock.jsx
import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Button, Typography, message, Space } from 'antd';
import { WarningOutlined, PlusOutlined } from '@ant-design/icons';
import { getProducts } from '../../services/api';

const { Title, Text } = Typography;

const LowStock = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLowStockProducts();
  }, []);

  const fetchLowStockProducts = async () => {
    setLoading(true);
    try {
      const allProducts = await getProducts();
      const lowStockProducts = allProducts.filter(product => 
        product.quantity <= product.lowStockThreshold
      );
      setProducts(lowStockProducts);
    } catch (error) {
      message.error('Failed to fetch low stock products');
    }
    setLoading(false);
  };

  const handleRestock = (productId) => {
    message.info(`Restock functionality for product ${productId} would be implemented here`);
    // This would open a modal to add stock quantity
  };

  const columns = [
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Current Stock',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity, record) => (
        <Tag color={quantity === 0 ? 'red' : 'orange'}>
          {quantity} units
        </Tag>
      )
    },
    {
      title: 'Threshold',
      dataIndex: 'lowStockThreshold',
      key: 'lowStockThreshold',
      render: (threshold) => `${threshold} units`
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.quantity === 0 ? 'red' : 'orange'}>
          {record.quantity === 0 ? 'OUT OF STOCK' : 'LOW STOCK'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          style={{ backgroundColor: '#3DED97', borderColor: '#3DED97' }}
          onClick={() => handleRestock(record._id)}
        >
          Restock
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: 'white', minHeight: '100vh' }}>
      <Title level={2} style={{ color: 'black', marginBottom: '24px' }}>
        <WarningOutlined style={{ color: '#faad14', marginRight: '12px' }} />
        Low Stock Alert
      </Title>
      
      <Card>
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Text type="success" style={{ fontSize: '16px' }}>
              🎉 No low stock items! All products are adequately stocked.
            </Text>
          </div>
        ) : (
          <>
            <Text type="warning" style={{ marginBottom: '16px', display: 'block' }}>
              ⚠️ {products.length} product(s) are low in stock or out of stock
            </Text>
            
            <Table 
              columns={columns} 
              dataSource={products} 
              loading={loading}
              rowKey="_id"
              pagination={{ pageSize: 10 }}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default LowStock;