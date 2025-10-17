// src/components/Inventory/AddProduct.jsx
import React, { useState, useEffect } from 'react';
import {
  Modal, Form, Input, InputNumber, Select, DatePicker, message, Upload, Row, Col, Button
} from 'antd';
import dayjs from 'dayjs';
import { UploadOutlined } from '@ant-design/icons';
import { createProduct, getCategories } from '../../services/api';

const { TextArea } = Input;

const AddProduct = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [categories, setCategories] = useState([]);

  // === Fetch categories from DB ===
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Fetching categories...');
        const data = await getCategories();
        console.log('Categories loaded:', data);
        setCategories(data);
      } catch (err) {
        console.error('Error loading categories:', err);
        message.error('Failed to load categories');
      }
    };
    fetchCategories();
  }, []);

  // Turn chosen file into base64
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Upload props
  const uploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files!');
        return Upload.LIST_IGNORE;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('Image must be smaller than 2MB!');
        return Upload.LIST_IGNORE;
      }
      setImageFile(file);
      return false;
    },
    maxCount: 1,
    accept: 'image/*',
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      console.log('Form values:', values);
      console.log('Image file:', imageFile);
      
      let image = '';
      if (imageFile) {
        image = await fileToBase64(imageFile);
      }

      const payload = {
        name: values.name,
        category: values.category,
        subCategory: values.subCategory || null,
        price: values.price,
        quantity: values.quantity,
        description: values.description,
        expiryDate: values.expiryDate?.format('YYYY-MM-DD') || null,
        image,
      };

      console.log('Payload being sent:', payload);
      const result = await createProduct(payload);
      console.log('API response:', result);
      
      message.success('Product added successfully!');
      form.resetFields();
      setImageFile(null);
      onSuccess();
    } catch (error) {
      console.error('Error adding product:', error);
      console.error('Error response:', error.response);
      message.error(error.response?.data?.message || error.message || 'Error adding product');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setImageFile(null);
    onCancel();
  };

  return (
    <Modal
      title="Add New Product"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={700}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
  name="name"
  label="Product Name"
  rules={[
    { required: true, message: 'Please enter product name' },
    {
      pattern: /^(?!\d+$).+/,
      message: 'Name cannot be only numbers',
    },
  ]}
>
  <Input placeholder="Enter product name" />
</Form.Item>

          </Col>
          <Col span={12}>
            <Form.Item
  name="category"
  label="Category"
  rules={[{ required: true, message: 'Please select a category' }]}
>
  <Select
    showSearch
    placeholder="Select category"
    optionFilterProp="children"
    filterOption={(input, option) =>
      option?.children?.toLowerCase().startsWith(input.toLowerCase())
    }
  >
    {[...new Set(categories.map(cat => cat.name))].map((catName) => (
      <Select.Option key={catName} value={catName}>
        {catName}
      </Select.Option>
    ))}
  </Select>
</Form.Item>


<Form.Item noStyle shouldUpdate={(prev, curr) => prev.category !== curr.category}>
  {({ getFieldValue }) => {
    const selectedCategory = getFieldValue("category");
    return (
      <Form.Item name="subCategory" label="Sub Category">
        <Select
          showSearch
          allowClear
          placeholder="Select sub category"
          optionFilterProp="children"
          filterOption={(input, option) =>
            option?.children?.toLowerCase().startsWith(input.toLowerCase())
          }
        >
          {categories
            .filter(c => c.name === selectedCategory)
            .map((cat) => (
              <Select.Option key={cat._id} value={cat.subCategory}>
                {cat.subCategory}
              </Select.Option>
            ))}
        </Select>
      </Form.Item>
    );
  }}
</Form.Item>




            
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
  label="Price (LKR)"
  name="price"
  rules={[
    { required: true, message: 'Please enter price' },
    {
      validator: (_, value) => {
        if (!value) {
          return Promise.resolve(); // already handled by required
        }

        // Check if input contains only digits and optional decimals
        const isValid = /^[0-9]+(\.[0-9]{1,2})?$/.test(value);

        if (!isValid) {
          return Promise.reject(new Error(' Price must be numeric only (no letters allowed)'));
        }

        if (Number(value) < 0) {
          return Promise.reject(new Error('Price cannot be negative'));
        }

        if (Number(value) > 1000000) {
          return Promise.reject(new Error('Maximum price is 1,000,000 LKR'));
        }

        return Promise.resolve();
      },
    },
  ]}
>
  <Input placeholder="Enter price" />
</Form.Item>

          </Col>
          <Col span={12}>
            <Form.Item
              name="quantity"
              label="Initial Quantity"
              rules={[{ required: true, message: 'Please enter quantity' }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="expiryDate"
              label="Expiry Date"
              dependencies={['category']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const category = getFieldValue('category');

                    if (category === 'Food' || category === 'Medication') {
                      if (!value) {
                        return Promise.reject(
                          new Error('Expiry date is required for this category')
                        );
                      }
                      if (value.isBefore(dayjs(), 'day')) {
                        return Promise.reject(
                          new Error('Expiry date cannot be in the past')
                        );
                      }
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="Select expiry date (if required)"
                disabledDate={(current) =>
                  current &&
                  (current < dayjs().startOf('day') ||
                    current > dayjs().add(5, 'years').endOf('day'))
                }
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Product Image" name="image">
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>
                  {imageFile ? 'Change Image' : 'Upload Image'}
                </Button>
              </Upload>
              {imageFile && (
                <div style={{ marginTop: 8 }}>
                  <span>Selected: {imageFile.name}</span>
                </div>
              )}
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please enter description' }]}
        >
          <TextArea rows={3} placeholder="Enter product description" />
        </Form.Item>

        <Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Button onClick={handleCancel} disabled={loading} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Add Product
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddProduct;
