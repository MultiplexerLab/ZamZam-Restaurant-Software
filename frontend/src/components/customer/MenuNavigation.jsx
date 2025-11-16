import React, { useRef, useEffect, useState, useCallback } from "react";
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
                                           onSelectMealType,
                                           onSelectCategory,
                                           onSelectFood,
                                           onSelectSetMenu,
                                       }) {
    const containerStyle = {
        overflow: "hidden",
        padding: "6px 0",
        backgroundColor: "#f15a22",
    };

    const swipeStyle = {
        display: "flex",
        gap: "8px",
        cursor: "grab",
        padding: "0 6px",
        touchAction: "pan-y",
    };

    const cardStyle = (isActive) => ({
        minWidth: "300px",
        padding: "6px 10px",
        borderRadius: "10px",
        background: isActive
            ? "linear-gradient(135deg, #ff7e5f, #feb47b)"
            : "#fff",
        color: isActive ? "#fff" : "red",
        fontWeight: isActive ? "500" : "700",
        fontSize: "2rem",
        lineHeight: "1.1",
        textAlign: "center",
        boxShadow: isActive
            ? "0 4px 10px rgba(255,126,95,0.25)"
            : "0 2px 5px rgba(0,0,0,0.1)",
        userSelect: "none",
        transition: "all 0.3s ease",
    });

    const MENU_TYPES = [
        { label: "A-la-carte menu/単品メニュー", value: "thampin" },
        { label: "Lunch Menu/ランチメニュー", value: "lunch" },
        { label: "Dinner Menu/夕食", value: "dinner" },
    ];

    const getMenuLabel = (value) => {
        const found = MENU_TYPES.find((type) => type.value === value);
        return found ? found.label : value;
    };

    function Carousel({ items = [], selectedItem, onSelect, getTitle, getSubTitle }) {
        const outerRef = useRef(null);
        const innerRef = useRef(null);
        const [overflow, setOverflow] = useState(0);

        const measure = useCallback(() => {
            const outer = outerRef.current;
            const inner = innerRef.current;
            if (!outer || !inner) return setOverflow(0);

            const style = window.getComputedStyle(inner);
            const gap = parseFloat(style.gap || 0);
            const paddingLeft = parseFloat(style.paddingLeft || 0);
            const paddingRight = parseFloat(style.paddingRight || 0);

            const scrollWidth = inner.scrollWidth;
            const clientWidth = outer.clientWidth;

            // get one card's width to center the last one
            const firstCard = inner.querySelector("div");
            const cardWidth = firstCard ? firstCard.offsetWidth : 0;

            // Allow enough space for the last card to be centered
            const extra = clientWidth / 2 - cardWidth / 2;

            const diff = Math.max(
                0,
                scrollWidth - clientWidth + extra + gap + paddingLeft + paddingRight
            );

            setOverflow(diff);
        }, []);

        useEffect(() => {
            measure();

            let ro;
            try {
                ro = new ResizeObserver(() => measure());
                if (outerRef.current) ro.observe(outerRef.current);
                if (innerRef.current) ro.observe(innerRef.current);
            } catch (e) {
                window.addEventListener("resize", measure);
            }

            window.addEventListener("load", measure);

            return () => {
                if (ro) {
                    try {
                        if (outerRef.current) ro.unobserve(outerRef.current);
                        if (innerRef.current) ro.unobserve(innerRef.current);
                        ro.disconnect();
                    } catch {}
                } else {
                    window.removeEventListener("resize", measure);
                }
                window.removeEventListener("load", measure);
            };
        }, [measure, items.length]);

        useEffect(() => {
            const id = requestAnimationFrame(() => measure());
            return () => cancelAnimationFrame(id);
        }, [items, measure]);

        const dragConstraints = { left: -overflow, right: 0 };

        return (
            <motion.div style={containerStyle} whileTap={{ cursor: "grabbing" }}>
                <div ref={outerRef} style={{ overflow: "hidden", width: "100%" }}>
                    <motion.div
                        ref={innerRef}
                        drag="x"
                        dragConstraints={dragConstraints}
                        dragElastic={0.12}
                        dragMomentum={true}
                        style={swipeStyle}
                    >
                        {items.map((item, idx) => {
                            const isActive =
                                selectedItem === item || selectedItem?.id === item.id;
                            const title = getTitle ? getTitle(item) : "";
                            const sub = getSubTitle ? getSubTitle(item) : "";

                            return (
                                <motion.div
                                    key={item?.id ?? idx}
                                    style={cardStyle(isActive)}
                                    onClick={() => onSelect(item)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {title && <p style={{ margin: 0 }}>{title}</p>}
                                    {sub && <p style={{ margin: 0 }}>{sub}</p>}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    return (
        <div>
            {mealTypes?.length > 0 && (
                <Carousel
                    items={mealTypes}
                    selectedItem={selectedMealType}
                    onSelect={onSelectMealType}
                    getTitle={(item) => getMenuLabel(item)}
                    getSubTitle={() => ""}
                />
            )}

            {categories?.length > 0 && (
                <Carousel
                    items={categories}
                    selectedItem={selectedCategory}
                    onSelect={onSelectCategory}
                    getTitle={(item) => item}
                    getSubTitle={() => ""}
                />
            )}

            {filteredFoods?.length > 0 && (
                <Carousel
                    items={filteredFoods}
                    selectedItem={selectedFood}
                    onSelect={onSelectFood}
                    getTitle={(item) => item.title}
                    getSubTitle={(item) => item.jp}
                />
            )}

            {filteredSetMenus?.length > 0 && (
                <Carousel
                    items={filteredSetMenus}
                    selectedItem={selectedSetMenu}
                    onSelect={onSelectSetMenu}
                    getTitle={(item) => item.title}
                    getSubTitle={(item) => item.jp}
                />
            )}
        </div>
    );
}
