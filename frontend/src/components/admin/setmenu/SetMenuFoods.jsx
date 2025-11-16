import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Form, Button, Table, Container, Spinner } from "react-bootstrap";
import API from "../../../services/api";

function FoodExchangeItem() {
    const { setmenu_id, food_id } = useParams();

    const [setMenu, setSetMenu] = useState(null);
    const [food, setFood] = useState(null);

    const [similarFoods, setSimilarFoods] = useState([]);
    const [exchangeList, setExchangeList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [selectedFood, setSelectedFood] = useState("");
    const [additionalPrice, setAdditionalPrice] = useState("");

    // Fetch SetMenu details
    useEffect(() => {
        const fetchSetMenu = async () => {
            try {
                const res = await API.get(`/setmenu/${setmenu_id}`);
                setSetMenu(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchSetMenu();
    }, [setmenu_id]);

    // Fetch Food details
    useEffect(() => {
        const fetchFood = async () => {
            try {
                const res = await API.get(`/food/${food_id}`);
                setFood(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchFood();
    }, [food_id]);

    // Fetch similar foods
    useEffect(() => {
        const fetchSimilarFoods = async () => {
            try {
                const res = await API.get(`/foods/${food_id}/similar`);
                setSimilarFoods(res.data.similar_foods || []);
            } catch (err) {
                console.error(err);
                alert("Failed to load similar foods");
            }
        };
        fetchSimilarFoods();
    }, [food_id]);

    // Fetch existing exchange items
    useEffect(() => {
        const fetchExchangeItems = async () => {
            try {
                const res = await API.get("/food-exchange-items", {
                    params: {
                        setmenu_id,
                        food_id,
                    },
                });

                const items = res.data.map((item) => ({
                    id: item.id,
                    exchange_food_id: item.exchange_food_id,
                    exchange_food_name: item.exchange_food?.name || "Unknown",
                    additional_price: item.additional_price,
                }));

                setExchangeList(items);
            } catch (err) {
                console.error(err);
                alert("Failed to load exchange items");
            } finally {
                setLoading(false);
            }
        };
        fetchExchangeItems();
    }, [setmenu_id, food_id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFood) {
            alert("Please select a food to exchange");
            return;
        }

        const selectedFoodObj = similarFoods.find(
            (f) => f.id === Number(selectedFood)
        );
        if (!selectedFoodObj) return;

        const payload = {
            set_menu_id: Number(setmenu_id),
            food_id: Number(food_id),
            exchange_food_id: selectedFoodObj.id,
            additional_price: additionalPrice ? Number(additionalPrice) : 0,
        };

        try {
            setSubmitting(true);
            const res = await API.post("/food-exchange-items", payload);

            setExchangeList((prev) => {
                const existingIndex = prev.findIndex(
                    (i) => i.exchange_food_id === selectedFoodObj.id
                );
                if (existingIndex !== -1) {
                    const updated = [...prev];
                    updated[existingIndex].additional_price =
                        payload.additional_price;
                    return updated;
                }
                return [
                    ...prev,
                    {
                        id: res.data.data.id,
                        exchange_food_id: selectedFoodObj.id,
                        exchange_food_name: selectedFoodObj.name,
                        additional_price: payload.additional_price,
                    },
                ];
            });

            setSelectedFood("");
            setAdditionalPrice("");
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to add exchange food item");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this exchange item?"))
            return;

        try {
            await API.delete(`/food-exchange-items/${id}`);
            setExchangeList((prev) => prev.filter((item) => item.id !== id));
        } catch (err) {
            console.error(err);
            alert("Failed to delete exchange item");
        }
    };

    if (loading) {
        return (
            <Container className="mt-4 d-flex justify-content-center">
                <Spinner animation="border" />
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <h3 className="mb-3">
                Add Exchangeable Food for{" "}
                <span className="text-primary">
                    {food ? food.name : `Food ID: ${food_id}`}
                </span>
                <small className="text-muted ms-2">
                    (Set Menu: {setMenu ? setMenu.title : `ID: ${setmenu_id}`})
                </small>
            </h3>

            {/* Form */}
            <Form onSubmit={handleSubmit} className="mb-4">
                <Form.Group className="mb-3" style={{ maxWidth: "400px" }}>
                    <Form.Label>Select Exchange Food</Form.Label>
                    <Form.Select
                        value={selectedFood}
                        onChange={(e) => setSelectedFood(e.target.value)}
                    >
                        <option value="">-- Choose a food --</option>
                        {similarFoods.map((food) => (
                            <option key={food.id} value={food.id}>
                                {food.name}
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3" style={{ maxWidth: "400px" }}>
                    <Form.Label>Additional Price (Optional)</Form.Label>
                    <Form.Control
                        type="number"
                        value={additionalPrice}
                        onChange={(e) => setAdditionalPrice(e.target.value)}
                        placeholder="e.g. 50"
                    />
                </Form.Group>

                <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting ? "Adding..." : "Add Exchange Food"}
                </Button>
            </Form>

            {/* Table */}
            {exchangeList.length > 0 && (
                <Table striped bordered hover responsive>
                    <thead>
                    <tr>
                        <th>#</th>
                        <th>Exchange Food</th>
                        <th>Additional Price</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {exchangeList.map((item, index) => (
                        <tr key={item.id}>
                            <td>{index + 1}</td>
                            <td>{item.exchange_food_name}</td>
                            <td>{item.additional_price}</td>
                            <td>
                                <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => handleDelete(item.id)}
                                >
                                    Delete
                                </Button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
}

export default FoodExchangeItem;
