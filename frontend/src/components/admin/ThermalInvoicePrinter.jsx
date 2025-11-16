import React, { forwardRef, useImperativeHandle } from "react";

const ThermalInvoicePrinter = forwardRef(({ data }, ref) => {
    const { payment } = data;

    const calculateItemTotal = (item) => item.price * item.quantity;
    const calculateOrderTotal = (order) =>
        order.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);

    // 🕒 Simple date format: YYYY/MM/DD HH:mm
    const currentDate = new Date().toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    const SPICE_LEVELS = [
        { value: "mild", label: "1 マイルド (MILD)" },
        { value: "medium", label: "2 普通 (MEDIUM)" },
        { value: "hot", label: "3 中辛 (HOT)" },
        { value: "very_hot", label: "4 大辛 (VERY HOT)" },
        { value: "super_hot", label: "5 激辛 (SUPER HOT)" },
    ];

    const getSpiceLabel = (value) => {
        const match = SPICE_LEVELS.find((level) => level.value === value);
        return match ? match.label : value;
    };

    useImperativeHandle(ref, () => ({
        printInvoice: () => {
            const printWindow = window.open("", "_blank", "width=400,height=600");

            printWindow.document.write(`
        <html>
          <head>
            <title>Invoice #${payment.id}</title>
            <style>
              @page { size: 80mm auto; margin: 0; }
              body { font-family: monospace; font-size: 12px; padding: 5px; color: #000; width: 80mm; }
              .header { text-align: center; margin-bottom: 10px; }
              .logo img { height: 50px; width: 80px; }
              .divider { border-bottom: 1px dashed #000; margin: 5px 0; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
              th, td { text-align: left; padding: 2px 0; }
              .totals { margin-top: 5px; text-align: right; }
              .thank-you { text-align: center; margin-top: 5px; font-weight: bold; }
              ul { padding-left: 10px; margin: 2px 0; }
              .feedback { text-align: center; margin-top: 10px; }
              .feedback img { width: 80px; height: 80px; margin-top: 5px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">
                <img src="${window.location.origin}/logo.png" alt="Logo" style="width: 80px; height: 60px;" />
              </div>
              <div><strong>ZAMZAM CURRY RESTAURANT</strong></div>
              <div>〒376-0101 Sakura Mall, Midori, Gunma</div>
              <div>Tel: +81-0277-66-9545</div>
              <div>${currentDate}</div>
            </div>

            <div class="divider"></div>
            <p><strong>Invoice #${payment.id}</strong></p>
            <p><strong>Table:</strong> ${payment.table_number}</p>
            <p><strong>Payment:</strong> ${payment.payment_method}</p>
            ${payment.card_number ? `<p>Card: **** **** **** ${payment.card_number}</p>` : ""}

            <div class="divider"></div>

            ${payment.orders
                .map(
                    (order) => `
                  <p><b><strong>Order #${order.id}</strong></b></p>
                  <table>
                    <tbody>
                      ${order.items
                        .map(
                            (item) => `
                            <tr>
                              <td>${item.name} x${item.quantity}</td>
                              <td>¥${calculateItemTotal(item)}</td>
                            </tr>
                            ${
                                item.meta?.slots
                                    ? `<tr><td colspan="2">
                                    <ul>${item.meta.slots
                                        .map(
                                            (slot) =>
                                                `<li>${slot.food_name} - ¥${slot.price} ${
                                                    slot.spice_level ? `(${getSpiceLabel(slot.spice_level)})` : ""
                                                }</li>`
                                        )
                                        .join("")}</ul>
                                  </td></tr>`
                                    : ""
                            }
                          `
                        )
                        .join("")}
                    </tbody>
                  </table>
                  <p style="text-align: right;"><strong>Order Total: ¥${calculateOrderTotal(order)}</strong></p>
                  <div class="divider"></div>
                `
                )
                .join("")}

            <div class="totals">
              <p><strong>Total (Tax Included): ¥${payment.total_amount}</strong></p>
              <p>Discount: ¥${payment.discount}</p>
              <p>Paid: ¥${payment.paid_amount}</p>
            </div>

            <div class="thank-you">Thanks for Visiting Us! Please Come Again</div>
            <div class="thank-you">ご来店ありがとうございました！またお越しください</div>

            <div class="feedback">
              <p>📝 Give Us Your Feedback!</p>
              <img src="${window.location.origin}/feedback.png" alt="Feedback QR" />
              <p>Scan to leave a review</p>
            </div>
          </body>
        </html>
      `);

            printWindow.document.close();
            printWindow.focus();

            const images = printWindow.document.querySelectorAll("img");

            if (images.length > 0) {
                let loadedCount = 0;

                const checkAllLoaded = () => {
                    loadedCount++;
                    if (loadedCount === images.length) {
                        printWindow.print();
                        printWindow.close();
                    }
                };

                images.forEach((img) => {
                    if (img.complete) {
                        // Already loaded
                        checkAllLoaded();
                    } else {
                        img.onload = checkAllLoaded;
                        img.onerror = checkAllLoaded; // Fallback if image fails
                    }
                });
            } else {
                // No images found — just print
                printWindow.print();
                printWindow.close();
            }

        },
    }));

    return null;
});

export default ThermalInvoicePrinter;
