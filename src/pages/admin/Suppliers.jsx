// src/pages/admin/Suppliers.jsx
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, message, Typography, Tag, Modal, Form, Input, Select } from 'antd';
import { PlusOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier } from '../../services/api';
import { Popconfirm } from "antd";

const { Title } = Typography;

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form] = Form.useForm();

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (error) {
      message.error('Failed to fetch suppliers');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingSupplier) {
        await updateSupplier(editingSupplier._id, values);
        message.success('Supplier updated');
      } else {
        await addSupplier(values);
        message.success('Supplier added');
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingSupplier(null);
      fetchSuppliers();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save supplier');
    }
  };

  const columns = [
    { title: 'Supplier Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => (<><MailOutlined style={{ marginRight: 8 }} />{email}</>)
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => (<><PhoneOutlined style={{ marginRight: 8 }} />{phone}</>)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={status === 'active' ? 'green' : 'red'}>{status.toUpperCase()}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button onClick={() => {
            setEditingSupplier(record);
            form.setFieldsValue(record);
            setIsModalOpen(true);
          }}>Edit</Button>
           {/* ✅ Delete with confirmation */}
        <Popconfirm
          title="Are you sure you want to delete this supplier?"
          description={`This action will remove ${record.name}`}
          okText="Yes, Delete"
          cancelText="Cancel"
          onConfirm={() => {
            deleteSupplier(record._id)
              .then(() => {
                message.success("Supplier deleted");
                fetchSuppliers();
              })
              .catch(() => message.error("Failed to delete supplier"));
          }}
        >
          <Button danger>Delete</Button>
        </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>Suppliers</Title>
      <Card
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingSupplier(null); form.resetFields(); setIsModalOpen(true); }}>
            Add Supplier
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={suppliers}
          loading={loading}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Modal for Add/Edit */}
      <Modal
        title={editingSupplier ? "Edit Supplier" : "Add Supplier"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSave}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Supplier Name" rules={[{ required: true, message: 'Please enter name' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Please enter email' }, { type: 'email', message: 'Enter valid email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true, message: 'Please enter phone number' },{ pattern: /^[0-9]{10}$/, message: 'Phone must be 10 digits' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="active">
            <Select>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Suppliers;
