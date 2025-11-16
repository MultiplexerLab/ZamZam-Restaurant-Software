import React, { useState, useRef } from "react";
import {
  Form,
  Button,
  Spinner,
  Alert,
  Table,
  Modal,
  Row,
  Col,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import ThermalInvoicePrinter from "./ThermalInvoicePrinter";
// ✅ adjust import path if needed

const TablePaymentLookup = () => {
  const [tableNumber, setTableNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [paymentResponse, setPaymentResponse] = useState(null); // ✅ store response for printing

  // Payment form fields
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cardNumber, setCardNumber] = useState("");
  const [discount, setDiscount] = useState(0);

  // History modal
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const navigate = useNavigate();
  const printerRef = useRef(); // ✅ ref to control ThermalInvoicePrinter

  // Fetch pending orders for a table
  const fetchTableOrders = async () => {
    if (!tableNumber) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await API.get(`/table-pending-orders/${tableNumber}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch table orders");
    } finally {
      setLoading(false);
    }
  };

  const handleLookupSubmit = (e) => {
    e.preventDefault();
    fetchTableOrders();
  };

  const getTableLabel = (tableNum) => {
    return tableNum == 20 ? "Take0ut" : tableNum;
  };

  const calculateTotal = () => {
    if (!data?.orders) return 0;
    return data.orders.reduce((total, order) => {
      return (
          total +
          order.items.reduce(
              (sum, item) => sum + Number(item.price) * Number(item.quantity),
              0
          )
      );
    }, 0);
  };

  const calculateDiscountedTotal = () => {
    return calculateTotal() - parseFloat(discount || 0);
  };

  // ✅ Payment submission with invoice data capture
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!tableNumber) return;
    setSaving(true);
    setSuccess(null);
    setError(null);
    setPaymentResponse(null);

    try {
      const res = await API.put("/table-pay", {
        table_number: tableNumber,
        payment_method: paymentMethod,
        card_number: paymentMethod === "card" ? cardNumber : null,
        discount: parseFloat(discount || 0),
        total: calculateDiscountedTotal(),
      });

      setSuccess("✅ Payment successful!");
      setPaymentResponse(res.data); // ✅ Save payment response for invoice
      setData(null);
      setDiscount(0);
      setCardNumber("");
      setPaymentMethod("cash");
    } catch (err) {
      console.error(err);
      setError("❌ Payment failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Fetch payment history for table
  const fetchPaymentHistory = async () => {
    if (!tableNumber) return;
    setHistoryLoading(true);
    setHistory([]);
    try {
      const res = await API.get("/payment-history", {
        params: { table_number: tableNumber },
      });
      setHistory(res.data.payments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleShowHistory = () => {
    setShowHistory(true);
    fetchPaymentHistory();
  };

  const handleCloseHistory = () => {
    setShowHistory(false);
    setHistory([]);
  };

  const goToFullHistory = (tableNum) => {
    navigate(`/payment-history?table=${tableNum}`);
  };

  return (
      <div className="p-4">
        <h2 className="mb-4">💰 Payment</h2>

        <Row>
          {/* LEFT SIDE: Lookup + Payment */}
          <Col md={4}>
            {/* Lookup Form */}
            <Form onSubmit={handleLookupSubmit}>
              <Form.Group className="mb-2">
                <Form.Label>Table Number</Form.Label>
                <Form.Control
                    type="text"
                    placeholder="Enter table number"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                />
              </Form.Group>
              <div className="d-flex gap-2 mb-3">
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? (
                      <Spinner animation="border" size="sm" />
                  ) : (
                      "Fetch Orders"
                  )}
                </Button>
                <Button
                    variant="outline-secondary"
                    onClick={handleShowHistory}
                    disabled={!tableNumber}
                >
                  View History
                </Button>
              </div>
            </Form>

            {error && <Alert variant="danger">{error}</Alert>}

            {success && (
                <>
                  <Alert variant="success">{success}</Alert>
                  {paymentResponse && (
                      <div className="text-center mb-3">
                        <Button
                            variant="outline-primary"
                            onClick={() => printerRef.current?.printInvoice()}
                        >
                          🖨️ Print Invoice
                        </Button>
                      </div>
                  )}
                </>
            )}

            {/* Payment Form */}
            {data && (
                <div className="border rounded p-3 mt-3 bg-light">
                  <p>
                    <strong>Table:</strong> {getTableLabel(data.table_number)} <br />
                    <strong>Pending Orders:</strong> {data.order_count}
                  </p>

                  <p>
                    <strong>Total:</strong> ¥{calculateTotal().toFixed(0)}
                  </p>

                  <Form onSubmit={handlePaymentSubmit}>
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
                      <strong>After Discount:</strong> ¥
                      {calculateDiscountedTotal().toFixed(0)}
                    </p>

                    <Form.Group className="mb-2">
                      <Form.Label>Payment Method</Form.Label>
                      <Form.Select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="qr">QR Code</option>
                      </Form.Select>
                    </Form.Group>

                    {paymentMethod === "card" && (
                        <Form.Group className="mb-3">
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
                        type="submit"
                        disabled={saving}
                        className="w-100"
                    >
                      {saving ? "Processing..." : "Make Payment"}
                    </Button>
                  </Form>
                </div>
            )}
          </Col>

          {/* RIGHT SIDE: Orders */}
          <Col md={8}>
            {data && (
                <div className="border rounded p-3 bg-white shadow-sm">
                  <h5 className="mb-3">🧾 Orders for Table {getTableLabel(data.table_number)}</h5>
                  {data.orders.map((order) => (
                      <div key={order.id} className="mb-3 border-bottom pb-2">
                        <div className="d-flex justify-content-between">
                          <strong>Order #{order.id}</strong>
                          <span>Status: {order.status}</span>
                        </div>

                        <Table striped bordered hover size="sm" className="mt-2">
                          <thead>
                          <tr>
                            <th>Item</th>
                            <th>Sub-items</th>
                            <th>Unit Price</th>
                            <th>Qty</th>
                            <th>Price</th>
                          </tr>
                          </thead>
                          <tbody>
                          {order.items.map((item, idx) => (
                              <tr key={idx}>
                                <td>{item.name}</td>
                                <td>
                                  {item.meta?.slots?.length > 0 ? (
                                      <ul
                                          style={{
                                            listStyle: "none",
                                            padding: 0,
                                            margin: 0,
                                          }}
                                      >
                                        {item.meta.slots.map((s, i) => (
                                            <li key={i}>
                                              {s.food_name}
                                              {s.additional_price > 0 &&
                                                  ` (+¥${s.additional_price})`}
                                            </li>
                                        ))}
                                      </ul>
                                  ) : (
                                      "-"
                                  )}
                                </td>
                                <td>¥{Number(item.price).toFixed(0)}</td>
                                <td>{item.quantity}</td>
                                <td>
                                  ¥{(Number(item.price) * item.quantity).toFixed(0)}
                                </td>
                              </tr>
                          ))}
                          </tbody>
                        </Table>
                      </div>
                  ))}

                  <div className="text-end mt-3">
                    <h5>Total: ¥{calculateTotal().toFixed(0)}</h5>
                    <p>
                      Last Order At:{" "}
                      {new Date(data.last_order_at).toLocaleString()}
                    </p>
                  </div>
                </div>
            )}
          </Col>
        </Row>

        {/* Payment History Modal */}
        <Modal show={showHistory} onHide={handleCloseHistory} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Payment History - Table {getTableLabel(tableNumber)}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {historyLoading ? (
                <div className="text-center p-3">
                  <Spinner animation="border" />
                </div>
            ) : history.length > 0 ? (
                <Table striped bordered hover responsive size="sm">
                  <thead>
                  <tr>
                    <th>Date</th>
                    <th>Payment Method</th>
                    <th>Total</th>
                    <th>Discount</th>
                    <th>Paid</th>
                    <th>Card Number</th>
                    <th>Action</th>
                  </tr>
                  </thead>
                  <tbody>
                  {history.map((p) => (
                      <tr key={p.id}>
                        <td>{new Date(p.created_at).toLocaleString()}</td>
                        <td>{p.payment_method}</td>
                        <td>¥{p.total_amount}</td>
                        <td>¥{p.discount}</td>
                        <td>¥{p.paid_amount}</td>
                        <td>{p.card_number || "-"}</td>
                        <td>
                          <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => goToFullHistory(p.table_number)}
                          >
                            View Full History
                          </Button>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </Table>
            ) : (
                <p className="text-center m-0">
                  No payment history found for this table.
                </p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseHistory}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* ✅ Hidden Printer */}
        {paymentResponse && (
            <ThermalInvoicePrinter ref={printerRef} data={paymentResponse} />
        )}
      </div>
  );
};

export default TablePaymentLookup;
