// Test component to verify category API
import React, { useState, useEffect } from 'react';
import { Button, Card, List, message, Space } from 'antd';
import { getCategories, addCategory } from '../../services/api';

const CategoryTest = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      console.log('Categories from API:', data);
      setCategories(data);
      message.success(`Loaded ${data.length} categories`);
    } catch (error) {
      console.error('Error fetching categories:', error);
      message.error('Failed to fetch categories: ' + error.message);
    }
    setLoading(false);
  };

  const createTestCategory = async () => {
    try {
      await addCategory({ name: 'Test Category', subCategory: 'Test Sub' });
      message.success('Test category created');
      fetchCategories();
    } catch (error) {
      message.error('Failed to create test category: ' + error.message);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <Card title="Category API Test" style={{ margin: '20px' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button onClick={fetchCategories} loading={loading}>
          Fetch Categories
        </Button>
        <Button onClick={createTestCategory}>
          Create Test Category
        </Button>
        <div>
          <strong>Categories ({categories.length}):</strong>
          <List
            size="small"
            dataSource={categories}
            renderItem={(item) => (
              <List.Item>
                {item.name} {item.subCategory && `- ${item.subCategory}`}
              </List.Item>
            )}
          />
        </div>
      </Space>
    </Card>
  );
};

export default CategoryTest;
