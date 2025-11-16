// src/components/FoodItem.jsx
import React from "react";
import { Card, Button } from "react-bootstrap";
import { motion } from "framer-motion";
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const DEFAULT_IMAGE = '';

const FoodItem = ({ food, onSelect, handleAddToCart }) => {
    return (
        <div className="d-flex flex-column" style={{ height: '100%' }}>
            <motion.div
                layoutId={`food-${food.id}`}
                onClick={() => onSelect({ type: "food", data: food })}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                style={{ cursor: "pointer", height: '100%' }}
            >
                {/*<h1>h1 {food.images ? BASE_URL + '/storage/' + food.images[0] : DEFAULT_IMAGE}</h1>*/}

                <Card className="text-white shadow-sm">
                    <Card.Img
                        src={ food.images ? BASE_URL + '/storage/' + food.images[0] : DEFAULT_IMAGE}
                        alt={food.title}
                        onError={e => e.target.src = DEFAULT_IMAGE}
                    />
                    <Card.ImgOverlay className="d-flex flex-column justify-content-between">
                        <div
                            style={{
                                backgroundColor: "rgba(0, 0, 0, 0.6)", // semi-transparent dark background
                                padding: "0.5rem",
                                borderRadius: "0.25rem"
                            }}
                        >
                            <Card.Title style={{fontWeight: "700", fontSize: "1.1rem", color: "#fff"}}>
                                {food.title}
                            </Card.Title>
                            <Card.Subtitle style={{fontSize: "0.95rem", color: "#f0f0f0"}}>
                                {food.jp}
                            </Card.Subtitle>
                            <Card.Text style={{fontWeight: "600", color: "#ffd700"}}>
                                ¥{food.price}
                            </Card.Text>
                        </div>
                        <Button
                            variant="light"
                            size="sm"
                            onClick={e => {
                                e.stopPropagation();
                                handleAddToCart(food, "food");
                            }}
                        >
                            Add to Cart
                        </Button>
                    </Card.ImgOverlay>
                </Card>
            </motion.div>
        </div>
    );
};

export default FoodItem;
