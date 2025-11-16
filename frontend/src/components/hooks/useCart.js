// src/hooks/useCart.js
import { useState, useCallback } from "react";
import API from "../../services/api";

export default function useCart() {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);

    const mapCart = useCallback((c) => ({
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
            ? `http://localhost:8000/storage/${c.food.image}`
            : c.set_menu?.images?.length
                ? `http://localhost:8000/storage/${c.set_menu.images[0]}`
                : "http://localhost:8000/storage/branches/fNHLxMdBltb9GgL7kmZHzhym9dsPM2194SDCUAQi.jpg",
    }), []);

    const fetchCart = useCallback(async () => {
        try {
            const res = await API.get("/cart");
            const data = Array.isArray(res.data.data) ? res.data.data : [];
            setCart(data.map(mapCart));
        } catch (err) {
            console.error("Failed to fetch cart", err);
        }
    }, [mapCart]);

    const addToCart = useCallback(async (item, type) => {
        try {
            setLoading(true);
            const payload = { quantity: 1, type };
            if (type === "food") payload.food_id = item.id;
            if (type === "set_menu") payload.set_menu_id = item.id;

            await API.post("/cart/add", payload);
            await fetchCart();
        } catch (err) {
            console.error("Failed to add to cart:", err);
            alert("Could not add item to cart. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [fetchCart]);

    const removeFromCart = useCallback(async (cartId) => {
        try {
            await API.delete(`/cart/${cartId}`);
            await fetchCart();
        } catch (err) {
            console.error("Failed to remove item", err);
        }
    }, [fetchCart]);

    const updateQuantity = useCallback(async (cartId, quantity) => {
        if (quantity < 1) return;
        try {
            await API.put(`/cart/${cartId}`, { quantity });
            await fetchCart();
        } catch (err) {
            console.error("Failed to update quantity", err);
        }
    }, [fetchCart]);

    return {
        cart,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        fetchCart,
    };
}
