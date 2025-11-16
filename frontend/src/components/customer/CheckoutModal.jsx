import React, { useState, useEffect, useRef } from "react";
import { Button, ListGroup, ProgressBar } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";

const SPICE_LEVELS = [
    { value: "mild", label: "1 マイルド (MILD)" },
    { value: "medium", label: "2 普通 (MEDIUM)" },
    { value: "hot", label: "3 中辛 (HOT)" },
    { value: "very_hot", label: "4 大辛 (VERY HOT)" },
    { value: "super_hot", label: "5 激辛 (SUPER HOT)" },
];

const renderSpiceChili = (level) => {
    const index = SPICE_LEVELS.findIndex((l) => l.value === level);
    if (index === -1) return null;
    return "🌶".repeat(index + 1);
};

const CheckoutModal = ({ show, onClose, cart, handleConfirmOrder }) => {
    const overlayVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
    const modalVariants = { hidden: { scale: 0.8, opacity: 0 }, visible: { scale: 1, opacity: 1 } };

    const [isConfirming, setIsConfirming] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const intervalRef = useRef(null);

    const handleConfirm = () => {
        if (isConfirming || intervalRef.current) return;

        setIsConfirming(true);
        setCountdown(10);

        intervalRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                    handleConfirmOrder();
                    setIsConfirming(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleCancelConfirm = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsConfirming(false);
        setCountdown(10);
    };

    useEffect(() => {
        if (!show && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setIsConfirming(false);
            setCountdown(10);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [show]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                    style={{ zIndex: 1070 }}
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                >
                    {/* Overlay */}
                    <motion.div
                        className="position-absolute top-0 start-0 w-100 h-100"
                        style={{ background: "rgba(0,0,0,0.5)" }}
                        onClick={!isConfirming ? onClose : undefined}
                    />

                    {/* Modal */}
                    <motion.div
                        className="bg-white rounded shadow p-4 position-relative"
                        style={{ width: "90%", maxWidth: "500px", zIndex: 1080 }}
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        {!isConfirming ? (
                            <>
                                <h4>Order Review / 注文の確認</h4>

                                <ListGroup className="mb-3">
                                    {cart.map((c) => (
                                        <ListGroup.Item key={c.id}>
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <strong>{c.title}</strong> ({c.quantity})
                                                    {/* Single food spice */}
                                                    {c.type === "food" && c.spice_level && (
                                                        <div style={{ color: "#ff4500", fontSize: "0.9rem" }}>
                                                            {renderSpiceChili(c.spice_level)} ({c.spice_level})
                                                        </div>
                                                    )}

                                                    {/* Set menu slots */}
                                                    {c.type === "set_menu" && c.slots?.length > 0 && (
                                                        <ListGroup className="mb-1 mt-1">
                                                            {c.slots.map((slot, idx) => (
                                                                <ListGroup.Item key={idx} className="py-1 px-2 small">
                                                                    <strong>{slot.slot_name}:</strong>
                                                                    {slot.chosen_foods.map((f, i) => (
                                                                        <div key={i}>
                                                                            {f.name}{" "}
                                                                            {f.spice_level && (
                                                                                <span style={{ color: "#ff4500" }}>
                                                                                    {renderSpiceChili(f.spice_level)} ({f.spice_level})
                                                                                </span>
                                                                            )}
                                                                            {f.additional_cost > 0 &&
                                                                                `( +¥${f.additional_cost.toFixed(2)} )`}
                                                                        </div>
                                                                    ))}
                                                                </ListGroup.Item>
                                                            ))}
                                                        </ListGroup>
                                                    )}

                                                    <div>¥{(c.price * c.quantity).toFixed(2)}</div>
                                                </div>
                                            </div>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>

                                <h5>
                                    Total: ¥
                                    {cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                                </h5>

                                <div className="d-flex justify-content-end mt-3">
                                    <Button variant="secondary" className="me-2" onClick={onClose}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" onClick={handleConfirm}>
                                        Confirm Order
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center">
                                <h5>✅ Your order will be placed in {countdown} seconds</h5>
                                <p>You can cancel if you changed your mind.</p>
                                <p>気が変わったらキャンセルできます.</p>
                                <ProgressBar
                                    now={(10 - countdown) * 10}
                                    label={`${10 - countdown}s`}
                                    className="mb-3"
                                />
                                <Button variant="danger" onClick={handleCancelConfirm}>
                                    Cancel Order / 注文をキャンセル
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CheckoutModal;
