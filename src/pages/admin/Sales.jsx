import React, { useEffect, useState } from "react";
import { Table, message, Button, Space, Typography } from "antd";
import { getSales } from "../../services/api";

const { Title } = Typography;

const Sales = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const salesData = await getSales();
        console.log("📦 Sales data:", salesData);
        setData(salesData);
      } catch (err) {
        console.error("❌ Sales error:", err.response?.data || err.message);
        message.error("Failed to load sales data");
      }
    };
    fetchSales();
  }, []);

  const handleView = (record) => {
    message.info(`Viewing ${record.name}`);
  };

  const handleEdit = (record) => {
    message.info(`Editing ${record.name}`);
  };

  const handleDelete = (record) => {
    message.warning(`Deleted ${record.name}`);
  };

  const columns = [
    { title: "Product Name", dataIndex: "name", key: "name" },
    { title: "Category", dataIndex: "category", key: "category" },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    {
      title: "Expiry Date",
      dataIndex: "expiryDate",
      key: "expiryDate",
      render: (text) =>
        text ? new Date(text).toLocaleDateString() : "N/A",
    },
    {
      title: "Discount (%)",
      dataIndex: "discount",
      key: "discount",
      render: (val) => (val ? `${val}%` : "No Discount"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            className="bg-blue-500 text-white hover:bg-blue-600"
            onClick={() => handleView(record)}
          >
            View
          </Button>
          <Button
            className="bg-green-500 text-white hover:bg-green-600"
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button
            danger
            className="bg-red-500 text-white hover:bg-red-600"
            onClick={() => handleDelete(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-100 min-h-screen rounded-lg shadow-md">
      <Title level={3} className="!mb-6 !text-blue-600">
        Sales
      </Title>
      <Table
        className="bg-white rounded-lg shadow"
        dataSource={data}
        columns={columns}
        rowKey="_id"
        bordered
        pagination={{ pageSize: 8 }}
      />
    </div>
  );
};

export default Sales;
