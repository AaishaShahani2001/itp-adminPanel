// src/components/Inventory/ProductList.jsx
import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  message,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Modal,
  Image,
  Input,
  Select,
  DatePicker,
  Tooltip,
  Popconfirm,
  Badge,
  Divider,
  Typography,
  Alert,
  App,
} from 'antd';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ExclamationCircleFilled,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  WarningOutlined,
  DollarOutlined,
  StockOutlined,
  CalendarOutlined,
  SettingOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { getProducts, deleteProduct, updateStock, setProductDiscount, getNearExpiryProducts, getCategories } from '../../services/api';
import AddProduct from './AddProduct';
import EditProduct from './EditProduct';
import dayjs from 'dayjs';

const { confirm } = Modal;

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const ProductList = () => {
  const { modal } = App.useApp();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ 
    total: 0, 
    lowStock: 0, 
    outOfStock: 0, 
    nearExpiry: 0,
    totalValue: 0 
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('');
  const [expiryStatusFilter, setExpiryStatusFilter] = useState('');
  
  // Categories state
  const [categories, setCategories] = useState([]);
  
  // Stock management states
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [discountModalVisible, setDiscountModalVisible] = useState(false);
  const [selectedProductForAction, setSelectedProductForAction] = useState(null);
  const [stockOperation, setStockOperation] = useState({ operation: 'add', quantity: 0 });
  const [discountData, setDiscountData] = useState({ discount: 0 });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      console.log('Fetched categories:', data);
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      message.error('Failed to load categories - using fallback categories');
      // Set some default categories as fallback
      setCategories([
        { _id: '1', name: 'Food' },
        { _id: '2', name: 'Medication' },
        { _id: '3', name: 'Accessories' },
        { _id: '4', name: 'Toys' },
        { _id: '5', name: 'Grooming' }
      ]);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        search: searchText,
        category: categoryFilter,
        stockStatus: stockStatusFilter,
        expiryStatus: expiryStatusFilter,
      };
      
      const data = await getProducts(params);
      setProducts(data);
      setFilteredProducts(data);

      // Calculate enhanced stats
      const total = data.length;
      const lowStock = data.filter(
        (product) => product.quantity <= product.lowStockThreshold
      ).length;
      const outOfStock = data.filter((product) => product.quantity === 0).length;
      
      // Calculate near expiry (within 30 days)
      const today = dayjs();
      const nearExpiry = data.filter((product) => {
        if (!product.expiryDate) return false;
        const expiryDate = dayjs(product.expiryDate);
        return expiryDate.diff(today, 'days') <= 30 && expiryDate.diff(today, 'days') >= 0;
      }).length;
      
      // Calculate total inventory value
      const totalValue = data.reduce((sum, product) => {
        const price = product.discountPrice || product.price;
        return sum + (price * product.quantity);
      }, 0);

      setStats({ total, lowStock, outOfStock, nearExpiry, totalValue });
    } catch (error) {
      message.error('Failed to fetch products');
    }
    setLoading(false);
  };

  // Apply filters
  useEffect(() => {
    fetchProducts();
  }, [searchText, categoryFilter, stockStatusFilter, expiryStatusFilter]);

  const showDeleteConfirm = (product) => {
    console.log('Delete confirmation for product:', product);
    modal.confirm({
      title: 'Are you sure you want to delete this product?',
      icon: <ExclamationCircleFilled style={{ color: '#ff4d4f' }} />,
      content: `Product: ${product.name}`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        console.log('Delete confirmed for product ID:', product._id);
        handleDelete(product._id);
      },
    });
  };

  const handleDelete = async (id) => {
    try {
      console.log('Attempting to delete product with ID:', id);
      const result = await deleteProduct(id);
      console.log('Delete API response:', result);
      message.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Delete error:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete product';
      message.error(errorMessage);
    }
  };

  const handleView = (product) => {
    setSelectedProduct(product);
    setViewModalVisible(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setEditModalVisible(true);
  };

  const handleCloseModals = () => {
    setViewModalVisible(false);
    setEditModalVisible(false);
    setStockModalVisible(false);
    setDiscountModalVisible(false);
    setSelectedProduct(null);
    setEditingProduct(null);
    setSelectedProductForAction(null);
  };

  // Stock management handlers
  const handleStockUpdate = (product) => {
    setSelectedProductForAction(product);
    setStockOperation({ operation: 'add', quantity: 0 });
    setStockModalVisible(true);
  };

  const handleStockSubmit = async () => {
    try {
      await updateStock(
        selectedProductForAction._id,
        stockOperation.operation,
        stockOperation.quantity
      );
      message.success('Stock updated successfully');
      setStockModalVisible(false);
      fetchProducts();
    } catch (error) {
      message.error('Failed to update stock');
    }
  };

  // Discount management handlers
  const handleDiscountUpdate = (product) => {
    setSelectedProductForAction(product);
    setDiscountData({ discount: product.manualDiscountPercent || 0 });
    setDiscountModalVisible(true);
  };

  const handleDiscountSubmit = async () => {
    try {
      await setProductDiscount(selectedProductForAction._id, discountData.discount);
      message.success('Discount updated successfully');
      setDiscountModalVisible(false);
      fetchProducts();
    } catch (error) {
      message.error('Failed to update discount');
    }
  };

  // PDF Export function
  const exportProductsPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(18);
    doc.text("Product Inventory Summary", 40, 40);

    // Generated date
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 60);

    // Build rows
    const body = products.map((product) => [
      product.name || "-",
      product.category || "-",
      product.subCategory || "-",
      `Rs. ${product.price || 0}`,
      product.discountPrice ? `Rs. ${product.discountPrice}` : "-",
      product.quantity || 0,
      product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : "-",
      product.isActive ? "Active" : "Inactive"
    ]);

    autoTable(doc, {
      startY: 80,
      head: [["Product Name", "Category", "Sub Category", "Price", "Discount Price", "Stock", "Expiry Date", "Status"]],
      body,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 4, valign: "middle" },
      headStyles: { fillColor: [37, 99, 235] },
      didDrawPage: () => {
        doc.setFontSize(9);
        doc.text(`Page ${doc.getNumberOfPages()}`, pageW - 60, doc.internal.pageSize.getHeight() - 20);
      },
    });

    // Summary block
    let y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 100;
    doc.setFontSize(12);
    doc.text("Summary", 40, y);
    doc.setFontSize(10);
    y += 16;
    doc.text(`Total products: ${products.length}`, 40, y);

    const activeProducts = products.filter(p => p.isActive).length;
    const inactiveProducts = products.length - activeProducts;
    const lowStockProducts = products.filter(p => p.quantity <= (p.lowStockThreshold || 10)).length;
    const expiredProducts = products.filter(p => p.expiryDate && new Date(p.expiryDate) < new Date()).length;

    y += 14;
    doc.text(`Active: ${activeProducts}, Inactive: ${inactiveProducts}`, 40, y);
    y += 14;
    doc.text(`Low Stock: ${lowStockProducts}, Expired: ${expiredProducts}`, 40, y);

    const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    y += 14;
    doc.text(`Total Inventory Value: Rs. ${totalValue.toLocaleString()}`, 40, y);

    doc.save("product-inventory-summary.pdf");
  };

  // Filter handlers
  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleCategoryFilter = (value) => {
    setCategoryFilter(value);
  };

  const handleStockStatusFilter = (value) => {
    setStockStatusFilter(value);
  };

  const handleExpiryStatusFilter = (value) => {
    setExpiryStatusFilter(value);
  };

  const clearFilters = () => {
    setSearchText('');
    setCategoryFilter('');
    setStockStatusFilter('');
    setExpiryStatusFilter('');
  };


  const columns = [
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      render: (image) =>
        image ? (
          <Image
            src={image}
            alt="Product"
            width={50}
            height={50}
            style={{ objectFit: 'cover', borderRadius: '4px' }}
            preview={false}
          />
        ) : (
          <div
            style={{
              width: '50px',
              height: '50px',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#999',
            }}
          >
            No Image
          </div>
        ),
    },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    {
      title: 'Price (LKR)',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `Rs. ${price?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity, record) => (
        <Tag color={quantity <= record.lowStockThreshold ? 'red' : 'green'}>
          {quantity}
        </Tag>
      ),
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date) =>
        date ? new Date(date).toLocaleDateString() : 'N/A',
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag
          color={
            record.quantity <= record.lowStockThreshold ? 'red' : 'green'
          }
        >
          {record.quantity <= record.lowStockThreshold
            ? 'Low Stock'
            : 'In Stock'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space wrap>
          <Tooltip title="View Details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="Edit Product">
            <Button
              size="small"
              icon={<EditOutlined />}
              type="primary"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Update Stock">
            <Button
              size="small"
              icon={<StockOutlined />}
              onClick={() => handleStockUpdate(record)}
            />
          </Tooltip>
          <Tooltip title="Set Discount">
            <Button
              size="small"
              icon={<DollarOutlined />}
              onClick={() => handleDiscountUpdate(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Product">
            <Button
              size="small"
              icon={<DeleteOutlined />}
              danger
              onClick={() => {
                console.log('Delete button clicked for product:', record);
                showDeleteConfirm(record);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header with Title */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Product Inventory Management</Title>
        <Text type="secondary">
          Manage your product inventory with advanced filtering, stock management, and discount controls.
        </Text>
      </div>

      {/* Alerts for Critical Issues */}
      {stats.nearExpiry > 0 && (
        <Alert
          message={`${stats.nearExpiry} products are expiring within 30 days`}
          type="warning"
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={() => setExpiryStatusFilter('near')}>
              View Near Expiry
            </Button>
          }
        />
      )}

      {stats.lowStock > 0 && (
        <Alert
          message={`${stats.lowStock} products are running low on stock`}
          type="info"
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={() => setStockStatusFilter('low')}>
              View Low Stock
            </Button>
          }
        />
      )}

      {/* Enhanced Statistics Row */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="Total Products"
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
              prefix={<StockOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Low Stock"
              value={stats.lowStock}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Out of Stock"
              value={stats.outOfStock}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<ExclamationCircleFilled />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Near Expiry"
              value={stats.nearExpiry}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Total Value"
              value={stats.totalValue}
              valueStyle={{ color: '#52c41a' }}
              prefix="Rs."
              precision={2}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
              style={{ width: '100%', height: '100%' }}
            >
              Add Product
            </Button>
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Button
              type="default"
              icon={<FileTextOutlined />}
              onClick={exportProductsPDF}
              style={{ width: '100%', height: '100%' }}
            >
              Download PDF
            </Button>
          </Card>
        </Col>
      </Row>

      {/* Advanced Filters */}
      <Card title="Filters & Search" style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Search
              placeholder="Search products..."
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Category"
              allowClear
              style={{ width: '100%' }}
              onChange={handleCategoryFilter}
              value={categoryFilter}
              loading={categories.length === 0}
              notFoundContent={categories.length === 0 ? "No categories found" : "No categories"}
            >
              {categories.map((category) => (
                <Option key={category._id || category.name} value={category.name}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Stock Status"
              allowClear
              style={{ width: '100%' }}
              onChange={handleStockStatusFilter}
              value={stockStatusFilter}
            >
              <Option value="low">Low Stock</Option>
              <Option value="adequate">Adequate Stock</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Expiry Status"
              allowClear
              style={{ width: '100%' }}
              onChange={handleExpiryStatusFilter}
              value={expiryStatusFilter}
            >
              <Option value="near">Near Expiry</Option>
              <Option value="expired">Expired</Option>
            </Select>
          </Col>
          <Col span={3}>
            <Button
              icon={<ReloadOutlined />}
              onClick={clearFilters}
              style={{ width: '100%' }}
            >
              Clear
            </Button>
          </Col>
          <Col span={2}>
            <Button
              icon={<FilterOutlined />}
              onClick={fetchProducts}
              style={{ width: '100%' }}
            >
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Products Table */}
      <Card title="Product Inventory">
        <Table
          columns={columns}
          dataSource={filteredProducts}
          loading={loading}
          rowKey="_id"
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} products`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Add Product Modal */}
      <AddProduct
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onSuccess={() => {
          setIsModalVisible(false);
          fetchProducts();
        }}
      />

      {/* Edit Product Modal */}
      <EditProduct
        visible={editModalVisible}
        onCancel={handleCloseModals}
        onSuccess={() => {
          handleCloseModals();
          fetchProducts();
        }}
        product={editingProduct}
      />

      {/* View Product Modal */}
      <Modal
        title="Product Details"
        open={viewModalVisible}
        onCancel={handleCloseModals}
        footer={[
          <Button key="close" onClick={handleCloseModals}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {selectedProduct && (
          <div>
            {selectedProduct.image && (
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <Image
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  width={200}
                  style={{ borderRadius: '8px' }}
                />
              </div>
            )}
            <Row gutter={16}>
              <Col span={12}>
                <p>
                  <strong>Name:</strong> {selectedProduct.name}
                </p>
                <p>
                  <strong>Category:</strong> {selectedProduct.category}
                </p>
                <p>
                  <strong>Price:</strong> Rs.{' '}
                  {selectedProduct.price?.toFixed(2) || '0.00'}
                </p>
                {selectedProduct.discountPrice && (
                  <p>
                    <strong>Discount Price:</strong> Rs.{' '}
                    {selectedProduct.discountPrice?.toFixed(2)}
                  </p>
                )}
              </Col>
              <Col span={12}>
                <p>
                  <strong>Quantity:</strong> {selectedProduct.quantity}
                </p>
                <p>
                  <strong>Expiry Date:</strong>{' '}
                  {selectedProduct.expiryDate
                    ? new Date(selectedProduct.expiryDate).toLocaleDateString()
                    : 'N/A'}
                </p>
                <p>
                  <strong>Status:</strong>{' '}
                  <Tag
                    color={
                      selectedProduct.quantity <=
                      selectedProduct.lowStockThreshold
                        ? 'red'
                        : 'green'
                    }
                  >
                    {selectedProduct.quantity <=
                    selectedProduct.lowStockThreshold
                      ? 'Low Stock'
                      : 'In Stock'}
                  </Tag>
                </p>
              </Col>
            </Row>
            <p>
              <strong>Description:</strong>
            </p>
            <p
              style={{
                backgroundColor: '#f9f9f9',
                padding: '12px',
                borderRadius: '4px',
                marginTop: '8px',
              }}
            >
              {selectedProduct.description || 'No description available'}
            </p>
          </div>
        )}
      </Modal>

      {/* Stock Management Modal */}
      <Modal
        title="Update Stock"
        open={stockModalVisible}
        onCancel={handleCloseModals}
        onOk={handleStockSubmit}
        width={400}
      >
        {selectedProductForAction && (
          <div>
            <p><strong>Product:</strong> {selectedProductForAction.name}</p>
            <p><strong>Current Stock:</strong> {selectedProductForAction.quantity}</p>
            <Divider />
            <div style={{ marginBottom: 16 }}>
              <label>Operation:</label>
              <Select
                style={{ width: '100%', marginTop: 8 }}
                value={stockOperation.operation}
                onChange={(value) => setStockOperation(prev => ({ ...prev, operation: value }))}
              >
                <Option value="add">Add Stock</Option>
                <Option value="deduct">Deduct Stock</Option>
              </Select>
            </div>
            <div>
              <label>Quantity:</label>
              <Input
                type="number"
                min="0"
                style={{ width: '100%', marginTop: 8 }}
                value={stockOperation.quantity}
                onChange={(e) => setStockOperation(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                placeholder="Enter quantity"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Discount Management Modal */}
      <Modal
        title="Set Product Discount"
        open={discountModalVisible}
        onCancel={handleCloseModals}
        onOk={handleDiscountSubmit}
        width={400}
      >
        {selectedProductForAction && (
          <div>
            <p><strong>Product:</strong> {selectedProductForAction.name}</p>
            <p><strong>Original Price:</strong> Rs. {selectedProductForAction.price?.toFixed(2)}</p>
            <Divider />
            <div>
              <label>Discount Percentage:</label>
              <Input
                type="number"
                min="0"
                max="100"
                style={{ width: '100%', marginTop: 8 }}
                value={discountData.discount}
                onChange={(e) => setDiscountData({ discount: parseInt(e.target.value) || 0 })}
                placeholder="Enter discount percentage (0-100)"
                addonAfter="%"
              />
              {discountData.discount > 0 && (
                <p style={{ marginTop: 8, color: '#52c41a' }}>
                  <strong>New Price:</strong> Rs. {((selectedProductForAction.price * (100 - discountData.discount)) / 100).toFixed(2)}
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductList;
