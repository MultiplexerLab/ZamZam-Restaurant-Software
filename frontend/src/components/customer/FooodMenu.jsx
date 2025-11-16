import React, { useState, useEffect } from "react";
import { Container, Row, Col, ListGroup } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../services/api";
import AddToCartSidebar from "./AddToCartSidebar";
import CheckoutModal from "./CheckoutModal";
import FoodItem from "./FoodItem";
import SetMenuItem from "./SetMenuItem";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const DEFAULT_IMAGE = '';

export default function FooodMenu() {
    const [foods, setFoods] = useState([]);
    const [setMenus, setSetMenus] = useState([]);
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showCheckout, setShowCheckout] = useState(false);
    const [checkoutCart, setCheckoutCart] = useState([]);

    const mapCart = (c) => ({
        id: c.id,
        cart_id: c.id,
        type: c.type || (c.food ? "food" : "set_menu"),
        food_id: c.food?.id || null,
        set_menu_id: c.set_menu?.id || null,
        title: c.food?.name || c.set_menu?.title || "",
        jp: c.food?.japanese_name || c.set_menu?.japanese_title || "",
        price: c.price || c.food?.price || c.set_menu?.cost || 0,
        quantity: c.quantity,
        items: c.set_menu?.food_names || [],
        image: c.food?.image
            ? c.food.image
            : c.set_menu?.images?.length
                ? c.set_menu.images[0]
                : DEFAULT_IMAGE,
    });

    const fetchData = async () => {
        try {
            const [foodRes, menuRes, cartRes] = await Promise.all([
                API.get("/food"),
                API.get("/setmenu"),
                API.get("/cart"),
            ]);

            const foodsData = Array.isArray(foodRes.data.data)
                ? foodRes.data.data
                : [];
            setFoods(
                foodsData.map((f) => ({
                    ...f,
                    image: f.image ? f.image : DEFAULT_IMAGE,
                    title: f.name,
                    jp: f.japanese_name,
                    category: f.category?.name || "Uncategorized",
                }))
            );

            const menusData = Array.isArray(menuRes.data.data)
                ? menuRes.data.data
                : [];
            setSetMenus(
                menusData.map((m) => ({
                    ...m,
                    image: m.images?.length ? m.images[0] : DEFAULT_IMAGE,
                    title: m.title,
                    jp: m.japanese_title,
                    category: m.category?.name || "Uncategorized",
                    items: Array.isArray(m.food_names) ? m.food_names : [],
                }))
            );

            const cartData = Array.isArray(cartRes.data.data)
                ? cartRes.data.data
                : [];
            setCart(cartData.map(mapCart));
        } catch (err) {
            console.error("Failed to fetch data", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddToCart = async (item, type) => {
        try {
            const payload = { quantity: 1, type };
            if (type === "food") payload.food_id = item.id;
            if (type === "set_menu") payload.set_menu_id = item.id;

            await API.post("/cart/add", payload);
            await fetchData();
            setShowCart(true);
        } catch (err) {
            console.error("Failed to add to cart:", err);
            alert("Could not add item to cart. Please try again.");
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

    const handleQuantityChange = async (cartId, quantity) => {
        if (quantity < 1) return;
        try {
            await API.put(`/cart/${cartId}`, { quantity });
            await fetchData();
        } catch (err) {
            console.error("Failed to update quantity", err);
        }
    };

    const handleIncrement = (c) => handleQuantityChange(c.id, c.quantity + 1);
    const handleDecrement = (c) => handleQuantityChange(c.id, c.quantity - 1);

    const handleOpenCheckout = () => {
        setCheckoutCart(cart);
        setShowCheckout(true);
    };

    const handleConfirmOrder = async (tableNumber) => {
        try {
            await API.post("/order", { table_number: tableNumber });
            alert("Order placed successfully!");
            setCart([]);
            setShowCart(false);
            setShowCheckout(false);
        } catch (err) {
            console.error("Checkout failed", err);
            alert("Checkout failed!");
        }
    };

    const foodCategories = [...new Set(foods.map((f) => f.category))];
    const setMenuCategories = [...new Set(setMenus.map((s) => s.category))];

    const overlayVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
    const popupVariants = {
        hidden: { opacity: 0, y: 50, scale: 0.8 },
        visible: { opacity: 1, y: 0, scale: 1 },
    };

    return (
        <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
            <Container className="py-5">
                <h1 className="text-center mb-5 fw-bold text-dark">Our Menu</h1>

                {/* --- Food Section --- */}
                <h2 className="mb-4 text-secondary fw-semibold">Food</h2>
                {foodCategories.map((cat) => (
                    <div key={cat} className="mb-5">
                        <h4 className="mb-3 text-muted">{cat}</h4>
                        <Row>
                            {foods
                                .filter((f) => f.category === cat)
                                .map((food) => (
                                    <Col md={4} sm={6} xs={12} className="mb-4" key={food.id}>
                                        <FoodItem
                                            food={food}
                                            onSelect={setSelectedItem}
                                            handleAddToCart={handleAddToCart}
                                        />
                                    </Col>
                                ))}
                        </Row>
                    </div>
                ))}

                {/* --- Set Menu Section --- */}
                <h2 className="mb-4 text-secondary fw-semibold">Set Menu</h2>
                {setMenuCategories.map((cat) => (
                    <div key={cat} className="mb-5">
                        <h4 className="mb-3 text-muted">{cat}</h4>
                        <Row>
                            {setMenus
                                .filter((s) => s.category === cat)
                                .map((menu) => (
                                    <Col md={4} sm={6} xs={12} className="mb-4" key={menu.id}>
                                        <SetMenuItem
                                            menu={menu}
                                            onSelect={setSelectedItem}
                                            handleAddToCart={handleAddToCart}
                                        />
                                    </Col>
                                ))}
                        </Row>
                    </div>
                ))}

                {/* --- Popup for Selected Item --- */}
                <AnimatePresence>
                    {selectedItem && (
                        <motion.div
                            className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                            style={{ zIndex: 1050 }}
                            variants={overlayVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                        >
                            <motion.div
                                className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
                                onClick={() => setSelectedItem(null)}
                            />
                            <motion.div
                                layoutId={`item-${selectedItem.data.id}`}
                                className="bg-white rounded shadow p-4 position-relative"
                                style={{ width: "90%", maxWidth: "600px", zIndex: 10 }}
                                variants={popupVariants}
                            >
                                <img
                                    src={
                                        selectedItem.data.image
                                            ? BASE_URL + "/storage/" + selectedItem.data.image
                                            : DEFAULT_IMAGE
                                    }
                                    alt={selectedItem.data.title}
                                    className="img-fluid mb-3 rounded"
                                    onError={(e) => (e.target.src = DEFAULT_IMAGE)}
                                />
                                <h4 className="fw-bold text-dark">
                                    {selectedItem.data.title}
                                </h4>
                                <h6 className="text-secondary mb-3">
                                    {selectedItem.data.jp}
                                </h6>
                                <p className="text-muted">{selectedItem.data.description}</p>

                                {selectedItem.type === "set_menu" && (
                                    <>
                                        <h5 className="fw-semibold">Included Items:</h5>
                                        <ListGroup className="mb-3">
                                            {selectedItem.data.items.map((item, idx) => (
                                                <ListGroup.Item key={idx}>
                                                    {item.name} ({item.japanese_name || item.jp})
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    </>
                                )}

                                <h5 className="fw-bold text-primary mb-3">
                                    ¥{selectedItem.data.price || selectedItem.data.cost || 0}
                                </h5>
                                <div className="d-flex justify-content-end mt-3">
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="btn btn-primary me-2"
                                        onClick={() =>
                                            handleAddToCart(selectedItem.data, selectedItem.type)
                                        }
                                    >
                                        Add to Cart
                                    </motion.button>
                                    <button
                                        className="btn btn-outline-secondary"
                                        onClick={() => setSelectedItem(null)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AddToCartSidebar
                    cart={cart}
                    onClose={() => setShowCart(false)}
                    handleQuantityChange={handleQuantityChange}
                    handleRemoveFromCart={handleRemoveFromCart}
                    handleIncrement={handleIncrement}
                    handleDecrement={handleDecrement}
                    handleOpenCheckout={handleOpenCheckout}
                />

                <CheckoutModal
                    show={showCheckout}
                    onClose={() => setShowCheckout(false)}
                    cart={checkoutCart}
                    handleConfirmOrder={handleConfirmOrder}
                />
            </Container>
        </div>
    );
}
