// src/components/Inventory/ProductList.jsx
import React, { useState, useEffect } from "react";
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
  Tooltip,
  Divider,
  Typography,
  Alert,
  App,
} from "antd";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  FileTextOutlined,
} from "@ant-design/icons";
import {
  getProducts,
  deleteProduct,
  updateStock,
  setProductDiscount,
  getCategories,
} from "../../services/api";
import AddProduct from "./AddProduct";
import EditProduct from "./EditProduct";
import dayjs from "dayjs";

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
    totalValue: 0,
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockStatusFilter, setStockStatusFilter] = useState("");
  const [expiryStatusFilter, setExpiryStatusFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [discountModalVisible, setDiscountModalVisible] = useState(false);
  const [selectedProductForAction, setSelectedProductForAction] = useState(null);
  const [stockOperation, setStockOperation] = useState({
    operation: "add",
    quantity: 0,
  });
  const [discountData, setDiscountData] = useState({ discount: 0 });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch {
      message.error("Failed to load categories, using defaults");
      setCategories([
        { _id: "1", name: "Food" },
        { _id: "2", name: "Medication" },
        { _id: "3", name: "Accessories" },
        { _id: "4", name: "Toys" },
        { _id: "5", name: "Grooming" },
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
      const total = data.length;
      const lowStock = data.filter(
        (p) => p.quantity <= p.lowStockThreshold
      ).length;
      const outOfStock = data.filter((p) => p.quantity === 0).length;
      const nearExpiry = data.filter((p) => {
        if (!p.expiryDate) return false;
        const diff = dayjs(p.expiryDate).diff(dayjs(), "days");
        return diff <= 30 && diff >= 0;
      }).length;
      const totalValue = data.reduce(
        (sum, p) => sum + (p.discountPrice || p.price) * p.quantity,
        0
      );
      setStats({ total, lowStock, outOfStock, nearExpiry, totalValue });
    } catch {
      message.error("Failed to fetch products");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [searchText, categoryFilter, stockStatusFilter, expiryStatusFilter]);

  const showDeleteConfirm = (product) => {
    modal.confirm({
      title: "Are you sure you want to delete this product?",
      icon: <ExclamationCircleFilled style={{ color: "#ff4d4f" }} />,
      content: `Product: ${product.name}`,
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk() {
        handleDelete(product._id);
      },
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      message.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      message.error("Failed to delete product");
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

  const handleStockUpdate = (product) => {
    setSelectedProductForAction(product);
    setStockOperation({ operation: "add", quantity: 0 });
    setStockModalVisible(true);
  };

  const handleStockSubmit = async () => {
    try {
      await updateStock(
        selectedProductForAction._id,
        stockOperation.operation,
        stockOperation.quantity
      );
      message.success("Stock updated successfully");
      setStockModalVisible(false);
      fetchProducts();
    } catch {
      message.error("Failed to update stock");
    }
  };

  const handleDiscountUpdate = (product) => {
    setSelectedProductForAction(product);
    setDiscountData({ discount: product.manualDiscountPercent || 0 });
    setDiscountModalVisible(true);
  };

  const handleDiscountSubmit = async () => {
    try {
      await setProductDiscount(
        selectedProductForAction._id,
        discountData.discount
      );
      message.success("Discount updated successfully");
      setDiscountModalVisible(false);
      fetchProducts();
    } catch {
      message.error("Failed to update discount");
    }
  };

  const exportProductsPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFontSize(18);
    doc.text("Product Inventory Summary", 40, 40);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 60);
    const body = products.map((p) => [
      p.name || "-",
      p.category || "-",
      p.subCategory || "-",
      `Rs. ${p.price || 0}`,
      p.discountPrice ? `Rs. ${p.discountPrice}` : "-",
      p.quantity || 0,
      p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : "-",
      p.isActive ? "Active" : "Inactive",
    ]);
    autoTable(doc, {
      startY: 80,
      head: [
        [
          "Product Name",
          "Category",
          "Sub Category",
          "Price",
          "Discount Price",
          "Stock",
          "Expiry Date",
          "Status",
        ],
      ],
      body,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 4, valign: "middle" },
      headStyles: { fillColor: [37, 99, 235] },
      didDrawPage: () => {
        doc.setFontSize(9);
        doc.text(
          `Page ${doc.getNumberOfPages()}`,
          pageW - 60,
          doc.internal.pageSize.getHeight() - 20
        );
      },
    });
    doc.save("product-inventory-summary.pdf");
  };

  const handleSearch = (v) => setSearchText(v);
  const handleCategoryFilter = (v) => setCategoryFilter(v);
  const handleStockStatusFilter = (v) => setStockStatusFilter(v);
  const handleExpiryStatusFilter = (v) => setExpiryStatusFilter(v);
  const clearFilters = () => {
    setSearchText("");
    setCategoryFilter("");
    setStockStatusFilter("");
    setExpiryStatusFilter("");
  };

  // 🌿 UI Section Starts
  return (
    <div
      style={{
        padding: 24,
        background: "#f5f8ff",
        minHeight: "100vh",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      {/* Header Gradient */}
      <div
        style={{
          background: "linear-gradient(90deg,#3B82F6 0%,#2563EB 100%)",
          color: "#fff",
          borderRadius: 16,
          padding: "24px 32px",
          marginBottom: 32,
          boxShadow: "0 4px 10px rgba(37,99,235,0.3)",
        }}
      >
        <Title level={2} style={{ color: "#fff", marginBottom: 0 }}>
          Product Inventory Management
        </Title>
        <Text style={{ color: "rgba(255,255,255,0.9)" }}>
          Manage, analyze, and control your stock efficiently
        </Text>
      </div>
      {/* ======= ALERTS ======= */}
      {stats.nearExpiry > 0 && (
        <Alert
          message={`${stats.nearExpiry} products are expiring within 30 days`}
          type="warning"
          icon={<WarningOutlined />}
          style={{
            marginBottom: 16,
            borderRadius: 10,
            background: "#FFF8E1",
            border: "1px solid #FFD54F",
          }}
        />
      )}
      {stats.lowStock > 0 && (
        <Alert
          message={`${stats.lowStock} products are running low on stock`}
          type="info"
          icon={<StockOutlined />}
          style={{
            marginBottom: 16,
            borderRadius: 10,
            background: "#E3F2FD",
            border: "1px solid #64B5F6",
          }}
        />
      )}

      {/* ======= STAT CARDS ======= */}
      <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
        {[
          {
            title: "Total Products",
            value: stats.total,
            color: "#2563EB",
            icon: <StockOutlined />,
          },
          {
            title: "Low Stock",
            value: stats.lowStock,
            color: "#FFA500",
            icon: <WarningOutlined />,
          },
          {
            title: "Out of Stock",
            value: stats.outOfStock,
            color: "#FF4D4F",
            icon: <ExclamationCircleFilled />,
          },
          {
            title: "Near Expiry",
            value: stats.nearExpiry,
            color: "#FA8C16",
            icon: <CalendarOutlined />,
          },
          
        ].map((item) => (
          <Col key={item.title} xs={24} sm={12} md={8} lg={4}>
            <Card
              style={{
                borderRadius: 16,
                boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
                textAlign: "center",
              }}
            >
              <Statistic
                title={item.title}
                value={item.value}
                prefix={item.icon}
                valueStyle={{ color: item.color, fontWeight: 600 }}
              />
            </Card>
          </Col>
        ))}

        {/* Action buttons */}
        <Col xs={24} sm={12} md={8} lg={4}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
            style={{
              width: "100%",
              height: 64,
              background: "#3DED97",
              borderColor: "#3DED97",
              borderRadius: 14,
              fontWeight: 600,
            }}
          >
            Add Product
          </Button>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Button
            icon={<FileTextOutlined />}
            onClick={exportProductsPDF}
            style={{
              width: "100%",
              height: 64,
              borderRadius: 14,
              fontWeight: 600,
              borderColor: "#2563EB",
              color: "#2563EB",
            }}
          >
            Download PDF
          </Button>
        </Col>
      </Row>

      {/* ======= FILTER BAR ======= */}
      <Card
        style={{
          borderRadius: 16,
          boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
          marginBottom: 28,
        }}
        title={
          <span style={{ color: "#2563EB", fontWeight: 600 }}>
            Filters & Search
          </span>
        }
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Search
  placeholder="Search products…"
  allowClear
  onSearch={handleSearch}
  style={{ width: "100%" }}
/>


          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Category"
              allowClear
              style={{ width: "100%" }}
              onChange={handleCategoryFilter}
              value={categoryFilter}
            >
              {categories.map((c) => (
                <Option key={c._id} value={c.name}>
                  {c.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Stock Status"
              allowClear
              style={{ width: "100%" }}
              onChange={handleStockStatusFilter}
              value={stockStatusFilter}
            >
              <Option value="low">Low Stock</Option>
              <Option value="adequate">Adequate</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Expiry Status"
              allowClear
              style={{ width: "100%" }}
              onChange={handleExpiryStatusFilter}
              value={expiryStatusFilter}
            >
              <Option value="near">Near Expiry</Option>
              <Option value="expired">Expired</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={3}>
            <Button
              icon={<ReloadOutlined />}
              onClick={clearFilters}
              style={{
                width: "100%",
                borderRadius: 10,
                borderColor: "#2563EB",
                color: "#2563EB",
              }}
            >
              Clear
            </Button>
          </Col>
          <Col xs={24} sm={12} md={3}>
            <Button
              icon={<FilterOutlined />}
              onClick={fetchProducts}
              type="primary"
              style={{
                width: "100%",
                background: "#2563EB",
                borderRadius: 10,
              }}
            >
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      {/* ======= PRODUCT TABLE ======= */}
      <Card
        title={
          <span style={{ color: "#2563EB", fontWeight: 600 }}>
            Product Inventory
          </span>
        }
        style={{
          borderRadius: 16,
          boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
          marginBottom: 32,
        }}
      >
        <Table
          columns={[
            {
              title: "Image",
              dataIndex: "image",
              key: "image",
              render: (img) =>
                img ? (
                  <Image
                    src={img}
                    alt="Product"
                    width={50}
                    height={50}
                    style={{ borderRadius: 8, objectFit: "cover" }}
                    preview={false}
                  />
                ) : (
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 8,
                      background: "#f0f0f0",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#999",
                      fontSize: 12,
                    }}
                  >
                    No Image
                  </div>
                ),
            },
            { title: "Name", dataIndex: "name", key: "name" },
            { title: "Category", dataIndex: "category", key: "category" },
            {
              title: "Price (LKR)",
              dataIndex: "price",
              key: "price",
              render: (p) => `Rs. ${p?.toFixed(2) || "0.00"}`,
            },
            {
              title: "Quantity",
              dataIndex: "quantity",
              key: "quantity",
              render: (q, r) => (
                <Tag color={q <= r.lowStockThreshold ? "orange" : "green"}>
                  {q}
                </Tag>
              ),
            },
            {
              title: "Expiry Date",
              dataIndex: "expiryDate",
              key: "expiryDate",
              render: (d) => (d ? new Date(d).toLocaleDateString() : "N/A"),
            },
            {
              title: "Status",
              key: "status",
              render: (_, r) => (
                <Tag
                  color={
                    r.quantity === 0
                      ? "volcano"
                      : r.quantity <= r.lowStockThreshold
                      ? "orange"
                      : "green"
                  }
                >
                  {r.quantity === 0
                    ? "Out of Stock"
                    : r.quantity <= r.lowStockThreshold
                    ? "Low Stock"
                    : "In Stock"}
                </Tag>
              ),
            },
            {
              title: "Actions",
              key: "actions",
              render: (_, record) => (
                <Space>
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
                      type="primary"
                      icon={<EditOutlined />}
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
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => showDeleteConfirm(record)}
                    />
                  </Tooltip>
                </Space>
              ),
            },
          ]}
          dataSource={filteredProducts}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showQuickJumper: true,
            showTotal: (t, r) =>
              `${r[0]}-${r[1]} of ${t} products`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* ======= MODALS (Add, Edit, View, Stock, Discount) ======= */}
      <AddProduct
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onSuccess={() => {
          setIsModalVisible(false);
          fetchProducts();
        }}
      />
      <EditProduct
        visible={editModalVisible}
        onCancel={handleCloseModals}
        onSuccess={() => {
          handleCloseModals();
          fetchProducts();
        }}
        product={editingProduct}
      />

      <Modal
        title="Product Details"
        open={viewModalVisible}
        onCancel={handleCloseModals}
        footer={<Button onClick={handleCloseModals}>Close</Button>}
        width={600}
      >
        {selectedProduct && (
          <div>
            {selectedProduct.image && (
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <Image
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  width={200}
                  style={{
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                />
              </div>
            )}
            <Row gutter={16}>
              <Col span={12}>
                <p><b>Name:</b> {selectedProduct.name}</p>
                <p><b>Category:</b> {selectedProduct.category}</p>
                <p><b>Price:</b> Rs. {selectedProduct.price?.toFixed(2)}</p>
              </Col>
              <Col span={12}>
                <p><b>Quantity:</b> {selectedProduct.quantity}</p>
                <p>
                  <b>Expiry Date:</b> 
                  {selectedProduct.expiryDate
                    ? new Date(selectedProduct.expiryDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </Col>
            </Row>
            <Divider />
            <p><b>Description:</b></p>
            <p
              style={{
                background: "#f9fafb",
                padding: 10,
                borderRadius: 8,
              }}
            >
              {selectedProduct.description || "No description available."}
            </p>
          </div>
        )}
      </Modal>

      {/* Stock Modal */}
      <Modal
        title="Update Stock"
        open={stockModalVisible}
        onCancel={handleCloseModals}
        onOk={handleStockSubmit}
        okText="Update"
        width={400}
      >
        {selectedProductForAction && (
          <div>
            <p><b>Product:</b> {selectedProductForAction.name}</p>
            <p><b>Current Stock:</b> {selectedProductForAction.quantity}</p>
            <Divider />
            <label>Operation:</label>
            <Select
              style={{ width: "100%", marginBottom: 16 }}
              value={stockOperation.operation}
              onChange={(v) =>
                setStockOperation((p) => ({ ...p, operation: v }))
              }
            >
              <Option value="add">Add Stock</Option>
              <Option value="deduct">Deduct Stock</Option>
            </Select>
            <label>Quantity:</label>
            <Input
              type="number"
              min="0"
              value={stockOperation.quantity}
              onChange={(e) =>
                setStockOperation((p) => ({
                  ...p,
                  quantity: parseInt(e.target.value) || 0,
                }))
              }
            />
          </div>
        )}
      </Modal>

      {/* Discount Modal */}
      <Modal
        title="Set Product Discount"
        open={discountModalVisible}
        onCancel={handleCloseModals}
        onOk={handleDiscountSubmit}
        okText="Apply"
        width={400}
      >
        {selectedProductForAction && (
          <div>
            <p><b>Product:</b> {selectedProductForAction.name}</p>
            <p>
              <b>Original Price:</b> Rs. 
              {selectedProductForAction.price?.toFixed(2)}
            </p>
            <Divider />
            <label>Discount Percentage (0-100):</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={discountData.discount}
              onChange={(e) =>
                setDiscountData({
                  discount: parseInt(e.target.value) || 0,
                })
              }
              addonAfter="%"
            />
            {discountData.discount > 0 && (
              <p style={{ marginTop: 8, color: "#3DED97", fontWeight: 600 }}>
                New Price: Rs. 
                {(
                  (selectedProductForAction.price *
                    (100 - discountData.discount)) /
                  100
                ).toFixed(2)}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductList;
