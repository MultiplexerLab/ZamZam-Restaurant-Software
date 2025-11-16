import React, { useState, useEffect, useRef } from "react";
import { Table, Button, Form, Modal, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";

const OrderDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const printRefKitchen = useRef();
  const printRefCustomer = useRef();

  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await API.get("/orders", { params: { status: statusFilter } });
      setOrders(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrderById = async (orderId) => {
    setModalLoading(true);
    try {
      const res = await API.get(`/orders/${orderId}`);
      setSelectedOrder(res.data.data);
      setShowModal(true);
    } catch (err) {
      console.error("Failed to fetch order details:", err);
      alert("Failed to load order details.");
    } finally {
      setModalLoading(false);
    }
  };

  const handlePrint = (ref) => {
    if (!ref.current) return;
    const printContents = ref.current.innerHTML;
    const newWindow = window.open("", "_blank");
    newWindow.document.write(`
      <html>
        <head>
          <title>Print Order Token</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { text-align: center; }
            ul { list-style-type: none; padding-left: 0; }
            li { margin-bottom: 5px; }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    newWindow.document.close();
    newWindow.print();
  };

  const handlePrintBarcode = () => {
    if (!selectedOrder) return;
    const printWindow = window.open("", "_blank", "height=400,width=300");
    printWindow.document.write(`
      <html>
        <head>
          <title>Order #${selectedOrder.id}</title>
        </head>
        <body style="text-align:center;font-family:sans-serif;">
          <h2>Order #${selectedOrder.id}</h2>
          <svg id="barcode"></svg>
        </body>
      </html>
    `);
    printWindow.document.close();

    const script = printWindow.document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js";
    script.onload = () => {
      printWindow.JsBarcode(
        printWindow.document.getElementById("barcode"),
        `ORDER-${selectedOrder.id}`,
        { format: "CODE128", displayValue: true, width: 2, height: 50 }
      );
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
    printWindow.document.body.appendChild(script);
  };

  return (
    <div className="p-4">
      <h2>Order Management</h2>

      <Form.Select
        className="mb-3 w-auto"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </Form.Select>

      {loading ? (
        <Spinner animation="border" />
      ) : (
        <Table striped bordered hover responsive>
          <thead>
          <tr>
            <th>Date</th>
            <th>ID</th>
            {/*<th>User</th>*/}
            <th>Table</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
                <tr key={order.id}>
                  <td>{new Date(order.created_at).toLocaleString()}</td>
                  <td>{order.id}</td>
                  {/*<td>{order.user?.name || "N/A"}</td>*/}
                  <td>{order.table_number || ""}</td>
                  <td>{order.items?.length || 0}</td>
                  <td>¥{order.total}</td>
                  <td>{order.status}</td>
                  <td>
                    <Button
                        variant="info"
                        size="sm"
                        onClick={() => fetchOrderById(order.id)}
                    >
                      Generate Token
                    </Button>{" "}
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/cashier/order-details`)}
                    >
                      Generate Invoice
                    </Button>
                  </td>
                </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Order #{selectedOrder?.id || ""}
            {modalLoading && <Spinner animation="border" size="sm" className="ms-2" />}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && !modalLoading ? (
            <>
              {/*<p><strong>User:</strong> {selectedOrder.user?.name || "N/A"}</p>*/}
              <p><strong>Table:</strong> {selectedOrder.table_number || ""}</p>
              <p><strong>Status:</strong> {selectedOrder.status}</p>
              <p><strong>Total:</strong> ¥{selectedOrder.total}</p>

              <h5>Items:</h5>
              <ul>
                {selectedOrder.items?.map((item) => {
                  const subItems = item.meta?.sub_items || [];
                  return (
                    <li key={item.id}>
                      {item.title || item.name} x {item.quantity} (¥{item.price})
                      {subItems.length > 0 && (
                        <ul>
                          {subItems.map((sub) => (
                            <li key={sub.id || sub.name}>
                              {sub.name} ({sub.japanese_name || ""}) - ¥{sub.price || 0}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* Hidden print sections */}
              <div style={{ display: "none" }}>
                <div ref={printRefKitchen}>
                  <h2>Kitchen Token</h2>
                  <p>Order #: {selectedOrder.id}</p>
                  <ul>
                    {selectedOrder.items?.map((item) => {
                      const subItems = item.meta?.sub_items || [];
                      return (
                        <li key={item.id}>
                          {item.title || item.name} x {item.quantity}
                          {subItems.length > 0 && (
                            <ul>
                              {subItems.map((sub) => (
                                <li key={sub.id || sub.name}>
                                  {sub.name} ({sub.japanese_name || ""})
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div ref={printRefCustomer}>
                  <h2>Customer Token</h2>
                  <p>Order #: {selectedOrder.id}</p>
                  <p>Total: ¥{selectedOrder.total}</p>
                  <ul>
                    {selectedOrder.items?.map((item) => {
                      const subItems = item.meta?.sub_items || [];
                      return (
                        <li key={item.id}>
                          {item.title || item.name} x {item.quantity} (¥{item.price})
                          {subItems.length > 0 && (
                            <ul>
                              {subItems.map((sub) => (
                                <li key={sub.id || sub.name}>
                                  {sub.name} ({sub.japanese_name || ""})
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <p>Loading order details...</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handlePrintBarcode}>Print Token</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OrderDashboard;
