import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function MenuNavigation({
                                           mealTypes,
                                           categories,
                                           filteredFoods,
                                           filteredSetMenus,
                                           selectedMealType,
                                           selectedCategory,
                                           selectedFood,
                                           selectedSetMenu,
                                           categoryMap,
                                           onSelectMealType,
                                           onSelectCategory,
                                           onSelectFood,
                                           onSelectSetMenu,
                                       }) {
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalItems, setModalItems] = useState([]);
    const [showingCategories, setShowingCategories] = useState(true);

    // for delayed modal open
    const [pendingMealType, setPendingMealType] = useState(null);

    const containerStyle = {
        overflow: "hidden",
        padding: "6px 0",
        backgroundColor: "#f15a22",
    };

    const cardStyle = (isActive) => ({
        minWidth: "200px",
        padding: "12px 16px",
        borderRadius: "10px",
        background: isActive ? "linear-gradient(135deg, #ff7e5f, #feb47b)" : "#fff",
        color: isActive ? "#fff" : "red",
        fontWeight: isActive ? "500" : "700",
        fontSize: "1.8rem",
        lineHeight: "1.1",
        textAlign: "center",
        boxShadow: isActive
            ? "0 4px 10px rgba(255,126,95,0.25)"
            : "0 2px 5px rgba(0,0,0,0.1)",
        userSelect: "none",
        margin: "6px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        flex: "0 0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    });

    const MENU_TYPES = [
        { label: "単品メニュー / A-la-carte menu", value: "thampin", 'time': ''},
        { label: "ランチメニュー / Lunch Menu", value: "lunch", time: '10:00 ~ 15:00'},
        { label: "夕食 / Dinner Menu", value: "dinner", time: '10:00 ~ 15:00'},
    ];

    const getMenuLabel = (value) => {
        const found = MENU_TYPES.find((type) => type.value === value);
        return found ? found.label : value;
    };

    const getMenuTimeLabel = (value) => {
        const found = MENU_TYPES.find((type) => type.value === value);
        return found ? found.time : '';
    };

    /** ---- Carousel ---- **/
    function Carousel({ items = [], selectedItem, onSelect, getTitle }) {
        return (
            <motion.div style={containerStyle} whileTap={{ cursor: "grabbing" }}>
                <div style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "0 6px" }}>
                    {items.map((item, idx) => {
                        const isActive = selectedItem === item || selectedItem?.id === item.id;
                        return (
                            <div
                                key={item?.id ?? idx}
                                style={cardStyle(isActive)}
                                onClick={() => onSelect(item)}
                            >
                                {getTitle && (
                                    <>
                                        {/* Main label */}
                                        <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: "700" }}>
                                            {getTitle(item)}
                                        </p>
                                        <p style={{ margin: 0, fontSize: "1.2rem", opacity: 0.8 }}>
                                            {getMenuTimeLabel(item)}
                                        </p>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        );
    }

    /** ---- Grid ---- **/
    function Grid({ items = [], selectedItem, onSelect }) {
        return (
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
                {items.map((item, idx) => {
                    const isActive = selectedItem === item || selectedItem?.id === item.id;
                    return (
                        <div
                            key={item?.id ?? idx}
                            style={cardStyle(isActive)}
                            onClick={() => onSelect(item)}
                        >
                            {!showingCategories && item.jp && item.title ? (
                                <>
                                    <span
                                        style={{
                                            display: "block",
                                            fontSize: "1.6rem",
                                            fontWeight: "600",
                                            color: isActive ? "#fff" : "#000",
                                        }}
                                    >
                                        {item.jp}
                                    </span>
                                    <span
                                        style={{
                                            display: "block",
                                            fontSize: "1.2rem",
                                            fontWeight: "400",
                                            color: isActive ? "#fff" : "#555",
                                        }}
                                    >
                                        {item.title.split("/")[0]}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span
                                        style={{
                                            display: "block",
                                            fontSize: "1.6rem",
                                            fontWeight: "600",
                                            color: isActive ? "#fff" : "#000",
                                        }}
                                    >
                                        {item === "Set menu/セットメニュー"
                                            ? "セットメニュー"
                                            : categoryMap?.[item] || item}
                                    </span>
                                    <span
                                        style={{
                                            display: "block",
                                            fontSize: "1.2rem",
                                            fontWeight: "400",
                                            color: isActive ? "#fff" : "#555",
                                        }}
                                    >
                                        {item === "Set menu/セットメニュー"
                                            ? "Set menu"
                                            : item}
                                    </span>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    /** ---- Handlers ---- **/

        // Click meal type
    const handleMealTypeClick = (mealType) => {
            setPendingMealType(mealType);
            onSelectMealType(mealType);
        };

    // Click category → show items
    const handleCategoryClick = (category) => {
        // Notify parent about new selected category
        onSelectCategory(category);

        // Show loading / placeholder while waiting for parent update
        setModalItems([]);
        setModalTitle("Loading...");
        setShowingCategories(false);
    };

    // Click food / set menu → select but KEEP modal open
    const handleItemClick = (item) => {
        if (filteredSetMenus.includes(item)) {
            onSelectSetMenu(item);
        } else {
            onSelectFood(item);
        }
        // ⏳ Close after a short delay
        setTimeout(() => setShowModal(false), 300);
    };

    // 🔙 Go back to categories
    const handleBackToCategories = () => {
        const relatedCategories = [
            ...new Set(
                categories
            ),
        ];

        setModalItems(relatedCategories);
        setModalTitle("Select Category");
        setShowingCategories(true);
    };


    // Open modal AFTER parent updates mealType
    useEffect(() => {
        if (pendingMealType && selectedMealType === pendingMealType) {
            const relatedCategories = [
                ...new Set(
                    categories
                ),
            ];

            setModalTitle("Select Category");
            setModalItems(relatedCategories);
            setShowingCategories(true);
            setShowModal(true);

            setPendingMealType(null);
        }
    }, [selectedMealType, pendingMealType, filteredFoods, filteredSetMenus]);

    useEffect(() => {
        if (!selectedCategory) return;

        const foodsForCategory = filteredFoods.filter((f) => f.category === selectedCategory);
        const setMenusForCategory = filteredSetMenus.filter((s) => s.category === selectedCategory);

        if (setMenusForCategory.length > 0) {
            setModalItems(setMenusForCategory);
            setModalTitle("Select Set Menu");
        } else if (foodsForCategory.length > 0) {
            setModalItems(foodsForCategory);
            setModalTitle("Select Food");
        } else {
            setModalItems([]);
            setModalTitle("No items available");
        }

        setShowingCategories(false);
    }, [selectedCategory, filteredFoods, filteredSetMenus]);

    return (
        <div>
            {/* Meal Type Carousel */}
            {mealTypes?.length > 0 && (
                <Carousel
                    items={mealTypes}
                    selectedItem={selectedMealType}
                    onSelect={handleMealTypeClick}
                    getTitle={(item) => getMenuLabel(item)}
                />
            )}

            {/* Modal */}
            <div className={`modal fade ${showModal ? "show d-block" : ""}`} tabIndex="-1">
                <div
                    className="modal-dialog"
                    style={{
                        position: "fixed",
                        top: "200px",
                        left: "200px",
                        width: "60%",
                        maxWidth: "60%",
                        minHeight: "70vh",
                    }}
                >
                    <div className="modal-content" style={{ backgroundColor: "#f15a22" }}>
                        <div className="modal-header d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                                {/* 🔙 Back button only when showing items */}
                                {!showingCategories && (
                                    <button
                                        className="btn btn-light me-2"
                                        onClick={handleBackToCategories}
                                    >
                                        ← Back
                                    </button>
                                )}
                                <h5 className="modal-title text-white mb-0">{modalTitle}</h5>
                            </div>

                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => setShowModal(false)}
                            ></button>
                        </div>

                        <div className="modal-body">
                            <Grid
                                items={modalItems}
                                selectedItem={
                                    showingCategories
                                        ? selectedCategory
                                        : selectedSetMenu || selectedFood
                                }
                                onSelect={showingCategories ? handleCategoryClick : handleItemClick}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
