import React, { useRef } from "react";
import ThermalInvoicePrinter from "./admin/ThermalInvoicePrinter";

const invoiceData = {
    message: "Payment successful",
    payment: {
        table_number: "1",
        total_amount: 264,
        discount: 0,
        paid_amount: 264,
        payment_method: "cash",
        card_number: null,
        orders: [
            {
                id: 72,
                user_id: 11,
                total: 235,
                status: "completed",
                discount: 0,
                payment_method: null,
                card_number: null,
                table_number: 1,
                items: [
                    {
                        id: 110,
                        name: "Set 1",
                        price: 100,
                        quantity: 2,
                        meta: {
                            slots: [
                                { food_name: "Curry 1", price: 433, spice_level: "mild" },
                                { food_name: "Curry 2", price: 43, spice_level: "very_hot" },
                                { food_name: "Misti", price: 433 },
                            ],
                        },
                    },
                    {
                        id: 111,
                        name: "Set 2",
                        price: 52,
                        quantity: 1,
                        meta: {
                            slots: [
                                { food_name: "Curry 2", price: 12 },
                                { food_name: "Misti", price: 433 },
                            ],
                        },
                    },
                    { id: 112, name: "Curry 2", price: 12, quantity: 1, meta: null },
                ],
            },
        ],
        id: 15,
    },
};

