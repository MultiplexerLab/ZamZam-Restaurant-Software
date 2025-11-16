// src/components/FooodMenu.jsx
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../services/api";
import FoodItem from "./FoodItem";
import SetMenuItem from "./SetMenuItem";
import AddToCart from "./AddToCart";

const FooodMenu1 = () => {
    const [foods, setFoods] = useState([]);
    const [setMenus, setSetMenus] = useState([]);
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const mapCart = (c) => ({
        id: c.id,
        cart_id: c.id,
        type: c.food ? "food" : "set_menu",
        food_id: c.food?.id || null,
        set_menu_id: c.set_menu?.id || null,
        title: c.food?.name || c.set_menu?.title || "",
        jp: c.food?.japanese_name || c.set_menu?.japanese_title || "",
        price: c.food?.price || c.set_menu?.cost || 0,
        quantity: c.quantity,
        image: c.food?.image ? `http://localhost:8000/storage/${c.food.image}` :
               c.set_menu?.images?.length ? `http://localhost:8000/storage/${c.set_menu.images[0]}` : ""
    });

    const fetchData = async () => {
        try {
            const [foodRes, menuRes, cartRes] = await Promise.all([
                API.get("/food"),
                API.get("/setmenu"),
                API.get("/cart")
            ]);

            setFoods(foodRes.data.data.map(f => ({
                ...f,
                title: f.name,
                jp: f.japanese_name,
                category: f.category?.name || "Uncategorized"
            })));

            setSetMenus(menuRes.data.data.map(m => ({
                ...m,
                title: m.title,
                jp: m.japanese_title,
                category: m.category?.name || "Uncategorized",
                items: m.food_names || []
            })));

            setCart(cartRes.data.map(mapCart));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAddToCart = async (item, type) => {
        try {
            const payload = { quantity: 1 };
            if (type === "food") payload.food_id = item.id;
            if (type === "set_menu") payload.set_menu_id = item.id;
            await API.post("/cart/add", payload);
            await fetchData();
            setShowCart(true);
        } catch (err) { console.error(err); }
    };

    const handleRemove = async (id) => { await API.delete(`/cart/${id}`); await fetchData(); };
    const handleIncrement = (c) => handleQuantityChange(c.id, c.quantity + 1);
    const handleDecrement = (c) => handleQuantityChange(c.id, c.quantity - 1);
    const handleQuantityChange = async (id, qty) => { if(qty<1) return; await API.put(`/cart/${id}`, {quantity:qty}); await fetchData(); };

    const foodCategories = [...new Set(foods.map(f => f.category))];
    const setMenuCategories = [...new Set(setMenus.map(s => s.category))];

    return (
        <Container className="py-4">
            <h2>Food</h2>
            {foodCategories.map(cat => (
                <div key={cat} className="mb-5">
                    <h3>{cat}</h3>
                    <Row>
                        {foods.filter(f => f.category === cat).map(food => (
                            <Col md={4} sm={6} xs={12} key={food.id}>
                                <FoodItem
                                    food={food}
                                    onSelect={f => setSelectedItem({ type: "food", data: f })}
                                    onAddToCart={handleAddToCart}
                                />
                            </Col>
                        ))}
                    </Row>
                </div>
            ))}

            <h2>Set Menu</h2>
            {setMenuCategories.map(cat => (
                <div key={cat} className="mb-5">
                    <h3>{cat}</h3>
                    <Row>
                        {setMenus.filter(s => s.category === cat).map(menu => (
                            <Col md={4} sm={6} xs={12} key={menu.id}>
                                <SetMenuItem
                                    menu={menu}
                                    onSelect={m => setSelectedItem({ type: "set_menu", data: m })}
                                    onAddToCart={handleAddToCart}
                                />
                            </Col>
                        ))}
                    </Row>
                </div>
            ))}

            {/* Cart Sidebar */}
            <div
                className={`position-fixed top-0 end-0 vh-100 bg-white shadow p-3 d-flex flex-column ${showCart ? "translate-x-0" : "translate-x-100"} transition`}
                style={{ width: "350px", zIndex: 1060 }}
            >
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>Cart</h5>
                    <Button variant="light" size="sm" onClick={() => setShowCart(false)}>Close</Button>
                </div>

                <AddToCart
                    cart={cart}
                    onRemove={handleRemove}
                    onIncrement={handleIncrement}
                    onDecrement={handleDecrement}
                    onQuantityChange={handleQuantityChange}
                />

                {cart.length > 0 && (
                    <div className="mt-3">
                        <h5>Total: ${cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</h5>
                        <Button className="w-100" onClick={async ()=>{
                            await API.post("/order");
                            alert("Order placed!");
                            await fetchData();
                            setShowCart(false);
                        }}>Checkout</Button>
                    </div>
                )}
            </div>
        </Container>
    );
};

export default FooodMenu1;
