// SetMenuV1Modal.jsx
import React, { useEffect, useState } from "react";
import { Modal, Button, Table, Form, Badge } from "react-bootstrap";
import API from "../../services/api";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function SetMenuV1Modal({ show, onHide, setMenu, onAdded }) {
    const [foodsByCategory, setFoodsByCategory] = useState({});
    const [selections, setSelections] = useState({}); // slotId => array (choosable) or single id (changeable)
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // init selections when menu is set
    useEffect(() => {
        if (!setMenu) return;
        const init = {};
        (setMenu.slots || []).forEach(slot => {
            if (slot.type === "choosable") init[slot.id] = []; // choose up to quantity
            else init[slot.id] = slot.default_food_id ?? null; // changeable: default selected
        });
        setSelections(init);
        setFoodsByCategory({});
        setError(null);
    }, [setMenu]);

    // fetch foods for a category if not cached
    const fetchFoodsForCategory = async (categoryId) => {
        if (!categoryId) return;
        if (foodsByCategory[categoryId]) return;
        try {
            const res = await API.get(`admin/categories/${categoryId}/foods`);
            setFoodsByCategory(prev => ({ ...prev, [categoryId]: res.data || [] }));
        } catch (err) {
            console.error("fetchFoodsForCategory", err);
            setFoodsByCategory(prev => ({ ...prev, [categoryId]: [] }));
        }
    };

    // when modal opens, prefetch categories used by slots
    useEffect(() => {
        if (!setMenu) return;
        (setMenu.slots || []).forEach(s => {
            if (s.category_id) fetchFoodsForCategory(s.category_id);
        });
    }, [setMenu]);

    // handle selection changes
    const toggleChoosable = (slot, foodId) => {
        const cur = Array.isArray(selections[slot.id]) ? [...selections[slot.id]] : [];
        const idx = cur.indexOf(foodId);
        if (idx === -1) {
            // add if under quantity
            if (cur.length < (slot.quantity || 1)) {
                cur.push(foodId);
            } else {
                // replace oldest or prevent — we'll prevent and show a simple error
                setError(`You can select up to ${slot.quantity} item(s) for ${slot.category?.name ?? "this slot"}.`);
                return;
            }
        } else {
            cur.splice(idx, 1);
        }
        setError(null);
        setSelections(prev => ({ ...prev, [slot.id]: cur }));
    };

    const selectChangeable = (slot, foodId) => {
        setSelections(prev => ({ ...prev, [slot.id]: foodId }));
    };

    const isChanged = (slot) => {
        if (slot.type !== "changeable") return false;
        const sel = selections[slot.id];
        // treat null/default as not changed
        return sel && parseInt(sel) !== Number(slot.default_food_id);
    };

    const calculatePrice = () => {
        let total = Number(setMenu.base_price) || 0;
        (setMenu.slots || []).forEach(slot => {
            if (slot.type === "changeable" && isChanged(slot)) {
                total += Number(slot.additional_price || 0);
            }
            // choosable slots do not affect price by requirement
        });
        return total;
    };

    const handleAddToCart = async () => {
        setLoading(true);
        setError(null);
        try {
            // Build payload
            // selections normalized: slotId => array|id
            const payload = {
                type: "set_menu_v1",
                set_menu_v1_id: setMenu.id,
                selections, // server expects json
                quantity: 1,
                // send calculated price for convenience; server will validate/recalculate to be safe
                calculated_price: calculatePrice(),
            };

            await API.post("/cart/add", payload);
            if (onAdded) onAdded();
            onHide();
        } catch (err) {
            console.error("Add to cart failed", err);
            setError(err.response?.data?.message || "Failed to add to cart");
        } finally {
            setLoading(false);
        }
    };

    if (!setMenu) return null;

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{setMenu.title} — Customize</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <div className="alert alert-danger">{error}</div>}
                <p><strong>Base Price:</strong> ¥{setMenu.base_price}</p>

                <div className="d-flex flex-wrap mb-3">
                    {(setMenu.images || []).map((img, idx) => (
                        <img key={idx} src={`${BASE_URL}/storage/${img}`} alt={`img-${idx}`} width={100} className="me-2 mb-2 rounded" />
                    ))}
                </div>

                <h5>Slots</h5>
                {(setMenu.slots || []).map(slot => (
                    <div className="mb-3" key={slot.id}>
                        <div className="d-flex justify-content-between">
                            <strong>{slot.category?.name || "Category"}</strong>
                            <small>{slot.type === "choosable" ? `Choose up to ${slot.quantity}` : "Changeable (single)"}</small>
                        </div>

                        {/* list foods for category */}
                        <div className="d-flex flex-wrap mt-2">
                            { (foodsByCategory[slot.category_id] || []).map(food => {
                                const foodId = Number(food.id);
                                if (slot.type === "choosable") {
                                    const selected = Array.isArray(selections[slot.id]) && selections[slot.id].indexOf(foodId) !== -1;
                                    return (
                                        <div key={foodId} className="me-2 mb-2" style={{width: 140}}>
                                            <div className={`card ${selected ? "border-primary" : ""}`} onClick={() => toggleChoosable(slot, foodId)} style={{cursor: "pointer"}}>
                                                <img src={food.images?.[0] ? `${BASE_URL}/storage/${food.images[0]}` : ""} alt={food.name} height={80} className="card-img-top" onError={(e)=>e.target.remove()} />
                                                <div className="card-body p-2">
                                                    <div style={{fontSize: 13}}>{food.name}</div>
                                                    <div style={{fontSize: 12, color: "#888"}}>¥{food.price}</div>
                                                    <div style={{fontSize:11}}><Badge bg={selected ? "primary" : "secondary"}>{selected ? "Selected" : "Select"}</Badge></div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    const selected = selections[slot.id] && Number(selections[slot.id]) === foodId;
                                    // show additional price indicator if different from default
                                    const isDef = Number(slot.default_food_id) === foodId;
                                    return (
                                        <div key={foodId} className="me-2 mb-2" style={{width: 140}}>
                                            <div className={`card ${selected ? "border-primary" : ""}`} onClick={() => selectChangeable(slot, foodId)} style={{cursor: "pointer"}}>
                                                <img src={food.images?.[0] ? `${BASE_URL}/storage/${food.images[0]}` : ""} alt={food.name} height={80} className="card-img-top" onError={(e)=>e.target.remove()} />
                                                <div className="card-body p-2">
                                                    <div style={{fontSize: 13}}>{food.name}</div>
                                                    <div style={{fontSize: 12, color: "#888"}}>¥{food.price}</div>
                                                    <div style={{fontSize:11}}>
                                                        {isDef ? <Badge bg="success">Default</Badge> : <Badge bg="warning">+¥{slot.additional_price}</Badge>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                            })}
                        </div>
                    </div>
                ))}

                <hr />
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Final Price:</strong> <span style={{color:"#d9534f"}}>¥{calculatePrice()}</span>
                        <div style={{fontSize:12, color:"#666"}}>Base: ¥{setMenu.base_price}</div>
                    </div>
                    <div>
                        <Button variant="secondary" onClick={onHide} className="me-2">Cancel</Button>
                        <Button onClick={handleAddToCart} disabled={loading}>
                            {loading ? "Adding..." : "Add to Cart"}
                        </Button>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
}
