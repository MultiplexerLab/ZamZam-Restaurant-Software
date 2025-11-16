// src/components/FoodMenu.jsx
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, ListGroup, InputGroup, FormControl } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Minus } from "lucide-react";
import API from "../services/api";

const DEFAULT_IMAGE = "http://localhost:8000/storage/branches/fNHLxMdBltb9GgL7kmZHzhym9dsPM2194SDCUAQi.jpg";

const FoodMenu = () => {
  const [foods, setFoods] = useState([]);
  const [setMenus, setSetMenus] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutCart, setCheckoutCart] = useState([]);

  // --- Cart Mapper ---
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
    image: c.food?.image
      ? `http://localhost:8000/storage/${c.food.image}`
      : c.set_menu?.images?.length
      ? `http://localhost:8000/storage/${c.set_menu.images[0]}`
      : DEFAULT_IMAGE,
  });

  // --- Fetch Foods, Menus, Cart ---
  const fetchData = async () => {
    try {
      const [foodRes, menuRes, cartRes] = await Promise.all([
        API.get("/food"),
        API.get("/setmenu"),
        API.get("/cart"),
      ]);

      setFoods(
        foodRes.data.data.map((f) => ({
          ...f,
          image: f.image ? `http://localhost:8000/storage/${f.image}` : DEFAULT_IMAGE,
          title: f.name,
          jp: f.japanese_name,
          category: f.category?.name || "Uncategorized",
        }))
      );

      setSetMenus(
        menuRes.data.data.map((m) => ({
          ...m,
          image: m.images?.length ? `http://localhost:8000/storage/${m.images[0]}` : DEFAULT_IMAGE,
          title: m.title,
          jp: m.japanese_title,
          category: m.category?.name || "Uncategorized",
          items: m.food_names || [],
        }))
      );

      setCart(Array.isArray(cartRes.data) ? cartRes.data.map(mapCart) : []);
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Cart Operations ---
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

  // --- Checkout ---
  const handleOpenCheckout = () => {
    setCheckoutCart(cart);
    setShowCheckout(true);
  };

  const handleConfirmOrder = async () => {
    try {
      await API.post("/order");
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
  const popupVariants = { hidden: { opacity: 0, y: 50, scale: 0.8 }, visible: { opacity: 1, y: 0, scale: 1 } };

  return (
    <Container className="py-4">
      {/* --- Food Section --- */}
      <h2>Food</h2>
      {foodCategories.map((cat) => (
        <div key={cat} className="mb-5">
          <h3 className="mb-3">{cat}</h3>
          <Row>
            {foods.filter((f) => f.category === cat).map((food) => (
              <Col md={4} sm={6} xs={12} className="mb-4" key={food.id}>
                <motion.div
                  layoutId={`food-${food.id}`}
                  onClick={() => setSelectedItem({ type: "food", data: food })}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  style={{ cursor: "pointer" }}
                >
                  <Card className="text-white shadow-sm">
                    <Card.Img
                      src={food.image || DEFAULT_IMAGE}
                      alt={food.title}
                      onError={(e) => (e.target.src = DEFAULT_IMAGE)}
                    />
                    <Card.ImgOverlay className="d-flex flex-column justify-content-between">
                      <div>
                        <Card.Title>{food.title}</Card.Title>
                        <Card.Subtitle>{food.jp}</Card.Subtitle>
                        <Card.Text>${food.price}</Card.Text>
                      </div>
                      <Button
                        variant="light"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(food, "food");
                        }}
                      >
                        Add to Cart
                      </Button>
                    </Card.ImgOverlay>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </div>
      ))}

      {/* --- Set Menu Section --- */}
      <h2>Set Menu</h2>
      {setMenuCategories.map((cat) => (
        <div key={cat} className="mb-5">
          <h3 className="mb-3">{cat}</h3>
          <Row>
            {setMenus.filter((s) => s.category === cat).map((menu) => (
              <Col md={4} sm={6} xs={12} className="mb-4" key={menu.id}>
                <motion.div
                  layoutId={`set-${menu.id}`}
                  onClick={() => setSelectedItem({ type: "set_menu", data: menu })}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  style={{ cursor: "pointer" }}
                >
                  <Card className="text-white shadow-sm">
                    <Card.Img
                      src={menu.image || DEFAULT_IMAGE}
                      alt={menu.title}
                      onError={(e) => (e.target.src = DEFAULT_IMAGE)}
                    />
                    <Card.ImgOverlay className="d-flex flex-column justify-content-between">
                      <div>
                        <Card.Title>{menu.title}</Card.Title>
                        <Card.Subtitle>{menu.jp}</Card.Subtitle>
                        <Card.Text>${menu.cost}</Card.Text>
                      </div>
                      <Button
                        variant="light"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(menu, "set_menu");
                        }}
                      >
                        Add to Cart
                      </Button>
                    </Card.ImgOverlay>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </div>
      ))}

      {/* --- Selected Item Popup --- */}
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
              className="position-absolute top-0 start-0 w-100 h-100"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={() => setSelectedItem(null)}
            />
            <motion.div
              layoutId={`item-${selectedItem.data.id}`}
              className="bg-white rounded shadow p-4 position-relative"
              style={{ width: "90%", maxWidth: "600px", zIndex: 10 }}
              variants={popupVariants}
            >
              <img
                src={selectedItem.data.image}
                alt={selectedItem.data.title}
                className="img-fluid mb-3 rounded"
                onError={(e) => (e.target.src = DEFAULT_IMAGE)}
              />
              <h4>{selectedItem.data.title}</h4>
              <h6 className="text-muted">{selectedItem.data.jp}</h6>
              <p>{selectedItem.data.description}</p>

              {selectedItem.type === "set_menu" && (
                <>
                  <h5>Included Items:</h5>
                  <ListGroup className="mb-3">
                    {selectedItem.data.items.map((item, idx) => (
                      <ListGroup.Item key={idx}>
                        {item.name} ({item.japanese_name || item.jp})
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </>
              )}

              <h5>${selectedItem.data.price || selectedItem.data.cost}</h5>
              <div className="d-flex justify-content-end mt-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-primary me-2"
                  onClick={() => handleAddToCart(selectedItem.data, selectedItem.type)}
                >
                  Add to Cart
                </motion.button>
                <button className="btn btn-secondary" onClick={() => setSelectedItem(null)}>
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Cart Sidebar --- */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            className="position-fixed top-0 end-0 vh-100 bg-white shadow p-3 d-flex flex-column"
            style={{ width: "350px", zIndex: 1060 }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5>Cart</h5>
              <Button variant="light" size="sm" onClick={() => setShowCart(false)}>
                Close
              </Button>
            </div>

            <div className="flex-grow-1 overflow-auto">
              {cart.length === 0 ? (
                <p>Your cart is empty</p>
              ) : (
                <ListGroup>
                  {cart.map((c) => (
                    <ListGroup.Item key={c.id} className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{c.title}</strong>
                        <div className="text-muted">{c.jp}</div>
                        <div className="d-flex align-items-center">
                          <Button variant="outline-secondary" size="sm" onClick={() => handleDecrement(c)}>
                            <Minus size={16} />
                          </Button>
                          <InputGroup size="sm" className="mx-1" style={{ width: "50px" }}>
                            <FormControl
                              value={c.quantity}
                              onChange={(e) => handleQuantityChange(c.id, parseInt(e.target.value))}
                            />
                          </InputGroup>
                          <Button variant="outline-secondary" size="sm" onClick={() => handleIncrement(c)}>
                            <Plus size={16} />
                          </Button>
                        </div>
                      </div>
                      <Button variant="danger" size="sm" onClick={() => handleRemoveFromCart(c.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </div>

            {cart.length > 0 && (
              <div className="mt-3">
                <h5>Total: ${cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</h5>
                <Button className="w-100" onClick={handleOpenCheckout}>
                  Checkout
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Checkout Modal --- */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{ zIndex: 1070 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="position-absolute top-0 start-0 w-100 h-100"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={() => setShowCheckout(false)}
            />
            <motion.div
              className="bg-white rounded shadow p-4 position-relative"
              style={{ width: "90%", maxWidth: "500px", zIndex: 1080 }}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <h4>Order Review</h4>
              <ListGroup className="mb-3">
                {checkoutCart.map((c) => (
                  <ListGroup.Item key={c.id} className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{c.title}</strong> x {c.quantity}
                      <div>${(c.price * c.quantity).toFixed(2)}</div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <h5>Total: ${checkoutCart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</h5>
              <div className="d-flex justify-content-end mt-3">
                <Button variant="secondary" className="me-2" onClick={() => setShowCheckout(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleConfirmOrder}>
                  Confirm Order
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default FoodMenu;
