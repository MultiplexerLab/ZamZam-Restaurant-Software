import { useState } from "react";
import { Form, Button, Table, Spinner, Alert, Badge } from "react-bootstrap";
import API from "../../services/api";

export default function OrderDetails() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cardNumber, setCardNumber] = useState("");

  // Helper to check if order is completed
  const isCompleted = (order) => order?.status?.toLowerCase() === "completed";

  // Calculate total including sub-items
  const calculateTotal = (order) => {
    if (!order?.items) return 0;
    return order.items.reduce((sum, item) => {
      const itemTotal = Number(item.price || 0) * Number(item.quantity || 0);
      const subItemsTotal =
          item.meta?.sub_items?.reduce((s, sub) => s + Number(sub.price || 0), 0) || 0;
      return sum + itemTotal + subItemsTotal;
    }, 0);
  };

  // Grand total after discount
  const calculateDiscountedTotal = (order, discount) => {
    const total = calculateTotal(order);
    const discountValue = parseFloat(discount) || 0;
    const grandTotal = total - discountValue;
    return grandTotal > 0 ? grandTotal : 0;
  };

  // Fetch order
  const fetchOrder = async (e) => {
    e?.preventDefault();
    if (!orderId) return;
    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const res = await API.get(`/orders/${orderId}`);
      setOrder(res.data.data);

      if (isCompleted(res.data.data)) {
        setDiscount(res.data.data.discount || 0);
        setPaymentMethod(res.data.data.payment_method || "cash");
        setCardNumber(res.data.data.card_number || "");
      }
    } catch (err) {
      setError("Order not found or failed to load.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Payment
  const handlePayment = async () => {
    if (!order) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        status: "completed",
        discount: parseFloat(discount) || 0,
        payment_method: paymentMethod,
        ...(paymentMethod === "card" ? { card_number: cardNumber.slice(-4) } : {}),
      };

      await API.post(`/orders/${order.id}?_method=PUT`, payload);
      setSuccess("Payment successful! Order completed.");

      const res = await API.get(`/orders/${order.id}`);
      setOrder(res.data.data);
    } catch (err) {
      setError("Payment failed.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Print Invoice
  const handlePrintInvoice = () => {
    if (!order) return;

    const total = calculateTotal(order).toFixed(2);
    const discountValue = parseFloat(order.discount || discount) || 0;
    const grandTotal = calculateDiscountedTotal(order, discountValue).toFixed(2);

    const printWindow = window.open("", "_blank", "height=600,width=400");
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${order.id}</title>
        </head>
        <body style="font-family:sans-serif;">
          <h2 style="text-align:center;">Invoice</h2>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Status:</strong> ${order.status}</p>
          <p><strong>Payment Method:</strong> ${order.payment_method || paymentMethod}</p>
          ${
        order.payment_method === "card" || paymentMethod === "card"
            ? `<p><strong>Card Number:</strong> **** **** **** ${order.card_number || cardNumber.slice(-4)}</p>`
            : ""
    }

          <h4>Items</h4>
          <ul>
            ${order.items
        ?.map(
            (item) => `
              <li>
                ${item.title} (${item.quantity} × ¥${item.price}) 
                ${
                item.meta?.sub_items
                    ? `<ul>${item.meta.sub_items
                        .map((sub) => `<li>${sub.name} - ¥${sub.price}</li>`)
                        .join("")}</ul>`
                    : ""
            }
              </li>`
        )
        .join("")}
          </ul>

          <p><strong>Total Before Discount:</strong> ¥${total}</p>
          <p><strong>Discount:</strong> ¥${discountValue.toFixed(2)}</p>
          <p><strong>Paid Amount:</strong> ¥${grandTotal}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
      <div className="container mt-4">
        <Form onSubmit={fetchOrder} className="d-flex mb-3">
          <Form.Control
              type="text"
              placeholder="Enter Order ID"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              style={{ maxWidth: "300px" }}
          />
          <Button type="submit" className="ms-2">Fetch Order</Button>
        </Form>

        {loading && <Spinner animation="border" />}
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {order && (
            <>
              <h4>
                Order #{order.id}{" "}
                <Badge
                    bg={
                      isCompleted(order)
                          ? "success"
                          : order.status === "pending"
                              ? "warning"
                              : "secondary"
                    }
                >
                  {order.status}
                </Badge>
              </h4>

              <h5>Items</h5>
              <Table striped bordered hover>
                <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Sub Items</th>
                </tr>
                </thead>
                <tbody>
                {order.items?.map((item) => (
                    <tr key={item.id}>
                      <td>{item.title}</td>
                      <td>{item.quantity}</td>
                      <td>¥{item.price}</td>
                      <td>
                        {item.meta?.sub_items ? (
                            <ul className="mb-0">
                              {item.meta.sub_items.map((sub) => (
                                  <li key={sub.id}>{sub.name} - ¥{sub.price}</li>
                              ))}
                            </ul>
                        ) : "-"}
                      </td>
                    </tr>
                ))}
                </tbody>
              </Table>

              {isCompleted(order) ? (
                  <div className="mt-4">
                    <p><strong>Total Before Discount:</strong> ¥{calculateTotal(order).toFixed(2)}</p>
                    <p><strong>Discount:</strong> ¥{order.discount?.toFixed(2) || "0.00"}</p>
                    <p><strong>Paid Amount:</strong> ¥{calculateDiscountedTotal(order, order.discount || 0).toFixed(2)}</p>
                    <p><strong>Payment Method:</strong> {order.payment_method}</p>
                    {order.payment_method === "card" && (
                        <p><strong>Card Number:</strong> **** **** **** {order.card_number}</p>
                    )}
                    <Button variant="secondary" onClick={handlePrintInvoice}>Print Invoice</Button>
                  </div>
              ) : (
                  <div className="mt-4" style={{ maxWidth: "400px" }}>
                    <p><strong>Total Amount:</strong> ¥{calculateTotal(order).toFixed(2)}</p>

                    <Form.Group className="mb-2">
                      <Form.Label>Discount</Form.Label>
                      <Form.Control
                          type="number"
                          placeholder="Enter discount amount"
                          value={discount}
                          onChange={(e) => setDiscount(e.target.value)}
                      />
                    </Form.Group>

                    <p>
                      <strong>Amount After Discount:</strong> ¥
                      {calculateDiscountedTotal(order, discount).toFixed(2)}
                    </p>

                    <Form.Group className="mb-2">
                      <Form.Label>Payment Method</Form.Label>
                      <Form.Select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                      </Form.Select>
                    </Form.Group>

                    {paymentMethod === "card" && (
                        <Form.Group className="mb-2">
                          <Form.Label>Card Number</Form.Label>
                          <Form.Control
                              type="text"
                              placeholder="Enter card number"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                          />
                        </Form.Group>
                    )}

                    <Button
                        variant="success"
                        className="mt-2"
                        disabled={saving}
                        onClick={handlePayment}
                    >
                      {saving ? "Processing..." : "Make Payment"}
                    </Button>
                  </div>
              )}
            </>
        )}
      </div>
  );
}
