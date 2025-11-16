// src/components/SetMenuItem.jsx
import React from "react";
import { Card, Button } from "react-bootstrap";
import { motion } from "framer-motion";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const DEFAULT_IMAGE = '';

const SetMenuItem = ({ menu, onSelect, handleAddToCart }) => {
    return (
        <div className="d-flex flex-column h-100">
            <motion.div
                layoutId={`set-${menu.id}`}
                onClick={() => onSelect({ type: "set_menu", data: menu })}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                style={{ cursor: "pointer", flex: 1 }}
            >
                <Card className="text-white shadow-sm">
                    <Card.Img src={BASE_URL + '/storage/' + menu.image} alt={menu.title} onError={e => e.target.src = DEFAULT_IMAGE} />
                    <Card.ImgOverlay className="d-flex flex-column justify-content-between">
                        <div
                            style={{
                                backgroundColor: "rgba(0, 0, 0, 0.6)", // semi-transparent dark background
                                padding: "0.5rem",
                                borderRadius: "0.25rem"
                            }}
                        >
                            <Card.Title>{menu.title}</Card.Title>
                            <Card.Subtitle>{menu.jp}</Card.Subtitle>
                            <Card.Text>¥{menu.cost}</Card.Text>
                        </div>
                        <Button variant="light" size="sm" onClick={e => {
                            e.stopPropagation();
                            handleAddToCart(menu, "set_menu");
                        }}>Add to Cart</Button>
                    </Card.ImgOverlay>
                </Card>
            </motion.div>
        </div>
    );
};

export default SetMenuItem;
