import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  message,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Rate,
  Popconfirm,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  HomeOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  getSuppliers,
  addSupplier,
  updateSupplier,
  deleteSupplier,
  getCategories,
  getProducts,
} from '../../services/api';

const { Title } = Typography;
const { Option, OptGroup } = Select;

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [availableProducts, setAvailableProducts] = useState({});
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();

  /* ---------------------- Fetch Data ---------------------- */
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await getSuppliers();
      setSuppliers(data);
      setFilteredSuppliers(data);
    } catch (error) {
      message.error('Failed to fetch suppliers');
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      message.error('Failed to fetch categories');
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchCategories();
  }, []);

  /* ---------------------- Add / Update ---------------------- */
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (!Array.isArray(values.productCategories))
        values.productCategories = values.productCategories
          ? [values.productCategories]
          : [];
      if (!Array.isArray(values.productsSupplied))
        values.productsSupplied = values.productsSupplied
          ? [values.productsSupplied]
          : [];

      if (editingSupplier) {
        await updateSupplier(editingSupplier._id, values);
        message.success('Supplier updated successfully');
      } else {
        await addSupplier(values);
        message.success('Supplier added successfully');
      }

      setIsModalOpen(false);
      form.resetFields();
      setEditingSupplier(null);
      fetchSuppliers();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save supplier');
    }
  };

  /* ---------------------- Delete ---------------------- */
  const handleDelete = async (id) => {
    try {
      await deleteSupplier(id);
      message.success('Supplier deleted');
      fetchSuppliers();
    } catch (error) {
      message.error('Failed to delete supplier');
    }
  };

  /* ---------------------- Search by Product ---------------------- */
  const handleSearch = (value) => {
  setSearchTerm(value);

  if (!value.trim()) {
    setFilteredSuppliers(suppliers);
    return;
  }

  const search = value.toLowerCase();

    const filtered = suppliers.filter((supplier) => {
    const inName = supplier.supplierName?.toLowerCase().includes(search);
    const inContact = supplier.contactPerson?.toLowerCase().includes(search);
    const inCategory = supplier.productCategories?.some((cat) =>
      cat.toLowerCase().includes(search)
    );
    const inProducts = supplier.productsSupplied?.some((prod) =>
      prod.toLowerCase().includes(search)
    );

    return inName || inContact || inCategory || inProducts;
  });

  setFilteredSuppliers(filtered);
};

  /* ---------------------- Fetch Products by Category ---------------------- */
  const fetchProductsByCategory = async (selectedCategories) => {
    if (!selectedCategories.length) {
      setAvailableProducts({});
      return;
    }

    setLoadingProducts(true);
    const categoryToProducts = {};

    try {
      for (const cat of selectedCategories) {
        const products = await getProducts({ category: cat });
        categoryToProducts[cat] = products.map((p) => ({
          id: p._id,
          name: p.name,
        }));
      }
      setAvailableProducts(categoryToProducts);
    } catch (error) {
      message.error('Failed to fetch products');
    } finally {
      setLoadingProducts(false);
    }
  };

  /* ---------------------- Table Columns ---------------------- */
  const columns = [
    {
      title: 'Supplier Name',
      dataIndex: 'supplierName',
      key: 'supplierName',
      render: (supplierName) => (
        <>
          <UserOutlined style={{ marginRight: 8 }} />
          {supplierName || '—'}
        </>
      ),
    },
    {
      title: 'Contact Person',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      render: (contactPerson) => contactPerson || '—',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => (
        <>
          <MailOutlined style={{ marginRight: 8 }} />
          {email || '—'}
        </>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => (
        <>
          <PhoneOutlined style={{ marginRight: 8 }} />
          {phone || '—'}
        </>
      ),
    },
    {
      title: 'Product Categories',
      dataIndex: 'productCategories',
      key: 'productCategories',
      render: (categories) =>
        categories && categories.length > 0
          ? categories.map((c, i) => <Tag color="purple" key={i}>{c}</Tag>)
          : '—',
    },
    {
      title: 'Products Supplied',
      dataIndex: 'productsSupplied',
      key: 'productsSupplied',
      render: (products) =>
        products && products.length > 0
          ? products.map((p, i) => <Tag color="blue" key={i}>{p}</Tag>)
          : '—',
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => <Rate disabled value={rating || 0} />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status?.toLowerCase() === 'active' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            onClick={() => {
              setEditingSupplier(record);
              form.setFieldsValue(record);
              setIsModalOpen(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this supplier?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes, Delete"
            cancelText="Cancel"
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  /* ---------------------- Render ---------------------- */
  return (
    <div>
      <Title level={2}>Supplier Management</Title>

      {/* 🔍 Search Bar */}
      <Input
        prefix={<SearchOutlined />}
        placeholder="Search suppliers by product supplied..."
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        style={{ width: 350, marginBottom: 16 }}
        allowClear
      />

      <Card
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingSupplier(null);
              form.resetFields();
              setIsModalOpen(true);
            }}
          >
            Add Supplier
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredSuppliers}
          loading={loading}
          rowKey="_id"
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Add / Edit Supplier Modal */}
      <Modal
        title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSave}
        okText={editingSupplier ? 'Update' : 'Add'}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="supplierName"
            label="Supplier Name"
            rules={[{ required: true, message: 'Please enter supplier name' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Enter supplier name" />
          </Form.Item>

          <Form.Item
            name="contactPerson"
            label="Contact Person"
            rules={[{ required: true, message: 'Please enter contact person' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Enter contact person" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Enter valid email' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Enter email" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone"
            rules={[
              { required: true, message: 'Please enter phone number' },
              {
                pattern: /^[0-9+\-()\s]{7,20}$/,
                message:
                  'Phone must be 7–20 digits (numbers or + - ( ) allowed)',
              },
            ]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="Enter phone number" />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: 'Please enter address' }]}
          >
            <Input prefix={<HomeOutlined />} placeholder="Enter address" />
          </Form.Item>

          <Form.Item name="city" label="City">
            <Input prefix={<EnvironmentOutlined />} placeholder="Enter city" />
          </Form.Item>

          <Form.Item name="country" label="Country">
            <Input prefix={<GlobalOutlined />} placeholder="Enter country" />
          </Form.Item>

          {/* 🟣 Product Categories Dropdown */}
          <Form.Item
            name="productCategories"
            label="Product Category"
            rules={[{ required: true, message: 'Please select at least one category' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select product categories"
              style={{ width: '100%' }}
              onChange={(selected) => fetchProductsByCategory(selected)}
            >
              {categories.map((cat) => (
                <Option key={cat._id} value={cat.name}>
                  {cat.subCategory ? `${cat.name} (${cat.subCategory})` : cat.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* 🔵 Products Supplied (Grouped by Category) */}
          <Form.Item
            name="productsSupplied"
            label="Products Supplied"
            rules={[{ required: true, message: 'Please select at least one product' }]}
          >
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder={
                Object.keys(availableProducts).length
                  ? 'Select products supplied'
                  : 'Select category first'
              }
              disabled={!Object.keys(availableProducts).length}
              loading={loadingProducts}
            >
              {Object.entries(availableProducts).map(([catName, products]) => (
                <OptGroup key={catName} label={catName}>
                  {products.map((p) => (
                    <Option key={p.id} value={p.name}>
                      {p.name}
                    </Option>
                  ))}
                </OptGroup>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="gstNumber"
            label="GST Number"
            rules={[
              {
                pattern: /^[A-Za-z0-9-]{5,20}$/,
                message:
                  'Please enter a valid GST / Tax number (5–20 characters)',
              },
            ]}
          >
            <Input prefix={<IdcardOutlined />} placeholder="Enter GST / Tax number" />
          </Form.Item>

          <Form.Item
            name="paymentTerms"
            label="Payment Terms"
            initialValue="Advance Payment"
            rules={[{ required: true, message: 'Please select payment terms' }]}
          >
            <Select>
              <Option value="Advance Payment">Advance Payment</Option>
              <Option value="Net 30 Days">Net 30 Days</Option>
              <Option value="Net 60 Days">Net 60 Days</Option>
              <Option value="Cash on Delivery">Cash on Delivery</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="rating"
            label="Rating"
            initialValue={3}
            rules={[{ type: 'number', min: 1, max: 5 }]}
          >
            <Rate />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            initialValue="Active"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select>
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
            </Select>
          </Form.Item>
        </Form>

        {loadingProducts && (
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <Spin size="small" /> Loading products...
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Suppliers;
