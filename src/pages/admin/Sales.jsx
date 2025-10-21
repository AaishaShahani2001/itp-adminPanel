import React, { useEffect, useState } from "react";
import {
  Table,
  message,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Descriptions,
  Input,
  Card,
} from "antd";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleFilled,
  PlusOutlined,
  FileTextOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getSales, updateProduct, deleteProduct } from "../../services/api";

const { Title } = Typography;
const { confirm } = Modal;

const Sales = () => {
  const [data, setData] = useState([]);
  const [selected, setSelected] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editDiscount, setEditDiscount] = useState("");

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const salesData = await getSales();
      setData(salesData);
    } catch {
      message.error("Failed to load sales data");
    }
  };

  const handleDelete = (record) => {
    confirm({
      title: "Are you sure you want to delete this product?",
      icon: <ExclamationCircleFilled style={{ color: "#ff4d4f" }} />,
      content: record.name,
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      async onOk() {
        try {
          await deleteProduct(record._id);
          message.success("Deleted successfully");
          fetchSales();
        } catch {
          message.error("Delete failed");
        }
      },
    });
  };

  const handleEdit = (record) => {
    setSelected(record);
    setEditDiscount(
      record.discountPrice
        ? (
            ((record.price - record.discountPrice) / record.price) *
            100
          ).toFixed(0)
        : ""
    );
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const discountPercent = Number(editDiscount);
      if (isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100) {
        message.error("Enter valid discount (0–100)");
        return;
      }
      const discountPrice = +(
        selected.price *
        (1 - discountPercent / 100)
      ).toFixed(2);
      await updateProduct(selected._id, {
        manualDiscountPercent: discountPercent,
        discountPrice,
      });
      message.success("Discount updated");
      setEditOpen(false);
      fetchSales();
    } catch {
      message.error("Update failed");
    }
  };

  const handleView = (record) => {
    setSelected(record);
    setViewOpen(true);
  };

  const exportSalesPDF = () => {
    const doc = new jsPDF();
    doc.text("Sales Report", 40, 40);
    autoTable(doc, {
      head: [["Product", "Category", "Qty", "Price", "Discount", "Expiry"]],
      body: data.map((d) => [
        d.name,
        d.category,
        d.quantity,
        `Rs.${d.price}`,
        d.discountPrice ? `Rs.${d.discountPrice}` : "—",
        d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : "N/A",
      ]),
    });
    doc.save("sales.pdf");
    message.success("PDF generated");
  };

  const columns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      width: 150,
      ellipsis: true,
      render: (t) => <span style={{ fontWeight: 500 }}>{t}</span>,
    },
    { title: "Cat.", dataIndex: "category", key: "category", width: 100 },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      width: 60,
      align: "center",
    },
    {
      title: "Expiry",
      dataIndex: "expiryDate",
      key: "expiryDate",
      width: 100,
      render: (d) => (d ? new Date(d).toLocaleDateString() : "—"),
    },
    {
      title: "Price (Rs)",
      dataIndex: "price",
      key: "price",
      width: 100,
      render: (v) => `Rs.${v?.toFixed(2)}`,
    },
    {
      title: "Disc (%)",
      key: "discountPercent",
      width: 80,
      render: (_, r) => {
        if (!r.discountPrice || r.price === 0) return "—";
        const p = ((r.price - r.discountPrice) / r.price) * 100;
        return (
          <Tag
            color="green"
            style={{ fontSize: 13, padding: "2px 6px", borderRadius: 6 }}
          >
            {p.toFixed(0)}%
          </Tag>
        );
      },
    },
    {
      title: "New Price",
      dataIndex: "discountPrice",
      key: "discountPrice",
      width: 90,
      render: (v) =>
        v ? (
          <strong style={{ color: "#3DED97" }}>Rs.{v.toFixed(0)}</strong>
        ) : (
          "—"
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      align: "center",
      render: (_, r) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleView(r)}
            style={{
              color: "#2563EB",
              borderColor: "#2563EB",
              borderRadius: 6,
            }}
          >
            View
          </Button>
          <Button
            icon={<EditOutlined />}
            size="small"
            style={{
              background: "#3DED97",
              borderColor: "#3DED97",
              color: "#000",
              borderRadius: 6,
            }}
            onClick={() => handleEdit(r)}
          >
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            style={{ borderRadius: 6 }}
            onClick={() => handleDelete(r)}
          >
            Del
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div
      style={{
        background: "#F9FBFF",
        minHeight: "100vh",
        padding: "30px 50px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: "1100px",
          borderRadius: 16,
          boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
          padding: 20,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Title
            level={4}
            style={{
              color: "#2563EB",
              margin: 0,
              fontWeight: 700,
            }}
          >
            Sales Overview
          </Title>
          <Space>
            <Button
              icon={<PlusOutlined />}
              style={{
                background: "#3DED97",
                borderColor: "#3DED97",
                color: "#000",
                fontWeight: 600,
                borderRadius: 8,
              }}
              onClick={() => message.info("Add Sale logic coming soon")}
            >
              Add
            </Button>
            <Button
              icon={<FileTextOutlined />}
              style={{
                background: "#2563EB",
                borderColor: "#2563EB",
                color: "#fff",
                fontWeight: 600,
                borderRadius: 8,
              }}
              onClick={exportSalesPDF}
            >
              PDF
            </Button>
            <Button
              icon={<ReloadOutlined />}
              style={{
                borderColor: "#999",
                color: "#333",
                borderRadius: 8,
              }}
              onClick={fetchSales}
            >
              Refresh
            </Button>
          </Space>
        </div>

        {/* Table */}
        <Table
          dataSource={data}
          columns={columns}
          rowKey="_id"
          bordered
          pagination={false}
          style={{
            background: "#fff",
            borderRadius: 10,
            fontSize: 14,
            textAlign: "center",
            width: "100%",
            tableLayout: "fixed",
          }}
          onRow={() => ({
            style: { cursor: "pointer", verticalAlign: "middle" },
          })}
        />
      </Card>

      {/* View Modal */}
      <Modal
        title="Product Details"
        open={viewOpen}
        onCancel={() => setViewOpen(false)}
        footer={
          <Button
            onClick={() => setViewOpen(false)}
            style={{
              borderRadius: 8,
              borderColor: "#2563EB",
              color: "#2563EB",
            }}
          >
            Close
          </Button>
        }
      >
        {selected && (
          <Descriptions
            bordered
            column={1}
            labelStyle={{
              fontWeight: 600,
              background: "#f0f6ff",
              width: "40%",
            }}
            contentStyle={{
              background: "#fff",
              padding: "6px 10px",
            }}
          >
            <Descriptions.Item label="Product">{selected.name}</Descriptions.Item>
            <Descriptions.Item label="Category">{selected.category}</Descriptions.Item>
            <Descriptions.Item label="Price">
              Rs.{selected.price.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="Discounted Price">
              {selected.discountPrice
                ? `Rs.${selected.discountPrice.toFixed(2)}`
                : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Quantity">{selected.quantity}</Descriptions.Item>
            <Descriptions.Item label="Expiry">
              {selected.expiryDate
                ? new Date(selected.expiryDate).toLocaleDateString()
                : "N/A"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Discount"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={handleSaveEdit}
        okText="Save"
        okButtonProps={{
          style: {
            background: "#3DED97",
            borderColor: "#3DED97",
            color: "#000",
            fontWeight: 600,
          },
        }}
      >
        {selected && (
          <>
            <p>
              Product: <strong>{selected.name}</strong>
            </p>
            <p>Current Price: Rs.{selected.price.toFixed(2)}</p>
            <Input
              placeholder="Enter discount %"
              value={editDiscount}
              onChange={(e) => setEditDiscount(e.target.value)}
              type="number"
              min={0}
              max={100}
              style={{
                marginTop: 10,
                borderRadius: 8,
                borderColor: "#2563EB",
              }}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default Sales;
