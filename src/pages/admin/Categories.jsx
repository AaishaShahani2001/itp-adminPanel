// src/pages/admin/Categories.jsx
import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Popconfirm } from 'antd';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../../services/api';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      message.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingCategory) {
        await updateCategory(editingCategory._id, values);
        message.success('Category updated');
      } else {
        await addCategory(values);
        message.success('Category added');
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCategory(id);
      message.success('Category deleted');
      fetchCategories();
    } catch (err) {
      message.error('Failed to delete category');
    }
  };

  const columns = [
    { title: 'Category Name', dataIndex: 'name', key: 'name' },
    { title: 'Sub Category', dataIndex: 'subCategory', key: 'subCategory', render: (val) => val || '—' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            onClick={() => {
              setEditingCategory(record);
              form.setFieldsValue(record);
              setIsModalOpen(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this category?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
         <h2 style={{ marginBottom: 16 }}>Categories</h2>

      <Button
        type="primary"
        onClick={() => {
          setEditingCategory(null);
          form.resetFields();
          setIsModalOpen(true);
        }}
        style={{ marginBottom: 16 }}
      >
        Add Category
      </Button>

      <Table
        rowKey="_id"
        loading={loading}
        columns={columns}
        dataSource={categories}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSave}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: 'Please enter category name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
      name="subCategory"
      label="Sub Category"
    >
      <Input placeholder="Optional sub category" />
    </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Categories;
