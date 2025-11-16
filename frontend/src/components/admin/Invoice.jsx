import React from "react";

export default function InvoicePrinter({ data }) {
    const { payment } = data;

    const calculateItemTotal = (item) => item.price * item.quantity;
    const calculateOrderTotal = (order) =>
        order.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);

    const printInvoice = () => {
        const printWindow = window.open("", "_blank", "height=800,width=800");

        printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${payment.id}</title>
          <style>
            @page { margin: 0; }
            body { font-family: Arial, sans-serif; padding: 30px; color: #333; margin: 0; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo img { height: 100px; }
            .restaurant-name { font-size: 20px; font-weight: bold; color: #2c5aa0; margin-bottom: 5px; }
            .address, .phone { font-size: 14px; color: #666; margin-bottom: 5px; }
            .welcome { text-align: center; font-size: 16px; color: #444; margin-bottom: 15px; font-style: italic; }
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
            <div class="logo">
              <img src="${window.location.origin}/logo.png" style="height: 50px; width: 50px" alt="Logo"/>
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

    // Expose the print function via a ref or return
    return null; // No UI
}
