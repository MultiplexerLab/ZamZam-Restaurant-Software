// src/components/AddToCartSidebar.jsx
import React, { useState, useEffect } from "react";
import {
    ListGroup,
    Button,
    InputGroup,
    FormControl,
    Modal,
    Spinner,
    Alert,
    Table,
} from "react-bootstrap";
import { Trash2, Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../services/api";

const AddToCartSidebar = ({
                              cart,
                              user,
                              onClose,
                              handleQuantityChange,
                              handleRemoveFromCart,
                              handleIncrement,
                              handleDecrement,
                              handleOpenCheckout,
                          }) => {
    const [showOrdersModal, setShowOrdersModal] = useState(false);
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [ordersError, setOrdersError] = useState(null);

    const SPICE_LEVELS = [
        { value: "mild", label: "1 マイルド (MILD)" },
        { value: "medium", label: "2 普通 (MEDIUM)" },
        { value: "hot", label: "3 中辛 (HOT)" },
        { value: "very_hot", label: "4 大辛 (VERY HOT)" },
        { value: "super_hot", label: "5 激辛 (SUPER HOT)" },
    ];

    const getSpiceLabel = (level) => {
        const found = SPICE_LEVELS.find((l) => l.value === level);
        return found ? found.label : level || "";
    };

    const renderSpiceChili = (level) => {
        const index = SPICE_LEVELS.findIndex((l) => l.value === level);
        if (index === -1) return null;
        return "🌶".repeat(index + 1) ;
    };

    const sidebarVariants = {
        hidden: { x: "100%" },
        visible: { x: 0 },
        exit: { x: "100%" },
    };

    // Fetch orders when modal opens
    useEffect(() => {
        if (!showOrdersModal) return;

        const fetchOrders = async () => {
            try {
                setLoadingOrders(true);
                setOrdersError(null);

                // Use centralized API service
                const res = await API.get("/user-orders");
                setOrders(res.data.data || []);
            } catch (err) {
                setOrdersError(err.response?.data?.message || "Failed to load orders.");
            } finally {
                setLoadingOrders(false);
            }
        };

        fetchOrders();
    }, [showOrdersModal]);

    // Compute cumulative total
    const cumulativeTotal = orders.reduce((sum, order) => sum + Number(order.total), 0);

    return (
        <>
            <AnimatePresence>
                <motion.div
                    className="position-fixed top-0 end-0 vh-100 bg-white shadow p-3 d-flex flex-column"
                    style={{width: "20vw", zIndex: 1060}}
                    variants={sidebarVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{type: "tween", duration: 0.3}}
                >
                    {/* Header */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            backgroundColor: "#ffffff",
                            padding: "1rem",
                            borderRadius: "12px",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                            marginBottom: "1rem",
                        }}
                    >
                        {/* Left side: Table No and Add to Cart */}
                        <div>
                            <h4 style={{fontSize: "1.5rem", fontWeight: "600", color: "#333", margin: 0}}>
                                {user?.table == 20 ? "TakeOut" : `Table No: ${user?.table || ""}`}
                            </h4>
                            <h5 style={{fontSize: "1.1rem", fontWeight: "500", color: "#555", margin: 0}}>
                                Add to Cart
                            </h5>
                        </div>


                        {/* Right side: My Orders button, only if at least one order exists */}
                        {(
                            <Button
                                variant="outline-primary"
                                onClick={() => setShowOrdersModal(true)}
                            >
                                My Orders
                            </Button>
                        )}
                    </div>

                    {/* Cart Items */}
                    <div className="flex-grow-1 overflow-auto">
                        <ListGroup>
                            {cart.map((c) => (
                                <ListGroup.Item
                                    key={c.id}
                                    className="d-flex justify-content-between align-items-center"
                                >
                                    <div style={{flex: 1}}>
                                        <strong>{c.title}</strong>
                                        <div className="text-muted">{c.jp}</div>
                                        <div className="text-warning small">¥{c.price.toFixed(0)} / item</div>

                                        {c.type === "set_menu" && c.items?.length > 0 && (
                                            <ListGroup className="mb-1 mt-1">
                                                {c.items.map((i, idx) => (
                                                    <ListGroup.Item key={idx} className="py-1 px-2 small">
                                                        {i.name} ({i.japanese_name || i.jp})
                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                        )}

                                        <div className="d-flex align-items-center mt-1">
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={() => handleDecrement(c)}
                                            >
                                                <Minus size={16}/>
                                            </Button>
                                            <InputGroup size="sm" className="mx-1" style={{width: "50px"}}>
                                                <FormControl
                                                    value={c.quantity}
                                                    onChange={(e) =>
                                                        handleQuantityChange(c.id, parseInt(e.target.value))
                                                    }
                                                />
                                            </InputGroup>
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={() => handleIncrement(c)}
                                            >
                                                <Plus size={16}/>
                                            </Button>
                                        </div>
                                    </div>

                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleRemoveFromCart(c.id)}
                                    >
                                        <Trash2 size={16}/>
                                    </Button>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </div>

                    {/* Footer Buttons */}
                    <div className="mt-3 text-center">
                        <h5 style={{fontSize: "2rem", fontWeight: "700"}}>
                            Total: ¥
                            {cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(0)}
                        </h5>

                        <Button
                            className="w-100 mb-2"
                            onClick={handleOpenCheckout}
                            disabled={cart.length === 0}
                            style={{
                                height: "100px",           // taller button
                                fontSize: "2.6rem",       // larger text inside button
                                fontWeight: "700",        // make it bold
                            }}
                        >
                            Checkout
                        </Button>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* --- My Orders Modal --- */}
            <Modal
                show={showOrdersModal}
                onHide={() => setShowOrdersModal(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>My Orders</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loadingOrders && (
                        <div className="text-center">
                            <Spinner animation="border"/> Loading orders...
                        </div>
                    )}

                    {ordersError && <Alert variant="danger">{ordersError}</Alert>}

                    {!loadingOrders && !ordersError && orders.length === 0 && (
                        <Alert variant="info">No orders found.</Alert>
                    )}

                    {!loadingOrders &&
                        orders.length > 0 &&
                        orders.map((order) => (
                            <div key={order.id} className="mb-3 p-2 border rounded">
                                <div className="d-flex justify-content-between mb-2">
                                    <strong>Order #{order.id}</strong>
                                    <span>Status: {order.status}</span>
                                </div>

                                <Table striped bordered hover size="sm">
                                    <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Sub-items</th> {/* Column for set menu sub-items */}
                                        <th>Unit Price</th>
                                        <th>Qty</th>
                                        <th>Price</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {order.items.map((item, idx) => {

                                        return (
                                            <tr key={idx}>
                                                <td>{item.title}  {item.spice_level && (
                                                    <span style={{ color: "#ff4500", fontSize: "0.9rem" }}>
                      {renderSpiceChili(item.spice_level)} ({getSpiceLabel(item.spice_level)})
                    </span>
                                                )}</td>
                                                <td>
                                                    {item.meta?.slots?.length > 0 ? (
                                                        <ul className="mb-0 p-0" style={{listStyle: "none"}}>
                                                            {item.meta.slots.map((s, i) => (
                                                                <li key={i}>
                                                                    {s.food_name}  {s.spice_level && (
                                                                    <span style={{ color: "#ff4500", fontSize: "0.9rem" }}>
                      {renderSpiceChili(s.spice_level)} ({getSpiceLabel(s.spice_level)})
                    </span>
                                                                )} {s.additional_price > 0 && `( +¥${s.additional_price})`}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>
                                                <td>¥{(item.price * 1).toFixed(0)}</td>
                                                <td>{item.quantity}</td>
                                                <td>¥{(item.price * item.quantity).toFixed(0)}</td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </Table>

                                {/* Dynamic total calculated from items */}
                                <div className="text-end">
                                    <strong>
                                        Total: ¥
                                        {order.items
                                            .reduce((sum, item) => sum + item.price * item.quantity, 0)
                                            .toFixed(0)}
                                    </strong>
                                </div>
                            </div>
                        ))}

                    {orders.length > 0 && (
                        <div className="mt-3 text-end">
                            <h5>
                                🧾 Cumulative Total: ¥
                                {orders
                                    .reduce(
                                        (sum, order) =>
                                            sum + order.items.reduce((s, item) => s + item.price * item.quantity, 0),
                                        0
                                    )
                                    .toFixed(0)}
                            </h5>
                        </div>
                    )}
                </Modal.Body>

            </Modal>
        </>
    );
};

export default AddToCartSidebar;
