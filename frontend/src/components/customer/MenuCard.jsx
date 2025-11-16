import React, { useState, useEffect } from "react";
import { Card, Button, Badge } from "react-bootstrap";
import API from "../../services/api";
import SlotSelectionModal from "./SlotSelectionModal";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const DEFAULT_IMAGE = "/images/default-placeholder.jpg";
const BORDER_IMAGE = "cardbg.jpeg";

const MenuCard = ({ type, item, handleAddToCart, getCategoryName, slotData }) => {
    const [showSlotModal, setShowSlotModal] = useState(false);
    const [activeSlot, setActiveSlot] = useState(null);
    const [selectedFoods, setSelectedFoods] = useState([]);
    const [mergedSlotData, setMergedSlotData] = useState(slotData);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [showSpiceModal, setShowSpiceModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null); // for food-level spice

    const SPICE_LEVELS = [
        { value: "mild", label: "1 マイルド (MILD)" },
        { value: "medium", label: "2 普通 (MEDIUM)" },
        { value: "hot", label: "3 中辛 (HOT)" },
        { value: "very_hot", label: "4 大辛 (VERY HOT)" },
        { value: "super_hot", label: "5 激辛 (SUPER HOT)" },
    ];

    // Render chili icons based on spice level
    const renderSpiceChili = (level) => {
        const index = SPICE_LEVELS.findIndex((l) => l.value === level);
        if (index === -1) return null;
        return "🌶".repeat(index + 1);
    };

    const handleSpiceButtonClick = (slotOrItem) => {
        if (type === "food") {
            setSelectedItem(slotOrItem);
        } else {
            setSelectedSlot(slotOrItem);
        }
        setShowSpiceModal(true);
    };

    const handleSpiceSelect = (value) => {
        if (type === "food" && selectedItem) {
            selectedItem.spice_level = value;
        } else if (selectedSlot) {
            selectedSlot.spice_level = value;
        }
        setShowSpiceModal(false);
    };

    useEffect(() => {
        if (type === "set_menu" && item) {
            const fetchChoosableFoods = async () => {
                const foods = await getChoosableFoodsByCategory(item);
                const newData = mergeArraysById(slotData, foods);
                setMergedSlotData(newData);
            };
            fetchChoosableFoods();
        }
    }, [item, type, slotData]);

    function mergeArraysById(originalArray, newArray) {
        const dedupeFoods = (array) =>
            array.map((slot) => {
                if (!Array.isArray(slot.foods)) return slot;
                const uniqueFoodsMap = new Map();
                slot.foods.forEach((f) => uniqueFoodsMap.set(f.id, f));
                return { ...slot, foods: Array.from(uniqueFoodsMap.values()) };
            });

        const uniqueOriginal = dedupeFoods(originalArray);
        const uniqueNew = dedupeFoods(newArray);

        return uniqueOriginal.map((item) => {
            const match = uniqueNew.find((n) => n.id === item.id);
            return match ? { ...item, ...match } : item;
        });
    }

    const getChoosableFoodsByCategory = async (item) => {
        if (!item?.slots) return [];
        const choosableCategoryIds = item.slots
            .filter((slot) => slot.type === "choosable")
            .map((slot) => slot.category_id);

        if (choosableCategoryIds.length === 0) return [];

        try {
            const responses = await Promise.all(
                choosableCategoryIds.map((id) =>
                    API.get(`/admin/categories/${id}/foods`)
                )
            );
            return responses.map((res, index) => ({
                id: choosableCategoryIds[index],
                foods: res.data || [],
            }));
        } catch (err) {
            console.error("Failed to fetch foods for choosable categories", err);
            return [];
        }
    };

    const imageSrc =
        type === "food"
            ? item.images?.[0]
                ? BASE_URL + "/storage/" + item.images[0]
                : DEFAULT_IMAGE
            : item.image
                ? BASE_URL + "/storage/" + item.image
                : DEFAULT_IMAGE;

    const price = type === "food" ? item.price : item.base_price || 0;

    const handleSlotButtonClick = (slot) => {
        setActiveSlot(slot);
        const combinedFoods = [
            slot.default_food,
            ...(slot.other_foods?.map((f) => f.default_food) || []),
        ].filter(Boolean);

        setSelectedFoods(
            slot.type === "choosable"
                ? [...(slot.selected_foods || [])].filter(Boolean) // start empty if no selection
                : [slot.default_food].filter(Boolean)
        );

        setShowSlotModal(true);
    };

    const buildCartData = (item) => {
        const updatedSlots = item.slots.map((slot) => {
            if (slot.type === "choosable") {
                return { ...slot, chosen_foods: slot.selected_foods || [] };
            } else if (slot.type === "changeable") {
                return { ...slot, chosen_food: slot.default_food };
            } else {
                return slot;
            }
        });
        return { ...item, slots: updatedSlots };
    };

    const handleFoodSelect = (food) => {
        if (!activeSlot) return;
        if (activeSlot.type === "choosable") {
            const alreadySelected = selectedFoods.find((f) => f.id === food.id);
            let updated;
            if (alreadySelected) {
                updated = selectedFoods.filter((f) => f.id !== food.id);
            } else {
                if (selectedFoods.length < activeSlot.quantity) {
                    updated = [...selectedFoods, food];
                } else return;
            }
            setSelectedFoods(updated);
            activeSlot.selected_foods = updated;
        } else {
            setSelectedFoods([food]);
            activeSlot.default_food = food;
            activeSlot.additional_price = food.additional_price || 0;
        }
    };

    const handleConfirmSlot = () => {
        setShowSlotModal(false);
    };

    return (
        <>
            <div
                style={{
                    width: "75vw",
                    height: "60vh",
                    cursor: "pointer",
                    maxWidth: "75vw",
                    minWidth: "75vh",
                    // border: "20px solid transparent",
                    // borderImageSource: `url(${BORDER_IMAGE})`,
                    // borderImageSlice: 50,
                    // borderImageRepeat: "round",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    boxSizing: "border-box",
                }}
            >
                <Card
                    className="h-100 d-flex flex-column shadow-sm"
                    style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#1e1e1e",
                        color: "#fff",
                        overflow: "hidden",
                        borderRadius: "10px",
                        border: "none",
                        position: "relative",
                    }}
                >
                    <Card.Img
                        src={imageSrc}
                        alt={item.title}
                        onError={(e) => (e.target.src = DEFAULT_IMAGE)}
                        style={{ objectFit: "cover", width: "100%", height: "100%" }}
                    />

                    <Card.ImgOverlay
                        className="d-flex flex-column justify-content-end p-3"
                        style={{
                            background:
                                "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 100%)",
                        }}
                    >
                        {type === "food" && (
                            <>
                                <div className="text-center mb-2">
                                    <Card.Title style={{fontWeight: 700, fontSize: "3.6rem"}}>
                                        ¥{price}
                                    </Card.Title>
                                    <Card.Title style={{ fontWeight: 700, fontSize: "1.3rem" }}>
                                        {item.title}
                                        {item.spice_level && (
                                            <Button
                                                size="sm"
                                                variant="outline-light"
                                                className="mx-2"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSpiceButtonClick(item);
                                                }}
                                            >
                                                {renderSpiceChili(item.spice_level)}{" "}
                                                {SPICE_LEVELS.find((l) => l.value === item.spice_level)
                                                    ?.label || item.spice_level}
                                            </Button>
                                        )}
                                    </Card.Title>
                                    <Card.Title style={{ fontWeight: 700, fontSize: "1.3rem" }}>
                                        {item.japanese_name}
                                    </Card.Title>
                                    <Card.Text>{item.description}</Card.Text>
                                    <Card.Text>{item.jp_description}</Card.Text>
                                    {/*<Card.Text style={{ fontWeight: 600, color: "#ffd700" }}>*/}
                                    {/*    ¥{price}*/}
                                    {/*</Card.Text>*/}
                                </div>

                                <Button
                                    variant="light"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddToCart(item, type);
                                    }}
                                >
                                    Add to Cart
                                </Button>
                            </>
                        )}

                        {type === "set_menu" && (
                            <>
                                <div className="mb-2 mx-auto text-center">
                                    <Card.Title style={{fontWeight: 700, fontSize: "3.6rem"}}>
                                        ¥{price}
                                    </Card.Title>
                                    <Card.Title style={{fontWeight: 700, fontSize: "1.3rem"}}>
                                        {item.title}{" "}
                                    </Card.Title>
                                    <Card.Text>{item.description}</Card.Text>
                                    <Card.Text>{item.jp_description}</Card.Text>
                                    {item.slots
                                        ?.slice()
                                        .sort((a, b) => {
                                            const order = { fixed: 0, choosable: 1, changeable: 2 };
                                            return (order[a.type] ?? 3) - (order[b.type] ?? 3);
                                        })
                                        .map((slot, idx) => (
                                            <div key={idx} className="mb-1">
                        <span style={{ fontWeight: 500, marginRight: 5 }}>
                          {getCategoryName(slot.category_id)}:
                        </span>

                                                {/* Fixed item spice */}
                                                {slot.type === "fixed" && slot.default_food && slot.default_food.spice_level && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline-light"
                                                        className="mx-2"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSpiceButtonClick(slot);
                                                        }}
                                                    >
                                                        {renderSpiceChili(slot.default_food.spice_level)}{" "}
                                                        {SPICE_LEVELS.find((l) => l.value === slot.default_food.spice_level)
                                                            ?.label || slot.default_food.spice_level}
                                                    </Button>
                                                )}

                                                {/* Changeable item spice */}
                                                {slot.type === "changeable" && slot.default_food && slot.default_food.spice_level && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline-light"
                                                        className="mx-2"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSpiceButtonClick(slot);
                                                        }}
                                                    >
                                                        {renderSpiceChili(slot.default_food.spice_level)}{" "}
                                                        {SPICE_LEVELS.find((l) => l.value === slot.default_food.spice_level)
                                                            ?.label || slot.default_food.spice_level}
                                                    </Button>
                                                )}

                                                {/* Display selected foods for choosable */}
                                                {slot.type === "choosable" &&
                                                    slot.selected_foods?.map((f) => (
                                                        <span key={f.id} className="me-2">
                              {f.name}{" "}
                                                            {f.spice_level && renderSpiceChili(f.spice_level)}
                            </span>
                                                    ))}

                                                {/* Display name for fixed/changeable items */}
                                                {(slot.type === "fixed" || slot.type === "changeable") && slot.default_food && (
                                                    <span className="me-2">{slot.default_food.name}</span>
                                                )}

                                                {(slot.type === "choosable" || slot.type === "changeable") && (
                                                    <Button
                                                        size="sm"
                                                        variant={slot.type === "changeable" ? "warning" : "info"}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSlotButtonClick(slot);
                                                        }}
                                                    >
                                                        {slot.type === "changeable" ? "Change" : "Choose"}
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                </div>

                                <Button
                                    variant="light"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const cartItem = buildCartData(item);
                                        handleAddToCart(cartItem, type);
                                    }}
                                >
                                    Add Set Menu to Cart
                                </Button>
                            </>
                        )}
                    </Card.ImgOverlay>
                </Card>
            </div>


            <SlotSelectionModal
                show={showSlotModal}
                onHide={() => setShowSlotModal(false)}
                activeSlot={activeSlot}
                slotData={mergedSlotData}
                selectedFoods={selectedFoods}
                handleFoodSelect={handleFoodSelect}
                handleConfirmSlot={handleConfirmSlot}
            />

            {/* Spice Selection Modal for single food / fixed food */}
            <div
                className={`modal fade ${showSpiceModal ? "show d-block" : ""}`}
                tabIndex="-1"
                role="dialog"
                style={{
                    backgroundColor: showSpiceModal ? "rgba(0,0,0,0.5)" : "transparent",
                }}
            >
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Select Spice Level</h5>
                            <button
                                type="button"
                                className="close"
                                onClick={() => setShowSpiceModal(false)}
                            >
                                <span>&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            {SPICE_LEVELS.map((level) => (
                                <button
                                    key={level.value}
                                    type="button"
                                    className={`btn btn-outline-primary btn-block mb-2 ${
                                        selectedSlot?.spice_level === level.value ||
                                        selectedItem?.spice_level === level.value
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() => handleSpiceSelect(level.value)}
                                >
                                    {level.label}
                                </button>
                            ))}
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowSpiceModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MenuCard;
