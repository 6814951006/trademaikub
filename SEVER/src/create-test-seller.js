require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/user.model");
const Seller = require("./models/seller.model");
const Product = require("./models/product.model");

const username = "seller_test";
const email = "seller_test@example.com";
const password = "SellerTest123!";

const createTestSeller = async () => {
  await connectDB();
  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.findOneAndUpdate(
    { username },
    { username, email, password: hashedPassword, role: "user" },
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );
  const seller = await Seller.findOneAndUpdate(
    { userId: user._id },
    {
      userId: user._id,
      storeName: "Seller Test Store",
      phone: "0800000000",
      identityNumber: "TEST-SELLER-001",
      identityDocument: "TEST-DOCUMENT-001",
      description: "ร้านค้าสำหรับทดสอบระบบผู้ขายและคะแนน",
      status: "approved",
      rejectionReason: "",
    },
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );
  const products = [
    {
      name: "Test Product",
      category: "testing",
      description: "สินค้าสำหรับทดสอบหน้าร้าน",
      price: 199,
      stock: 10,
    },
    {
      name: "Wireless Headphones",
      category: "electronics",
      description: "หูฟังไร้สายสำหรับทดสอบการซื้อขาย",
      price: 1290,
      stock: 5,
    },
    {
      name: "Mechanical Keyboard",
      category: "electronics",
      description: "คีย์บอร์ดสำหรับโต๊ะทำงาน",
      price: 1890,
      stock: 3,
    },
    {
      name: "Canvas Backpack",
      category: "lifestyle",
      description: "กระเป๋าผ้าแคนวาสสภาพดี",
      price: 790,
      stock: 8,
    },
    {
      name: "Vintage Camera",
      category: "collectibles",
      description: "กล้องวินเทจสำหรับนักสะสม",
      price: 3500,
      stock: 2,
    },
  ];
  for (const product of products) {
    await Product.findOneAndUpdate(
      { sellerId: seller._id, name: product.name },
      { sellerId: seller._id, ...product },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
  }
  console.log(`Test seller ready: ${username} / ${password}`);
  console.log("Store status: approved");
};

createTestSeller()
  .catch((error) => {
    console.error("Unable to create test seller:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    const mongoose = require("mongoose");
    await mongoose.connection.close();
  });
