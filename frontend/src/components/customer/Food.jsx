import React from "react";
import { Card, Button } from "react-bootstrap";
import { motion } from "framer-motion";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const DEFAULT_IMAGE = "";

const Food = ({ food, onSelect, handleAddToCart }) => {
    return (
        <motion.div
            layoutId={`food-${food.id}`}
            onClick={() => onSelect?.({ type: "food", data: food })}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            style={{
                cursor: "pointer",
                width: "100%",
                maxWidth: "500px", // Max width for the card
                maxHeight: "600px", // Max height
                margin: "0 auto",
            }}
        >
            <Card className="text-white shadow-sm rounded-4 overflow-hidden h-100">
                {/* Image as background */}
                <div
                    style={{
                        flex: 1,
                        backgroundImage: `url(${
                            food.images && food.images.length
                                ? `${BASE_URL}/storage/${food.images[0]}`
                                : DEFAULT_IMAGE
                        })`,
                        backgroundSize: "cover", // image fits container
                        backgroundPosition: "center",
                        height: "400px", // fixed image section height
                    }}
                />

                {/* Overlay info */}
                <Card.ImgOverlay
                    className="d-flex flex-column justify-content-between p-3"
                    style={{
                        background:
                            "linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, rgba(0,0,0,0) 100%)",
                        marginTop: "-80px", // overlay overlaps bottom of image
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            padding: "0.5rem",
                            borderRadius: "0.25rem",
                        }}
                    >
                        <Card.Title style={{ fontWeight: "700", fontSize: "1.2rem" }}>
                            {food.title}
                        </Card.Title>
                        <Card.Subtitle style={{ fontSize: "1rem", color: "#f0f0f0" }}>
                            {food.jp}
                        </Card.Subtitle>
                        <Card.Text style={{ fontWeight: "600", color: "#ffd700" }}>
                            ¥{food.price}
                        </Card.Text>
                    </div>

                    <div className="text-end mt-2">
                        <Button
                            variant="light"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(food, "food");
                            }}
                        >
                            Add to Cart
                        </Button>
                    </div>
                </Card.ImgOverlay>
            </Card>
        </motion.div>
    );
};

export default Food;
