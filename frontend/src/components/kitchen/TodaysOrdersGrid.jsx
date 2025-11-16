import React, { useEffect, useState } from "react";
import { Table, Spinner, Alert, Badge, Button, Modal, Form, InputGroup } from "react-bootstrap";
import API from "../../services/api";

const TodaysOrdersGrid = ({ renderSpiceChili, getSpiceLabel, refreshTrigger }) => {
    const [todayOrders, setTodayOrders] = useState([]);
    const [loadingToday, setLoadingToday] = useState(true);
    const [todayError, setTodayError] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [updating, setUpdating] = useState(false);

    // Helper for totals
    const computeOrderTotal = (order) => {
        return order.items.reduce((sum, item) => {
            const extras =
                item.meta?.slots?.reduce(
                    (s, slot) => s + (slot.additional_price || 0),
                    0
                ) || 0;
            return sum + (item.price + extras) * item.quantity;
        }, 0);
    };

    // Fetch Today's Orders
    const fetchTodayOrders = async () => {
        try {
            const today = new Date().toISOString().split("T")[0];
            const res = await API.get(`/orders?date=${today}`);
            setTodayOrders(res.data.data || []);
        } catch (err) {
            console.error(err);
            setTodayError("⚠️ Failed to fetch today's orders.");
        } finally {
            setLoadingToday(false);
        }
    };

    useEffect(() => {
        fetchTodayOrders();
    }, [refreshTrigger]);

    // Filter Orders by Search Term
    const filteredOrders = todayOrders.filter((order) =>
        order.id.toString().includes(searchTerm.trim())
    );

    // Update Order Status inside Modal
    const updateStatus = async (newStatus) => {
        if (!selectedOrder) return;
        setUpdating(true);
        try {
            await API.put(`/orders/${selectedOrder.id}/status`, { status: newStatus });
            setSelectedOrder({ ...selectedOrder, status: newStatus });
            setTodayOrders((prev) =>
                prev.map((o) =>
                    o.id === selectedOrder.id ? { ...o, status: newStatus } : o
                )
            );
            alert("✅ Order status updated successfully!");
        } catch (err) {
            console.error(err);
            alert("❌ Failed to update order status!");
        } finally {
            setUpdating(false);
        }
    };

    // Determine button style based on current order status
    const getButtonProps = (statusType) => {
        if (!selectedOrder) return { variant: "outline-secondary", disabled: true };
        const { status } = selectedOrder;

        switch (statusType) {
            case "pending":
                return { variant: "secondary", disabled: true }; // always disabled
            case "preparing":
                return {
                    variant: status === "pending" ? "warning" : "outline-warning",
                    disabled: updating || status !== "pending",
                };
            case "completed":
                return {
                    variant: status === "preparing" ? "success" : "outline-success",
                    disabled: updating || status === "pending",
                };
            default:
                return { variant: "outline-secondary", disabled: true };
        }
    };

    return (
        <>
            <hr className="my-4" />
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
                <h4 className="mb-2 mb-md-0">📅 Today's Orders</h4>
                <Form className="d-flex" style={{ maxWidth: "250px" }}>
                    <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Search by Order ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                </Form>
            </div>

            {loadingToday ? (
                <div className="text-center">
                    <Spinner animation="border" /> Loading today’s orders...
                </div>
            ) : todayError ? (
                <Alert variant="danger">{todayError}</Alert>
            ) : filteredOrders.length === 0 ? (
                <Alert variant="info">No matching orders found.</Alert>
            ) : (
                <Table striped bordered hover responsive size="sm" className="mt-3">
                    <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Table</th>
                        <th>Items</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredOrders.map((order) => (
                        <tr key={order.id}>
                            <td>#{order.id}</td>
                            <td>{order.table_number}</td>
                            <td>{order.items.length}</td>
                            <td>
                                <Badge
                                    bg={
                                        order.status === "pending"
                                            ? "warning"
                                            : order.status === "preparing"
                                                ? "primary"
                                                : "success"
                                    }
                                >
                                    {order.status}
                                </Badge>
                            </td>
                            <td>
                                <Button
                                    variant="info"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedOrder(order);
                                        setShowModal(true);
                                    }}
                                >
                                    🔍 View Details
                                </Button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
            )}

            {/* Details Modal */}
            {selectedOrder && (
                <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Order #{selectedOrder.id}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {/* Status Buttons */}
                        <div className="d-flex gap-3 mb-3 flex-wrap">
                            <Button
                                {...getButtonProps("pending")}
                                className="fs-5 px-4 py-2"
                            >
                                🕒 Pending
                            </Button>

                            <Button
                                {...getButtonProps("preparing")}
                                onClick={() => updateStatus("preparing")}
                                className="fs-5 px-4 py-2"
                            >
                                👨‍🍳 Preparing
                            </Button>

                            <Button
                                {...getButtonProps("completed")}
                                onClick={() => updateStatus("completed")}
                                className="fs-5 px-4 py-2"
                            >
                                ✅ Completed
                            </Button>
                        </div>

                        <p>
                            <strong>Table:</strong> {selectedOrder.table_number}
                        </p>
                        <p>
                            <strong>Time:</strong>{" "}
                            {new Date(selectedOrder.created_at).toLocaleString()}
                        </p>

                        <Table striped bordered size="sm">
                            <thead>
                            <tr>
                                <th>Item</th>
                                <th>Sub-items</th>
                                <th>Qty</th>
                                <th>Price</th>
                            </tr>
                            </thead>
                            <tbody>
                            {selectedOrder.items.map((item, i) => (
                                <tr key={i}>
                                    <td>
                                        {item.title}{" "}
                                        {item.spice_level && (
                                            <span style={{ color: "#ff4500", fontSize: "0.8rem" }}>
                                                    {renderSpiceChili(item.spice_level)} (
                                                {getSpiceLabel(item.spice_level)})
                                                </span>
                                        )}
                                    </td>
                                    <td>
                                        {item.meta?.slots?.length > 0 ? (
                                            <ul className="mb-0 p-0" style={{ listStyle: "none" }}>
                                                {item.meta.slots.map((s, j) => (
                                                    <li key={j}>
                                                        {s.food_name}{" "}
                                                        {s.spice_level && (
                                                            <span style={{ color: "#ff4500", fontSize: "0.8rem" }}>
                                                                    {renderSpiceChili(s.spice_level)} (
                                                                {getSpiceLabel(s.spice_level)})
                                                                </span>
                                                        )}{" "}
                                                        {s.additional_price > 0 && `( +¥${s.additional_price})`}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            "-"
                                        )}
                                    </td>
                                    <td>{item.quantity}</td>
                                    <td>¥{(item.price * item.quantity).toFixed(0)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>

                        <div className="text-end mt-3">
                            <strong>Total: ¥{computeOrderTotal(selectedOrder).toFixed(0)}</strong>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}
        </>
    );
};

export default TodaysOrdersGrid;
