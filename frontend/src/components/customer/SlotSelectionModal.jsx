import React, { useEffect, useState } from "react";
import { Modal, Button, Card, Badge, Dropdown } from "react-bootstrap";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const SPICE_LEVELS = [
    { value: "mild", label: "1 🌶 (MILD)" },
    { value: "medium", label: "2 🌶🌶 (MEDIUM)" },
    { value: "hot", label: "3 🌶🌶🌶 (HOT)" },
    { value: "very_hot", label: "4 🌶🌶🌶🌶 (VERY HOT)" },
    { value: "super_hot", label: "5 🌶🌶🌶🌶🌶 (SUPER HOT)" },
];

const SlotSelectionModal = ({
                                show,
                                onHide,
                                activeSlot,
                                slotData,
                                selectedFoods,
                                handleFoodSelect,
                                handleConfirmSlot,
                            }) => {
    const [foodsToShow, setFoodsToShow] = useState([]);

    useEffect(() => {
        if (!activeSlot || !slotData) return;

        // Find foods for the current slot category from merged slot data
        const matchedCategory = slotData.find(
            (cat) => cat.id === activeSlot.category_id && cat.set_menu_id == activeSlot.id
        );

        setFoodsToShow(matchedCategory ? matchedCategory.foods : []);
    }, [activeSlot, slotData]);

    if (!activeSlot) return null;

    const renderSpiceDropdown = (food) => {
        if (activeSlot.category_id !== 9) return null;
        const currentSpice = food.spice_level || "";

        return (
            <Dropdown>
                <Dropdown.Toggle size="sm" variant="outline-light">
                    {currentSpice ? SPICE_LEVELS.find((l) => l.value === currentSpice)?.label : "Spice"}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    {SPICE_LEVELS.map((level) => (
                        <Dropdown.Item
                            key={level.value}
                            active={currentSpice === level.value}
                            onClick={() => {
                                food.spice_level = level.value;
                            }}
                        >
                            {level.label}
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            </Dropdown>
        );
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    {activeSlot.type === "changeable" ? "Change Item" : "Choose Item"}
                    {activeSlot.type === "choosable" && activeSlot.quantity && (
                        <span style={{ fontWeight: 500, marginLeft: 10 }}>
              (Select up to {activeSlot.quantity})
            </span>
                    )}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="d-flex flex-wrap">
                    {foodsToShow.map((food) => {
                        if (!food.set_menu_image) return null;
                        const isSelected = selectedFoods.find((f) => f.id === food.id);
                        const disableSelect =
                            activeSlot.type === "choosable" && !isSelected && selectedFoods.length >= activeSlot.quantity;

                        return (
                            <div
                                key={food.id}
                                className="me-2 mb-2"
                                style={{
                                    width: 140,
                                    cursor: disableSelect ? "not-allowed" : "pointer",
                                    opacity: disableSelect ? 0.5 : 1,
                                }}
                                onClick={() => !disableSelect && handleFoodSelect(food)}
                            >
                                <Card className={isSelected ? "border-primary" : ""} bg="dark" text="white">
                                    <Card.Img
                                        variant="top"
                                        src={food.images?.[0] ? `${BASE_URL}/storage/${food.set_menu_image}` : "/images/default-placeholder.jpg"}
                                        height={80}
                                        style={{ objectFit: "cover" }}
                                        onError={(e) => (e.target.src = "/images/default-placeholder.jpg")}
                                    />
                                    <Card.Body className="p-2 text-center">
                                        <Card.Title style={{ fontSize: 13 }}>{food.name}</Card.Title>
                                        {food.additional_price > 0 && (
                                            <Card.Text style={{ fontSize: 12, color: "#ffd700" }}>+¥{food.additional_price}</Card.Text>
                                        )}
                                        {activeSlot.type !== "fixed" && renderSpiceDropdown(food)}
                                        <Badge bg={isSelected ? "primary" : "secondary"}>
                                            {isSelected ? "Selected" : "Select"}
                                        </Badge>
                                    </Card.Body>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleConfirmSlot}>
                    Confirm
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default SlotSelectionModal;
