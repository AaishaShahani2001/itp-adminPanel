// src/pages/admin/Products.jsx
import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Image,
  Input,
  Select,
  Row,
  Col,
  Modal,
  Descriptions,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeOutlined,
  ExclamationCircleFilled,
  WarningOutlined,
} from '@ant-design/icons';
import { getProducts, deleteProduct } from '../../services/api';
import AddProduct from '../../components/Inventory/AddProduct';
import EditProduct from '../../components/Inventory/EditProduct';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { confirm } = Modal;

const CATEGORY_OPTIONS = ['All', 'Food', 'Toys', 'Medication', 'Accessories', 'Grooming', 'Other'];

const Products = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    category: 'All',
    stockStatus: 'all',
    nearExpiryOnly: false,
    expiredOnly: false, // show expired or ≤5 days
  });

  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, [filters]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.category !== 'All') params.category = filters.category;
      if (filters.stockStatus !== 'all') params.stockStatus = filters.stockStatus;
      if (filters.nearExpiryOnly) params.expiryStatus = 'near';
      if (filters.expiredOnly) params.expiryStatus = 'expired';
      const data = await getProducts(params);
      setProducts(data);
    } catch (e) {
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      category: 'All',
      stockStatus: 'all',
      nearExpiryOnly: false,
      expiredOnly: false,
    });
  };

  const handleDelete = (id, name) => {
    confirm({
      title: 'Are you sure you want to delete this product?',
      icon: <ExclamationCircleFilled style={{ color: '#ff4d4f' }} />,
      content: `Product: ${name}`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      async onOk() {
        try {
          await deleteProduct(id);
          message.success('Product deleted');
          fetchProducts();
        } catch (e) {
          message.error(e?.response?.data?.message || 'Delete failed');
        }
      },
    });
  };

  const columns = [
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      width: 90,
      render: (src) =>
        src ? (
          <Image
            src={src}
            alt="Product"
            width={56}
            height={56}
            style={{ objectFit: 'cover', borderRadius: 6 }}
            preview={false}
          />
        ) : (
          <div
            style={{
              width: 56,
              height: 56,
              background: '#f3f3f3',
              color: '#999',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
            }}
          >
            No Image
          </div>
        ),
    },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    {
      title: 'Sub Category',
      dataIndex: 'subCategory',
      key: 'subCategory',
      render: (val) => val || '—',
    },
    {
      title: 'Price (LKR)',
      dataIndex: 'price',
      key: 'price',
      render: (p) => `Rs. ${(p ?? 0).toFixed(2)}`,
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (qty, record) => (
        <Tag color={qty <= (record.lowStockThreshold ?? 10) ? 'red' : 'green'}>
          {qty}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const low = record.quantity <= (record.lowStockThreshold ?? 10);
        return <Tag color={low ? 'red' : 'green'}>{low ? 'Low Stock' : 'In Stock'}</Tag>;
      },
    },
    {
      title: 'Expiry',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (d) => (d ? new Date(d).toLocaleDateString() : '—'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelected(record);
              setViewOpen(true);
            }}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            style={{ background: '#3DED97', borderColor: '#3DED97', color: '#000' }}
            onClick={() => {
              setEditingProduct(record);
              setEditModalOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="small"
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record._id, record.name)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ background: 'white' }}>
      <Title level={2} style={{ color: 'black', marginBottom: 16 }}>
        Inventory Management
      </Title>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={8}>
            <Search
              placeholder="Search by name or ID"
              allowClear
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              onSearch={() => fetchProducts()}
            />
          </Col>
          <Col xs={12} md={6}>
            <Select
              value={filters.category}
              onChange={(v) => setFilters((f) => ({ ...f, category: v }))}
              style={{ width: '100%' }}
            >
              {CATEGORY_OPTIONS.map((c) => (
                <Option key={c} value={c}>
                  {c}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} md={6}>
            <Select
              value={filters.stockStatus}
              onChange={(v) => setFilters((f) => ({ ...f, stockStatus: v }))}
              style={{ width: '100%' }}
            >
              <Option value="all">All Stock</Option>
              <Option value="low">Low Stock</Option>
              <Option value="adequate">Adequate</Option>
            </Select>
          </Col>
          <Col xs={24} md="auto">
            <Space wrap>
              <Button icon={<ReloadOutlined />} onClick={fetchProducts} style={{ color: '#000' }}>
                Refresh
              </Button>
              <Button onClick={resetFilters}>Reset</Button>

              {/* Near Expiry (6–30 days) */}
              <Button
                type={filters.nearExpiryOnly ? 'primary' : 'default'}
                icon={<WarningOutlined />}
                danger={filters.nearExpiryOnly}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    nearExpiryOnly: !f.nearExpiryOnly,
                    expiredOnly: false,
                  }))
                }
              >
                {filters.nearExpiryOnly ? 'Showing 6–30 Days' : 'Near Expiry (6–30 Days)'}
              </Button>

              {/* Expired or ≤5 days */}
              <Button
                type={filters.expiredOnly ? 'primary' : 'default'}
                icon={<WarningOutlined />}
                danger={filters.expiredOnly}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    expiredOnly: !f.expiredOnly,
                    nearExpiryOnly: false,
                  }))
                }
              >
                {filters.expiredOnly ? 'Showing Expired ≤5 Days' : 'Expired ≤5 Days'}
              </Button>

              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{ background: '#3DED97', borderColor: '#3DED97', color: '#000' }}
                onClick={() => setAddModalOpen(true)}
              >
                Add Product
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card title={<Text strong>Product List</Text>}>
        <Table
          rowKey="_id"
          loading={loading}
          dataSource={products}
          columns={columns}
          pagination={{ pageSize: 10 }}
          rowClassName={(record) => {
            if (record.expiryDate) {
              const expiry = new Date(record.expiryDate);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

              if (diffDays < 0) return 'expired';      // already expired → black
              if (diffDays <= 5) return 'near-expiry'; // 0–5 days → red
              if (diffDays <= 30) return 'warn-expiry';// 6–30 days → amber
            }
            return '';
          }}
        />
      </Card>

      {/* View Modal */}
      <Modal
        title="Product Details"
        open={viewOpen}
        onCancel={() => {
          setSelected(null);
          setViewOpen(false);
        }}
        footer={<Button onClick={() => setViewOpen(false)}>Close</Button>}
        width={720}
      >
        {selected && (
          <Row gutter={16}>
            <Col xs={24} md={10} style={{ textAlign: 'center' }}>
              {selected.image ? (
                <Image
                  src={selected.image}
                  alt={selected.name}
                  width="100%"
                  style={{ maxWidth: 280, borderRadius: 8, objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: 240,
                    maxWidth: 280,
                    margin: '0 auto',
                    background: '#f3f3f3',
                    color: '#999',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  No Image
                </div>
              )}
            </Col>
            <Col xs={24} md={14}>
              <Descriptions bordered column={1} size="middle">
                <Descriptions.Item label="Name">{selected.name}</Descriptions.Item>
                <Descriptions.Item label="Category">{selected.category}</Descriptions.Item>
                <Descriptions.Item label="Sub Category">
                  {selected.subCategory || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Price">
                  Rs. {(selected.price ?? 0).toFixed(2)}
                </Descriptions.Item>
                <Descriptions.Item label="Quantity">{selected.quantity}</Descriptions.Item>
                <Descriptions.Item label="Expiry">
                  {selected.expiryDate ? new Date(selected.expiryDate).toLocaleDateString() : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Description">
                  {selected.description || '—'}
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>
        )}
      </Modal>

      {/* Add Modal */}
      <AddProduct
        visible={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        onSuccess={() => {
          setAddModalOpen(false);
          fetchProducts();
        }}
      />

      {/* Edit Modal */}
      <EditProduct
        visible={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onSuccess={() => {
          setEditModalOpen(false);
          fetchProducts();
        }}
        product={editingProduct}
      />

      {/* Inline CSS */}
      <style>{`
        .near-expiry {
          background-color: #ffe6e6 !important;
          color: #b71c1c !important;
        }
        .expired {
          background-color: #000 !important;
          color: #fff !important;
        }
        .warn-expiry {
          background-color: #fff3cd !important;
          color: #856404 !important;
        }
      `}</style>
    </div>
  );
};

export default Products;
