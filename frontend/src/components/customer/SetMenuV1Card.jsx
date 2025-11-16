import React, { useState } from "react";
import { Card, Button, Modal } from "react-bootstrap";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const DEFAULT_IMAGE = "/images/default-placeholder.jpg";

export default function SetMenuV1Card({ setMenu, handleAddToCart }) {
    const [slots, setSlots] = useState(() => {
        // Initialize slots with default selections
        return setMenu.slots.map(slot => ({
            ...slot,
            selected_food_id:
                slot.type === "choosable"
                    ? slot.foods?.[0]?.id || null // first item as default
                    : slot.default_food_id,
            selected_foods: slot.type === "choosable"
                ? [slot.foods?.[0] || null] // array for choosable
                : [],
        }));
    });

    const [showModal, setShowModal] = useState(false);
    const [activeSlot, setActiveSlot] = useState(null);

    const openSlotModal = slot => {
        setActiveSlot(slot);
        setShowModal(true);
    };

    const handleSelectFood = food => {
        setSlots(prev =>
            prev.map(s => {
                if (s.id === activeSlot.id) {
                    if (s.type === "changeable") {
                        return { ...s, selected_food_id: food.id };
                    }
                    if (s.type === "choosable") {
                        // toggle selection but enforce max quantity
                        let selectedFoods = [...s.selected_foods];
                        const exists = selectedFoods.find(f => f.id === food.id);
                        if (exists) {
                            selectedFoods = selectedFoods.filter(f => f.id !== food.id);
                        } else {
                            if (selectedFoods.length < s.quantity) {
                                selectedFoods.push(food);
                            }
                        }
                        return { ...s, selected_foods: selectedFoods };
                    }
                }
                return s;
            })
        );
    };

    const calculatePrice = () => {
        let total = setMenu.base_price;
        slots.forEach(slot => {
            if (slot.type === "changeable" && slot.selected_food_id !== slot.default_food_id) {
                total += parseFloat(slot.additional_price || 0);
            }
        });
        return total;
    };

    return (
        <>
            <Card className="mb-3">
                <Card.Body>
                    <Card.Title>{setMenu.title}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">{setMenu.japanese_title}</Card.Subtitle>
                    <Card.Text>Base Price: ¥{setMenu.base_price}</Card.Text>
                    <Card.Text>Total Price: ¥{calculatePrice()}</Card.Text>

                    {/* Slots */}
                    {slots.map(slot => (
                        <div key={slot.id} className="mb-2">
                            <strong>{slot.category.name}</strong>:{" "}
                            {slot.type === "changeable" && (
                                <>
                                    {slot.foods.find(f => f.id === slot.selected_food_id)?.name || "Select"}{" "}
                                    <Button size="sm" onClick={() => openSlotModal(slot)}>
                                        Change Item
                                    </Button>
                                </>
                            )}
                            {slot.type === "choosable" && (
                                <>
                                    {slot.selected_foods.map(f => f?.name).join(", ") || "Select"}{" "}
                                    <Button size="sm" onClick={() => openSlotModal(slot)}>
                                        Choose Item
                                    </Button>
                                </>
                            )}
                        </div>
                    ))}

                    <Button onClick={() => handleAddToCart({ ...setMenu, slots })}>
                        Add Set Menu to Cart
                    </Button>
                </Card.Body>
            </Card>

            {/* Modal for selecting foods */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {activeSlot?.type === "changeable" ? "Change Item" : "Choose Items"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {activeSlot?.foods?.map(food => {
                        const isSelected =
                            activeSlot.type === "changeable"
                                ? food.id === activeSlot.selected_food_id
                                : activeSlot.selected_foods.some(f => f?.id === food.id);
                        const disabled =
                            activeSlot.type === "choosable" &&
                            !isSelected &&
                            activeSlot.selected_foods.length >= activeSlot.quantity;

                        return (
                            <Card key={food.id} className="mb-2" style={{ cursor: "pointer" }}>
                                <Card.Body
                                    onClick={() => !disabled && handleSelectFood(food)}
                                    className={`d-flex justify-content-between align-items-center ${
                                        isSelected ? "bg-success text-white" : ""
                                    }`}
                                >
                                    <span>{food.name}</span>
                                    <span>¥{food.price}</span>
                                </Card.Body>
                            </Card>
                        );
                    })}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
