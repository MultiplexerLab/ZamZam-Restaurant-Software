import React, { useState, useEffect } from "react";
import { Button, Table, Spinner, Alert, Form } from "react-bootstrap";
import API from "../../services/api";

const CashierSingleOrder = () => {
    const [orderId, setOrderId] = useState("");
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState("");
    const [typingTimeout, setTypingTimeout] = useState(null);

    const SPICE_LEVELS = [
        { value: "mild", label: "1 マイルド (MILD)" },
        { value: "medium", label: "2 普通 (MEDIUM)" },
        { value: "hot", label: "3 中辛 (HOT)" },
        { value: "very_hot", label: "4 大辛 (VERY HOT)" },
        { value: "super_hot", label: "5 激辛 (SUPER HOT)" },
    ];

    const getSpiceLabel = (level) => {
        const spice = SPICE_LEVELS.find((s) => s.value === level);
        return spice ? spice.label : "";
    };

    const renderSpiceChili = (level) => {
        if (!level) return null;
        const chiliIcons = {
            mild: "🌶️",
            medium: "🌶️🌶️",
            hot: "🌶️🌶️🌶️",
            very_hot: "🌶️🌶️🌶️🌶️",
            super_hot: "🌶️🌶️🌶️🌶️🌶️",
        };
        return <span>{chiliIcons[level] || "🌶️"}</span>;
    };

    const calculateItemTotal = (item) => item.price * item.quantity;

    const fetchOrder = async (id) => {
        if (!id) return;
        setLoading(true);
        setError("");
        setOrder(null);
        try {
            const res = await API.get(`/orders/${id}`);
            setOrder(res.data.data);
        } catch (err) {
            setError("⚠️ Failed to fetch order. Please check the ID.");
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (newStatus) => {
        if (!order) return;
        setUpdating(true);
        try {
            await API.put(`/orders/${order.id}/status`, { status: newStatus });
            setOrder({ ...order, status: newStatus });
            alert("✅ Order status updated successfully!");
        } catch (err) {
            alert("❌ Failed to update order status!");
        } finally {
            setUpdating(false);
        }
    };

    // Automatically fetch when cashier types (with debounce)
    useEffect(() => {
        if (typingTimeout) clearTimeout(typingTimeout);
        if (!orderId) return;
        const timeout = setTimeout(() => fetchOrder(orderId), 700);
        setTypingTimeout(timeout);
    }, [orderId]);

    return (
        <div className="p-4">
            <h3>🔍 Search Single Order</h3>
            <div className="d-flex gap-2 mb-4">
                <Form.Control
                    type="number"
                    placeholder="Enter Order ID"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    style={{ maxWidth: "200px" }}
                />
                <Button onClick={() => fetchOrder(orderId)} disabled={loading}>
                    {loading ? <Spinner size="sm" /> : "Search"}
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {order && (
                <div className="border rounded p-3">
                    <h5>
                        Order #{order.id} – Table {order.table_number}
                    </h5>
                    <p>
                        Status:{" "}
                        <strong
                            className={`text-${order.status === "completed" ? "success" : "warning"}`}
                        >
                            {order.status}
                        </strong>
                    </p>
                    <p>
                        🕒 Created: {new Date(order.created_at).toLocaleString()} <br />
                        🔄 Updated: {new Date(order.updated_at).toLocaleString()}
                    </p>

                <div className="d-flex gap-2 mb-3">
                    <Button
                        variant={order.status === "pending" ? "secondary" : "outline-secondary"}
                        disabled={updating || order.status === "pending"}
                        onClick={() => updateStatus("pending")}
                    >
                        🕒 Pending
                    </Button>
                    <Button
                        variant={order.status === "preparing" ? "warning" : "outline-warning"}
                        disabled={updating || order.status === "preparing"}
                        onClick={() => updateStatus("preparing")}
                    >
                        👨‍🍳 Preparing
                    </Button>
                    <Button
                        variant={order.status === "completed" ? "success" : "outline-success"}
                        disabled={updating || order.status === "completed"}
                        onClick={() => updateStatus("completed")}
                    >
                        ✅ Completed
                    </Button>
                </div>

                    <Table bordered striped hover>
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
                                <td>
                                    {item.title}{" "}
                                    {item.spice_level && (
                                        <span style={{ color: "#ff4500", fontSize: "0.9rem" }}>
                        {renderSpiceChili(item.spice_level)} (
                                            {getSpiceLabel(item.spice_level)})
                      </span>
                                    )}
                                </td>
                                <td>
                                    {item.meta?.slots?.length > 0 ? (
                                        <ul style={{ listStyle: "none", padding: 0 }}>
                                            {item.meta.slots.map((s, i) => (
                                                <li key={i}>
                                                    {s.food_name}{" "}
                                                    {s.spice_level && (
                                                        <span style={{ color: "#ff4500", fontSize: "0.9rem" }}>
                                {renderSpiceChili(s.spice_level)} (
                                                            {getSpiceLabel(s.spice_level)})
                              </span>
                                                    )}
                                                    {s.additional_price > 0 && ` (+¥${s.additional_price})`}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        "-"
                                    )}
                                </td>
                                <td>¥{item.price.toFixed(0)}</td>
                                <td>{item.quantity}</td>
                                <td>¥{calculateItemTotal(item).toFixed(0)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>

                    <div className="text-end">
                        <strong>
                            Total: ¥
                            {order.items
                                .reduce((sum, item) => sum + calculateItemTotal(item), 0)
                                .toFixed(0)}
                        </strong>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashierSingleOrder;
