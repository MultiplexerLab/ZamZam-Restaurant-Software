// src/components/AddToCart.jsx
import React from "react";
import { ListGroup, InputGroup, FormControl, Button } from "react-bootstrap";
import { Trash2, Plus, Minus } from "lucide-react";

const AddToCart = ({ cart, onRemove, onIncrement, onDecrement, onQuantityChange }) => {
    return (
        <div className="flex-grow-1 overflow-auto">
            {cart.length === 0 ? (
                <p>Your cart is empty</p>
            ) : (
                <ListGroup>
                    {cart.map(c => (
                        <ListGroup.Item key={c.id} className="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>{c.title}</strong>
                                <div className="text-muted">{c.jp}</div>
                                <div className="d-flex align-items-center">
                                    <Button variant="outline-secondary" size="sm" onClick={() => onDecrement(c)}>
                                        <Minus size={16} />
                                    </Button>
                                    <InputGroup size="sm" className="mx-1" style={{ width: "50px" }}>
                                        <FormControl
                                            value={c.quantity}
                                            onChange={e => onQuantityChange(c.id, parseInt(e.target.value))}
                                        />
                                    </InputGroup>
                                    <Button variant="outline-secondary" size="sm" onClick={() => onIncrement(c)}>
                                        <Plus size={16} />
                                    </Button>
                                </div>
                            </div>
                            <Button variant="danger" size="sm" onClick={() => onRemove(c.id)}>
                                <Trash2 size={16} />
                            </Button>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}
        </div>
    );
};

export default AddToCart;
