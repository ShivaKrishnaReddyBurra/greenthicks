const express = require("express")
const Order = require("../models/Order")
const User = require("../models/User")
const Product = require("../models/Product")
const authenticate = require("../middleware/authenticate")
const ExcelJS = require("exceljs")
const PDFDocument = require("pdfkit")

const router = express.Router()

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    })
  }
  next()
}

// Export sales report
router.post("/sales", authenticate, isAdmin, async (req, res) => {
  try {
    const { dateRange, format } = req.body

    const startDate = new Date()
    const endDate = new Date()

    switch (dateRange) {
      case "day":
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case "week":
        startDate.setDate(startDate.getDate() - 7)
        break
      case "month":
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
    }

    const orders = await Order.find({
      orderDate: { $gte: startDate, $lte: endDate },
    })
      .populate("user", "firstName lastName email")
      .populate("items.product", "name category")

    const salesData = orders.map((order) => ({
      orderId: order.id,
      customerName: `${order.user.firstName} ${order.user.lastName}`,
      customerEmail: order.user.email,
      orderDate: order.orderDate,
      total: order.total,
      status: order.status,
      deliveryStatus: order.deliveryStatus,
      items: order.items.length,
      paymentMethod: order.paymentMethod,
    }))

    if (format === "csv") {
      const csv = convertToCSV(salesData)
      res.setHeader("Content-Type", "text/csv")
      res.setHeader("Content-Disposition", `attachment; filename=sales-report-${dateRange}.csv`)
      res.send(csv)
    } else if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Sales Report")

      worksheet.columns = [
        { header: "Order ID", key: "orderId", width: 15 },
        { header: "Customer Name", key: "customerName", width: 20 },
        { header: "Customer Email", key: "customerEmail", width: 25 },
        { header: "Order Date", key: "orderDate", width: 15 },
        { header: "Total", key: "total", width: 10 },
        { header: "Status", key: "status", width: 15 },
        { header: "Delivery Status", key: "deliveryStatus", width: 15 },
        { header: "Items Count", key: "items", width: 12 },
        { header: "Payment Method", key: "paymentMethod", width: 15 },
      ]

      worksheet.addRows(salesData)

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      res.setHeader("Content-Disposition", `attachment; filename=sales-report-${dateRange}.xlsx`)

      await workbook.xlsx.write(res)
      res.end()
    } else if (format === "json") {
      res.json({
        success: true,
        data: salesData,
        summary: {
          totalOrders: salesData.length,
          totalRevenue: salesData.reduce((sum, order) => sum + order.total, 0),
          dateRange: { startDate, endDate },
        },
      })
    }
  } catch (error) {
    console.error("Error exporting sales report:", error)
    res.status(500).json({
      success: false,
      message: "Failed to export sales report",
      error: error.message,
    })
  }
})

// Export inventory report
router.post("/inventory", authenticate, isAdmin, async (req, res) => {
  try {
    const { format } = req.body

    const products = await Product.find({})

    const inventoryData = products.map((product) => ({
      productId: product.globalId,
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      status: product.status,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }))

    if (format === "csv") {
      const csv = convertToCSV(inventoryData)
      res.setHeader("Content-Type", "text/csv")
      res.setHeader("Content-Disposition", "attachment; filename=inventory-report.csv")
      res.send(csv)
    } else if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Inventory Report")

      worksheet.columns = [
        { header: "Product ID", key: "productId", width: 15 },
        { header: "Name", key: "name", width: 25 },
        { header: "Category", key: "category", width: 15 },
        { header: "Price", key: "price", width: 10 },
        { header: "Stock", key: "stock", width: 10 },
        { header: "Status", key: "status", width: 15 },
        { header: "Created At", key: "createdAt", width: 15 },
        { header: "Updated At", key: "updatedAt", width: 15 },
      ]

      worksheet.addRows(inventoryData)

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      res.setHeader("Content-Disposition", "attachment; filename=inventory-report.xlsx")

      await workbook.xlsx.write(res)
      res.end()
    } else {
      res.json({
        success: true,
        data: inventoryData,
        summary: {
          totalProducts: inventoryData.length,
          totalValue: inventoryData.reduce((sum, product) => sum + product.price * product.stock, 0),
        },
      })
    }
  } catch (error) {
    console.error("Error exporting inventory report:", error)
    res.status(500).json({
      success: false,
      message: "Failed to export inventory report",
      error: error.message,
    })
  }
})

// Export customer report
router.post("/customers", authenticate, isAdmin, async (req, res) => {
  try {
    const { format } = req.body

    const users = await User.find({ isAdmin: false, isDeliveryBoy: false }).select("-password")

    const customerData = await Promise.all(
      users.map(async (user) => {
        const orderCount = await Order.countDocuments({ user: user.globalId })
        const totalSpent = await Order.aggregate([
          { $match: { user: user.globalId } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ])

        return {
          customerId: user.globalId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          city: user.city,
          state: user.state,
          joinDate: user.createdAt,
          orderCount,
          totalSpent: totalSpent[0]?.total || 0,
          isVerified: user.isVerified,
        }
      }),
    )

    if (format === "csv") {
      const csv = convertToCSV(customerData)
      res.setHeader("Content-Type", "text/csv")
      res.setHeader("Content-Disposition", "attachment; filename=customer-report.csv")
      res.send(csv)
    } else if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Customer Report")

      worksheet.columns = [
        { header: "Customer ID", key: "customerId", width: 15 },
        { header: "First Name", key: "firstName", width: 15 },
        { header: "Last Name", key: "lastName", width: 15 },
        { header: "Email", key: "email", width: 25 },
        { header: "Phone", key: "phone", width: 15 },
        { header: "City", key: "city", width: 15 },
        { header: "State", key: "state", width: 15 },
        { header: "Join Date", key: "joinDate", width: 15 },
        { header: "Order Count", key: "orderCount", width: 12 },
        { header: "Total Spent", key: "totalSpent", width: 12 },
        { header: "Verified", key: "isVerified", width: 10 },
      ]

      worksheet.addRows(customerData)

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      res.setHeader("Content-Disposition", "attachment; filename=customer-report.xlsx")

      await workbook.xlsx.write(res)
      res.end()
    } else {
      res.json({
        success: true,
        data: customerData,
        summary: {
          totalCustomers: customerData.length,
          verifiedCustomers: customerData.filter((c) => c.isVerified).length,
          totalRevenue: customerData.reduce((sum, customer) => sum + customer.totalSpent, 0),
        },
      })
    }
  } catch (error) {
    console.error("Error exporting customer report:", error)
    res.status(500).json({
      success: false,
      message: "Failed to export customer report",
      error: error.message,
    })
  }
})

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data.length) return ""

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          return typeof value === "string" ? `"${value}"` : value
        })
        .join(","),
    ),
  ].join("\n")

  return csvContent
}

module.exports = router
