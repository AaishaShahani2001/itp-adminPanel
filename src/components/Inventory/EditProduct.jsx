// src/components/Inventory/EditProduct.jsx
import React, { useState, useEffect } from 'react';
import {
  Modal, Form, Input, InputNumber, Select, DatePicker, message, Upload, Button
} from 'antd';
import { updateProduct, getCategories } from '../../services/api';
import dayjs from 'dayjs';
import { UploadOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const EditProduct = ({ visible, onCancel, onSuccess, product }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [categories, setCategories] = useState([]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        message.error('Failed to load categories');
      }
    };
    fetchCategories();
  }, []);

  // Pre-fill form when editing
  useEffect(() => {
    if (product) {
      form.setFieldsValue({
        name: product.name,
        category: product.category,              // ✅ Category string
        subCategory: product.subCategory || null, // ✅ Include subCategory
        price: product.price,
        quantity: product.quantity,
        expiryDate: product.expiryDate ? dayjs(product.expiryDate) : null,
        description: product.description,
      });
    }
  }, [product, form]);

  // Convert file to base64
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Upload validation
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
      let image = product?.image || '';
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
        expiryDate: values.expiryDate?.format('YYYY-MM-DD'),
        image,
      };

      await updateProduct(product._id, payload);
      message.success('Product updated successfully!');
      form.resetFields();
      setImageFile(null);
      onSuccess();
    } catch (error) {
      console.error('Error updating product:', error);
      message.error(error.response?.data?.message || 'Error updating product');
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
      title="Edit Product"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* Product Name */}
        <Form.Item
          name="name"
          label="Product Name"
          rules={[{ required: true, message: 'Please enter product name' },
          {
             pattern: /^(?!\d+$).+/,
      message: 'Name cannot be only numbers',
    },
       ]} 
        >
          <Input placeholder="Enter product name" />
        </Form.Item>

        {/* Category */}
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

        {/* SubCategory */}
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

        {/* Price */}
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

        
        

        {/* Quantity */}
        <Form.Item
          name="quantity"
          label="Quantity"
          rules={[{ required: true, message: 'Please enter quantity' }]}
        >
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>

        {/* Expiry Date (conditional) */}
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

        {/* Image */}
        <Form.Item label="Product Image" name="image">
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>
              {imageFile ? 'Change Image' : 'Upload Image'}
            </Button>
          </Upload>
          {product?.image && !imageFile && (
            <div style={{ marginTop: 8 }}>
              <img
                src={product.image}
                alt="Current"
                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: 4 }}
              />
              <span style={{ marginLeft: 8 }}>Current Image</span>
            </div>
          )}
          {imageFile && (
            <div style={{ marginTop: 8 }}>
              <span>New Image: {imageFile.name}</span>
            </div>
          )}
        </Form.Item>

        {/* Description */}
        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please enter description' }]}
        >
          <TextArea rows={3} placeholder="Enter product description" />
        </Form.Item>

        {/* Buttons */}
        <Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Button onClick={handleCancel} disabled={loading} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Update Product
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditProduct;
