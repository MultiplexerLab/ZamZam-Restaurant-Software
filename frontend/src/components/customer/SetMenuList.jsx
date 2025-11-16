import React, { useState } from "react";
import { Card, Button, Modal, Form } from "react-bootstrap";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function SetMenuList({ setMenu, handleAddToCart }) {
    const [showModal, setShowModal] = useState(false);
    const [currentSlot, setCurrentSlot] = useState(null);
    const [selectedFood, setSelectedFood] = useState({});
    const [quantities, setQuantities] = useState({});

    const handleOpenModal = (slot) => {
        setCurrentSlot(slot);
        if (slot.type === "choosable") {
            setQuantities((prev) => ({ ...prev, [slot.id]: slot.quantity }));
        } else if (slot.type === "changeable") {
            setSelectedFood((prev) => ({ ...prev, [slot.id]: slot.default_food_id }));
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setCurrentSlot(null);
        setShowModal(false);
    };

    const handleSelectFood = (slotId, foodId) => {
        setSelectedFood((prev) => ({ ...prev, [slotId]: foodId }));
    };

    const handleQuantityChange = (slotId, value) => {
        setQuantities((prev) => ({ ...prev, [slotId]: value }));
    };

    const calculatePrice = () => {
        let total = setMenu.base_price;
        setMenu.slots.forEach((slot) => {
            if (slot.type === "changeable") {
                const selectedId = selectedFood[slot.id] || slot.default_food_id;
                if (selectedId !== slot.default_food_id) {
                    total += parseFloat(slot.additional_price || 0);
                }
            } else if (slot.type === "choosable") {
                const qty = quantities[slot.id] || slot.quantity;
                // price not affected for choosable by default
            }
        });
        return total;
    };

    const handleAddMenuToCart = () => {
        handleAddToCart(
            {
                ...setMenu,
                selectedFood,
                quantities,
                recalculatedPrice: calculatePrice(),
            },
            "set_menu"
        );
        handleCloseModal();
    };

    return (
        <Card className="mb-3">
            <Card.Body>
                <Card.Title>{setMenu.title}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">{setMenu.japanese_title}</Card.Subtitle>
                <Card.Text>Base Price: ¥{setMenu.base_price}</Card.Text>

                {/* List Slots */}
                <ul>
                    {setMenu.slots.map((slot) => (
                        <li key={slot.id}>
                            <strong>{slot.category.name}</strong> - {slot.type}
                            <Button
                                size="sm"
                                variant="primary"
                                className="ms-2"
                                onClick={() => handleOpenModal(slot)}
                            >
                                {slot.type === "changeable" ? "Change" : "Select"}
                            </Button>
                        </li>
                    ))}
                </ul>

                <p>Total Price: ¥{calculatePrice()}</p>

                <Button variant="success" onClick={handleAddMenuToCart}>
                    Add to Cart
                </Button>
            </Card.Body>

            {/* Modal for Changeable / Choosable */}
            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {currentSlot?.type === "changeable" ? "Change Item" : "Select Quantity"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {currentSlot && currentSlot.type === "changeable" && (
                        <Form.Select
                            value={selectedFood[currentSlot.id] || currentSlot.default_food_id}
                            onChange={(e) =>
                                handleSelectFood(currentSlot.id, parseInt(e.target.value))
                            }
                        >
                            {currentSlot.foods.map((food) => (
                                <option key={food.id} value={food.id}>
                                    {food.name} (¥{food.price})
                                </option>
                            ))}
                        </Form.Select>
                    )}

                    {currentSlot && currentSlot.type === "choosable" && (
                        <Form.Group>
                            <Form.Label>Quantity</Form.Label>
                            <Form.Control
                                type="number"
                                min={1}
                                max={currentSlot.quantity}
                                value={quantities[currentSlot.id] || currentSlot.quantity}
                                onChange={(e) =>
                                    handleQuantityChange(currentSlot.id, parseInt(e.target.value))
                                }
                            />
                        </Form.Group>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleCloseModal}>
                        Done
                    </Button>
                </Modal.Footer>
            </Modal>
        </Card>
    );
}
