import React, { useState, useEffect, useMemo } from "react";
import { Container } from "react-bootstrap";
import API from "../../services/api";
import AddToCartSidebar from "./AddToCartSidebar";
import CheckoutModal from "./CheckoutModal";
import MenuCard from "./MenuCard1";
import MenuNavigation from "./MenuNavigation1";

const DEFAULT_IMAGE = "";

export default function FoodMenu() {
    const [foods, setFoods] = useState([]);
    const [setMenus, setSetMenus] = useState([]);
    const [cart, setCart] = useState([]);
    const [user, setUser] = useState(null);

    const [selectedMealType, setSelectedMealType] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedFood, setSelectedFood] = useState(null);
    const [selectedSetMenu, setSelectedSetMenu] = useState(null);
    const [showCheckout, setShowCheckout] = useState(false);
    const [foodCategory, setFoodCategory] = useState([]);
    const [mappedSlotData, setMappedSlotData] = useState([]);

    const [autoSelected, setAutoSelected] = useState(false);

    // --- Fetch Data ---
    const fetchData = async () => {
        try {
            // First, fetch user
            const userRes = await API.get("/user");
            const user = userRes.data;
            setUser(userRes.data);

// Determine is_takeout_menu based on table number
            const takeoutParam = user.table == 20 ? "1" : "0";

            const [foodRes, menuRes, cartRes, categoryRes] = await Promise.all([
                API.get("/food", {
                    params: {
                        is_available: true,    // optional: only available items
                        is_takeout_menu: takeoutParam,// optional: only dine-in items
                    }
                }),
                API.get("/admin/set-menus"),
                API.get("/cart"),
                API.get("/category"),
                API.get("/user"),
            ]);



            setFoods(
                (foodRes.data.data || []).map((f) => ({
                    ...f,
                    image: f.image || DEFAULT_IMAGE,
                    set_menu_image: f.set_menu_image
                        ? f.set_menu_image
                        : (f.images && f.images.length > 0 ? f.images[0] : DEFAULT_IMAGE),
                    title: f.name,
                    jp: f.japanese_name,
                    category: f.category?.name || "",
                    meal_type: f.meal_type || "Other",
                }))
            );

            setFoodCategory(categoryRes.data.data);

            // Apply mapMenu to each set menu
            const mappedSetMenus = (menuRes.data || []).map(mapMenu).map((m) => ({
                ...m,
                image: m.images?.[0] || DEFAULT_IMAGE,
                title: m.title,
                jp: m.japanese_title,
                category: m.category?.name || "Set menu/セットメニュー",
                meal_type: m.meal_type || "Other",
            }));

            setSetMenus(mappedSetMenus);
            setMappedSlotData(mapSlot(mappedSetMenus));

            setCart(
                (cartRes.data.data || []).map((c) => ({
                    id: c.id,
                    type: c.type || (c.food ? "food" : "set_menu"),
                    title: c.food?.name || c.set_menu?.title || "",
                    jp: c.food?.japanese_name || c.set_menu?.japanese_title || "",
                    price: c.price || c.food?.price || c.set_menu?.cost || 0,
                    quantity: c.quantity,
                    image: c.food?.image || c.set_menu?.images?.[0] || DEFAULT_IMAGE,
                    slots: c.slots || [],
                    spice_level: c.spice_level || '',
                }))
            );
        } catch (err) {
            console.error("Failed to fetch data", err);
        }
    };

    const mapSlot = (mappedSetMenus) => {
        return mappedSetMenus.flatMap(sl =>
            sl.slots.map(dt => {
                let mappedFood = [];
                if (dt.default_food) {
                    mappedFood = [{
                        name: dt.default_food.name,
                        japanese_name: dt.default_food.japanese_name,
                        id: dt.default_food.id,
                        images: dt.default_food.images,
                        additional_price: dt.default_food.additional_price ?? 0,
                        spice_level: dt.default_food.spice_level ?? '',
                        set_menu_image: dt.default_food.set_menu_image ?? ''

                    }];
                }

                if (dt.other_foods && dt.other_foods.length > 0) {
                    const mappedOtherFood = dt.other_foods.map(dt1 => ({
                        name: dt1.default_food.name,
                        japanese_name: dt1.default_food.japanese_name,
                        id: dt1.default_food.id,
                        images: dt1.default_food.images,
                        additional_price: dt1.additional_price ?? 0,
                        spice_level: dt1.spice_level ?? '',
                        set_menu_image: dt1.set_menu_image ?? ''
                    }));

                    return {
                        id: dt.category_id,
                        set_menu_id: dt.id,
                        type: dt.type,
                        foods: [...mappedFood, ...mappedOtherFood]
                    };
                }

                return {
                    id: dt.category_id,
                    type: dt.type,
                    set_menu_id: dt.id,
                    foods: mappedFood ?? []
                };
            }).filter(Boolean)
        );
    };

    const mapMenu = (menu) => {
        const mainSlots = menu.slots.filter(slot => slot.type !== 'other');
        const otherSlots = menu.slots.filter(slot => slot.type === 'other');

        const slots = mainSlots.map(slot => {
            const otherFoods = otherSlots
                .filter(f => f.category_id === slot.category_id)
                .map(f => ({
                    food_id: f.default_food_id,
                    name: f.default_food?.name || '',
                    additional_price: f.additional_price,
                    default_food: f.default_food,
                    set_menu_image: f.default_food.set_menu_image,
                }));

            return {
                id: slot.id,
                category_id: slot.category_id,
                category_name: slot.category?.name,
                type: slot.type,
                default_food_id: slot.default_food_id,
                quantity: slot.quantity,
                additional_price: slot.additional_price,
                default_food: slot.default_food,
                other_foods: otherFoods,
                spice_level: slot.spice_level,
            };
        });

        return { ...menu, slots };
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getCategoryName = (id) => {
        const category = foodCategory.find(c => c.id === id);
        return category ? category.name : "Uncategorized";
    };

    // --- Derived Data ---
    const mealTypes = useMemo(() => {
        const uniqueTypes = [...new Set([...foods, ...setMenus].map((i) => i.meal_type))];

        // Always move "thampin" to the end
        return uniqueTypes.sort((a, b) => {
            if (a === "thampin") return 1;
            if (b === "thampin") return -1;
            return 0;
        });
    }, [foods, setMenus]);

    const categories = useMemo(() => {
        // if (!selectedMealType) return [];
        return [
            ...new Set(
                [...foods, ...setMenus]
                    .filter((i) => i.meal_type === selectedMealType)
                    .map((i) => i.category || "Uncategorized")
            ),
        ];
    }, [foods, setMenus, selectedMealType]);

    const filteredFoods = useMemo(
        () =>
            foods.filter(
                (f) =>
                    (!selectedMealType || f.meal_type === selectedMealType) &&
                    (!selectedCategory || f.category === selectedCategory)
            ),
        [foods, selectedMealType, selectedCategory]
    );

    // --- Derived Category Map: English name -> Japanese name ---
    const categoryMap = useMemo(() => {
        const map = {};
        foodCategory.forEach(c => {
            map[c.name] = c.japanese_name;
        });
        return map;
    }, [foodCategory]);

    const filteredSetMenus = useMemo(
        () =>
            setMenus.filter(
                (s) =>
                    (!selectedMealType || s.meal_type === selectedMealType) &&
                    (!selectedCategory || s.category === selectedCategory)
            ),
        [setMenus, selectedMealType, selectedCategory]
    );

    // --- Auto-select FIRST item only when category/meal changes ---
    useEffect(() => {
        if (!autoSelected) {
            if (filteredFoods.length > 0) {
                setSelectedFood(filteredFoods[0]);
                setSelectedSetMenu(null);
                setAutoSelected(true);
            } else if (filteredSetMenus.length > 0) {
                setSelectedSetMenu(filteredSetMenus[0]);
                setSelectedFood(null);
                setAutoSelected(true);
            } else {
                setSelectedFood(null);
                setSelectedSetMenu(null);
            }
        }
    }, [filteredFoods, filteredSetMenus, autoSelected]);

    // --- Cart Handlers ---
    const handleAddToCart = async (item, type) => {
        try {
            const payload = { quantity: 1, type };

            if (type === "food") {
                payload.food_id = item.id;

                // ✅ Include spice level if selected
                if (item.spice_level) {
                    payload.spice_level = item.spice_level;
                }
            }

            if (type === "set_menu") {
                payload.set_menu_id = item.id;

                payload.slots = item.slots.map((slot) => {
                    const base = {
                        slot_id: slot.id,
                        slot_type: slot.type,   // ✅ Add slot_type
                    };

                    if (slot.type === "choosable") {
                        // ✅ Include spice_level per selected food if exists
                        base.chosen_food_ids = (slot.selected_foods || []).map((f) => ({
                            food_id: f.id,
                            spice_level: f.spice_level || null,
                        }));
                    } else if (slot.type === "changeable") {
                        base.chosen_food_id = slot.default_food?.id || null;
                        base.spice_level = slot.default_food?.spice_level || null;
                    } else {
                        base.chosen_food_id = slot.default_food?.id || null;
                    }

                    if (slot.spice_level) {
                        base.spice_level = slot.spice_level; // ✅ Keep spice
                    }

                    return base;
                });
            }

            await API.post("/cart/add", payload);
            await fetchData();
        } catch (err) {
            console.error("Failed to add to cart:", err);
        }
    };


    const handleQuantityChange = async (cartId, quantity) => {
        if (quantity < 1) return;
        try {
            await API.put(`/cart/${cartId}`, { quantity });
            await fetchData();
        } catch (err) {
            console.error("Failed to update quantity", err);
        }
    };

    const handleRemoveFromCart = async (cartId) => {
        try {
            await API.delete(`/cart/${cartId}`);
            await fetchData();
        } catch (err) {
            console.error("Failed to remove item", err);
        }
    };

    const handleOpenCheckout = () => setShowCheckout(true);

    const handleConfirmOrder = async (tableNumber) => {
        try {
            await API.post("/order", { table_number: tableNumber });
            alert("Order placed successfully!");
            setCart([]);
            setShowCheckout(false);
        } catch (err) {
            console.error("Checkout failed", err);
            // alert("Checkout failed!");
        }
    };

    return (
        <div className="bg-light" style={{ minHeight: "100vh" }}>
            <Container fluid>
                <MenuNavigation
                    mealTypes={mealTypes}
                    categories={categories}
                    filteredFoods={filteredFoods}
                    filteredSetMenus={filteredSetMenus}
                    selectedMealType={selectedMealType}
                    selectedCategory={selectedCategory}
                    selectedFood={selectedFood}
                    selectedSetMenu={selectedSetMenu}
                    categoryMap={categoryMap} // ✅ pass mapping here
                    onSelectMealType={(t) => {
                        setSelectedMealType(t);
                        setSelectedCategory(null);
                        setSelectedFood(null);
                        setSelectedSetMenu(null);
                        setAutoSelected(false);
                    }}
                    onSelectCategory={(c) => {
                        setSelectedCategory(c);
                        setSelectedFood(null);
                        setSelectedSetMenu(null);
                        setAutoSelected(false);
                    }}
                    onSelectFood={(f) => {
                        setSelectedFood(f);
                        setSelectedSetMenu(null);
                        setAutoSelected(true);
                    }}
                    onSelectSetMenu={(s) => {
                        setSelectedSetMenu(s);
                        setSelectedFood(null);
                        setAutoSelected(true);
                    }}
                />

                <div className="d-flex" style={{ alignItems: "stretch", gap: "1rem" }}>
                    {/* Left Section */}
                    <div style={{ flex: "0 0 70%", display: "flex", flexDirection: "column" }}>
                        <div className="flex-grow-1 mt-2 d-flex justify-content-center align-items-center">
                            {selectedFood && (
                                <MenuCard
                                    type="food"
                                    item={selectedFood}
                                    handleAddToCart={handleAddToCart}
                                />
                            )}
                            {selectedSetMenu && (
                                <MenuCard
                                    type="set_menu"
                                    item={selectedSetMenu}
                                    getCategoryName={getCategoryName}
                                    handleAddToCart={handleAddToCart}
                                    slotData={mappedSlotData}
                                />
                            )}
                            {!selectedFood && !selectedSetMenu && <p>No items available.</p>}
                        </div>
                    </div>

                    {/* Right Section */}
                    <div style={{ flex: "0 0 30%" }}>
                        <AddToCartSidebar
                            cart={cart}
                            user={user}
                            handleOpenCheckout={handleOpenCheckout}
                            handleIncrement={(c) => handleQuantityChange(c.id, c.quantity + 1)}
                            handleDecrement={(c) => handleQuantityChange(c.id, c.quantity - 1)}
                            handleRemoveFromCart={handleRemoveFromCart}
                            onClose={() => {}}
                        />
                    </div>
                </div>
            </Container>

            <CheckoutModal
                show={showCheckout}
                onClose={() => setShowCheckout(false)}
                cart={cart}
                handleConfirmOrder={handleConfirmOrder}
            />
        </div>
    );
}