export default function Invoice() {
    const { payment } = invoiceData;
    const invoiceRef = useRef();

    const calculateItemTotal = (item) => item.price * item.quantity;
    const calculateOrderTotal = (order) =>
        order.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);

    const handlePrint = () => {
        const date = new Date().toLocaleString();
        const printWindow = window.open("", "_blank", "height=800,width=800");

        printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${payment.id}</title>
          <style>
            @page { margin: 0; }
            body { font-family: Arial, sans-serif; padding: 30px; color: #333; margin: 0; }
            .header { text-align: center; margin-bottom: 30px; position: relative; }
            .logo img { height: 100px; }
            .restaurant-name { font-size: 20px; font-weight: bold; color: #2c5aa0; margin-bottom: 5px; }
            .address, .phone { font-size: 14px; color: #666; margin-bottom: 5px; }
            .welcome { text-align: center; font-size: 16px; color: #444; margin-bottom: 15px; font-style: italic; }
            .invoice-info { position: absolute; right: 0; top: 0; text-align: right; font-size: 14px; color: #333; }
            h2 { text-align: center; margin-bottom: 20px; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f7f7f7; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .totals { text-align: right; margin-top: 20px; font-size: 16px; }
            .thank-you { text-align: center; margin-top: 20px; font-size: 18px; color: #2c5aa0; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="invoice-info">
              <p><strong>Invoice #${payment.id}</strong></p>
              <p>${date}</p>
            </div>
            <div class="logo">
              <img src="http://localhost:3000/logo.png" style="height: 50px; width: 50px" alt="Logo"/>
            </div>
            <div class="restaurant-name">ZAMZAM CURRY RESTAURANT</div>
            <div class="address">〒376-0101, Sakura Mall, 40 Omamacho Omama, Midori, Gunma</div>
            <div class="phone">電話: +81-0277-66-9545</div>
            <div class="welcome">Minna san Ohaio Gosaimas... Yoichinio o sugoshi khudasai</div>
          </div>

          <h2>Invoice Details</h2>
          <p><strong>Table Number:</strong> ${payment.table_number}</p>
          <p><strong>Payment Method:</strong> ${payment.payment_method}</p>
          ${payment.card_number ? `<p><strong>Card Number:</strong> **** **** **** ${payment.card_number}</p>` : ""}

          ${payment.orders
            .map(
                (order) => `
            <h4>Order #${order.id} (${order.status})</h4>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Sub Items</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items
                    .map(
                        (item) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>¥${item.price}</td>
                    <td>
                      ${
                            item.meta?.slots
                                ? `<ul>${item.meta.slots
                                    .map(
                                        (slot) =>
                                            `<li>${slot.food_name} - ¥${slot.price} ${
                                                slot.spice_level ? `(${slot.spice_level})` : ""
                                            }</li>`
                                    )
                                    .join("")}</ul>`
                                : "-"
                        }
                    </td>
                    <td>¥${calculateItemTotal(item)}</td>
                  </tr>
                `
                    )
                    .join("")}
              </tbody>
            </table>
            <p style="text-align: right;"><strong>Order Total:</strong> ¥${calculateOrderTotal(order)}</p>
          `
            )
            .join("")}

          <div class="totals">
            <p><strong>Total Before Discount:</strong> ¥${payment.total_amount}</p>
            <p><strong>Discount:</strong> ¥${payment.discount}</p>
            <p><strong>Paid Amount:</strong> ¥${payment.paid_amount}</p>
          </div>

          <div class="thank-you">ご来店ありがとうございました</div>
        </body>
      </html>
    `);

        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    return (
        <div
            style={{
                maxWidth: "900px",
                margin: "0 auto",
                fontFamily: "Arial, sans-serif",
                padding: "30px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                boxShadow: "0 0 10px rgba(0,0,0,0.1)",
            }}
        >

            return (
            <>
                <button onClick={() => invoiceRef.current.printInvoice()}>
                    Print Invoice
                </button>
                <ThermalInvoicePrinter ref={invoiceRef} data={invoiceData} />
            </>
            );


            {/* Restaurant Header */}
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
                <div className="logo">
                    <img height={"100px"} src={`${window.location.origin}/logo.png`} alt="Logo" />
                </div>
                <div style={{ fontSize: "36px", fontWeight: "bold", color: "#2c5aa0", marginBottom: "5px" }}>
                    ZAMZAM CURRY RESTAURANT
                </div>
                <div style={{ fontSize: "16px", color: "#666", marginBottom: "5px" }}>
                    〒376-0101, Sakura Mall, 40 Omamacho Omama, Midori, Gunma
                </div>
                <div style={{ fontSize: "16px", color: "#666", marginBottom: "10px" }}>
                    電話: +81-0277-66-9545
                </div>
                <div style={{ fontSize: "16px", fontStyle: "italic", color: "#444" }}>
                    Minna san Ohaio Gosaimas... Yoichinio o sugoshi khudasai
                </div>
            </div>

            <p><strong>Table Number:</strong> {payment.table_number}</p>
            <p><strong>Payment Method:</strong> {payment.payment_method}</p>
            {payment.card_number && <p><strong>Card Number:</strong> **** **** **** {payment.card_number}</p>}

            {payment.orders.map((order) => (
                <div key={order.id} style={{ marginTop: "20px" }}>
                    <h4>Order #{order.id} ({order.status})</h4>
                    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                        <thead>
                        <tr>
                            <th style={{ border: "1px solid #ddd", padding: "10px" }}>Item</th>
                            <th style={{ border: "1px solid #ddd", padding: "10px" }}>Qty</th>
                            <th style={{ border: "1px solid #ddd", padding: "10px" }}>Price</th>
                            <th style={{ border: "1px solid #ddd", padding: "10px" }}>Sub Items</th>
                            <th style={{ border: "1px solid #ddd", padding: "10px" }}>Total</th>
                        </tr>
                        </thead>
                        <tbody>
                        {order.items.map((item) => (
                            <tr key={item.id} style={{ backgroundColor: "#f9f9f9" }}>
                                <td style={{ border: "1px solid #ddd", padding: "10px" }}>{item.name}</td>
                                <td style={{ border: "1px solid #ddd", padding: "10px" }}>{item.quantity}</td>
                                <td style={{ border: "1px solid #ddd", padding: "10px" }}>¥{item.price}</td>
                                <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                                    {item.meta?.slots ? (
                                        <ul style={{ margin: 0, paddingLeft: "20px" }}>
                                            {item.meta.slots.map((slot, index) => (
                                                <li key={index}>
                                                    {slot.food_name} - ¥{slot.price} {slot.spice_level ? `(${slot.spice_level})` : ""}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : "-"}
                                </td>
                                <td style={{ border: "1px solid #ddd", padding: "10px" }}>{calculateItemTotal(item)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ))}

            <div style={{ textAlign: "right", marginTop: "20px", fontSize: "16px", fontWeight: "bold" }}>
                <p>Total Before Discount: ¥{payment.total_amount}</p>
                <p>Discount: ¥{payment.discount}</p>
                <p>Paid Amount: ¥{payment.paid_amount}</p>
            </div>

            <div style={{ textAlign: "center", marginTop: "20px", fontSize: "18px", color: "#2c5aa0", fontWeight: "bold" }}>
                ご来店ありがとうございました
            </div>

            <button
                onClick={handlePrint}
                style={{
                    marginTop: "30px",
                    padding: "12px 25px",
                    fontSize: "16px",
                    backgroundColor: "#2c5aa0",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    display: "block",
                    marginLeft: "auto",
                    marginRight: "auto"
                }}
            >
                Print Invoice
            </button>
        </div>
    );
}
