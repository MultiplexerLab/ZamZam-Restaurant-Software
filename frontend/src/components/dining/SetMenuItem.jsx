// src/components/SetMenuItem.jsx
import React from "react";
import { Card, Button } from "react-bootstrap";
import { motion } from "framer-motion";

const SetMenuItem = ({ menu, onSelect, onAddToCart }) => {
    const DEFAULT_IMAGE = "http://localhost:8000/storage/branches/fNHLxMdBltb9GgL7kmZHzhym9dsPM2194SDCUAQi.jpg";

    return (
        <motion.div
            layoutId={`set-${menu.id}`}
            onClick={() => onSelect(menu)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            style={{ cursor: "pointer" }}
        >
            <Card className="text-white shadow-sm">
                <Card.Img
                    src={menu.image || DEFAULT_IMAGE}
                    alt={menu.title}
                    onError={(e) => e.target.src = DEFAULT_IMAGE}
                />
                <Card.ImgOverlay className="d-flex flex-column justify-content-between">
                    <div>
                        <Card.Title>{menu.title}</Card.Title>
                        <Card.Subtitle>{menu.jp}</Card.Subtitle>
                        <Card.Text>${menu.cost}</Card.Text>
                    </div>
                    <Button
                        variant="light"
                        size="sm"
                        onClick={e => {
                            e.stopPropagation();
                            onAddToCart(menu, "set_menu");
                        }}
                    >
                        Add to Cart
                    </Button>
                </Card.ImgOverlay>
            </Card>
        </motion.div>
    );
};

export default SetMenuItem;
