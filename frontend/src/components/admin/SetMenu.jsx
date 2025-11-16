// src/components/SetMenu.js
import React, { useState, useEffect, useCallback } from "react";
import { Modal, Button, Table, Form, Pagination } from "react-bootstrap";
import Select from "react-select";
import API from "../../services/api";
import SetMenuForm from "./setmenu/Form";
import {useNavigate} from "react-router-dom";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function SetMenu() {
    const [menus, setMenus] = useState([]);
    const [branches, setBranches] = useState([]);
    const [categories, setCategories] = useState([]);
    const [foods, setFoods] = useState([]);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const navigate = useNavigate();
    const [modalData, setModalData] = useState({
        branch_id: "",
        meal_type: "",
        category_id: "",
        title: "",
        japanese_title: "",
        foods_item: [],
        food_names: [],
        calculated_cost: 0,
        cost: "",
        description: "",
        japanese_details: "",
        images: [],
        old_images: [],
        removedOldImages: [],
        changeable_foods: [], // { food_id, exchange_items: [{id, name, additional_price}] }
        is_available: true,
    });
    const [imagePreview, setImagePreview] = useState([]);
    const [showDetail, setShowDetail] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const mealTypes = ["Breakfast", "Lunch", "Dinner"];

    // Fetch menus
    const fetchMenus = useCallback(async (page = 1) => {
        try {
            const res = await API.get(`/setmenu?search=${encodeURIComponent(search)}&page=${page}`);
            setMenus(res.data.data);
            setCurrentPage(res.data.current_page);
            setTotalPages(res.data.last_page);
        } catch (err) {
            console.error(err);
        }
    }, [search]);

    // Fetch branches & categories
    const fetchBranchesCategories = async () => {
        try {
            const [bRes, cRes] = await Promise.all([API.get("/branch"), API.get("/category")]);
            setBranches(bRes.data.data);
            setCategories(cRes.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchMenus();
        fetchBranchesCategories();
    }, [fetchMenus]);

    // Fetch foods based on selected branch & category
    useEffect(() => {
        const { branch_id, category_id } = modalData;
        if (branch_id && category_id) {
            API.get(`/food?branch_id=${branch_id}&category_id=${category_id}&per_page=1000`)
                .then(res => setFoods(res.data.data))
                .catch(console.error);
        } else {
            setFoods([]);
        }
    }, [modalData.branch_id, modalData.category_id]);

    const foodOptions = foods.map(f => ({ value: f.id, label: f.name, price: f.price }));

    const mapSelected = (ids = []) => {
        return ids.map(id => {
            const f = foods.find(f => f.id == id);
            if (f) return { value: f.id, label: f.name };
            return { value: id, label: modalData.food_names?.find(f => f.id === id)?.name || `Food #${id}` };
        });
    };

    const handleFoodsSelect = (selected) => {
        const ids = selected ? selected.map(s => s.value) : [];
        const calc = (selected || []).reduce((acc, s) => {
            const f = foods.find(x => x.id === s.value);
            return acc + (f?.price ? parseFloat(f.price) : 0);
        }, 0);
        setModalData(prev => ({ ...prev, foods_item: ids, calculated_cost: calc }));
    };

    const handleChange = (e) => {
        const { name, value, files, type, checked } = e.target;
        if (name === "images") {
            const fileArray = Array.from(files);
            setModalData(prev => ({ ...prev, images: fileArray }));
            setImagePreview(fileArray.map(file => URL.createObjectURL(file)));
        } else if (type === "checkbox") {
            setModalData(prev => ({ ...prev, [name]: checked }));
        } else {
            setModalData(prev => ({ ...prev, [name]: value }));
        }
        setErrors(prev => ({ ...prev, [name]: null }));
    };

    const openCreate = () => {
        setModalData({
            branch_id: "",
            meal_type: "",
            category_id: "",
            title: "",
            japanese_title: "",
            foods_item: [],
            food_names: [],
            calculated_cost: 0,
            cost: "",
            description: "",
            japanese_details: "",
            images: [],
            old_images: [],
            removedOldImages: [],
            changeable_foods: [],
            is_available: true,
        });
        setImagePreview([]);
        setIsEdit(false);
        setErrors({});
        setShowModal(true);
    };

    const openEdit = (menu) => {
        setModalData({
            id: menu.id,
            branch_id: menu.branch_id,
            meal_type: menu.meal_type || "",
            category_id: menu.category_id,
            title: menu.title,
            japanese_title: menu.japanese_title,
            foods_item: menu.foods_item || [],
            food_names: menu.food_names || [],
            cost: menu.cost,
            calculated_cost: menu.calculated_cost || 0,
            description: menu.description || "",
            japanese_details: menu.japanese_details || "",
            images: [],
            old_images: menu.images || [],
            removedOldImages: [],
            changeable_foods: menu.changeable_foods || [],
            is_available: menu.is_available === 1,
        });
        setImagePreview([]);
        setIsEdit(true);
        setErrors({});
        setShowModal(true);
    };

    const openView = (menu) => {
        setModalData(menu);
        setShowDetail(true);
    };

    const handleRemoveOldImage = (idx) => {
        setModalData(prev => {
            const removed = prev.old_images[idx];
            return {
                ...prev,
                removedOldImages: [...prev.removedOldImages, removed],
                old_images: prev.old_images.filter((_, i) => i !== idx),
            };
        });
    };

    // Toggle food as changeable
    const toggleChangeableFood = (food_id) => {
        setModalData(prev => {
            const exists = prev.changeable_foods.find(f => f.food_id === food_id);
            if (exists) {
                // Remove
                return {
                    ...prev,
                    changeable_foods: prev.changeable_foods.filter(f => f.food_id !== food_id)
                };
            } else {
                // Add
                const exchangeItems = foods
                    .filter(f => f.id !== food_id) // all other foods in category
                    .map(f => ({ id: f.id, name: f.name, additional_price: 0 }));
                return {
                    ...prev,
                    changeable_foods: [...prev.changeable_foods, { food_id, exchange_items: exchangeItems }]
                };
            }
        });
    };

    const handleExchangePriceChange = (food_id, exchange_id, price) => {
        setModalData(prev => ({
            ...prev,
            changeable_foods: prev.changeable_foods.map(f => {
                if (f.food_id !== food_id) return f;
                return {
                    ...f,
                    exchange_items: f.exchange_items.map(e => e.id === exchange_id ? { ...e, additional_price: price } : e)
                };
            })
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        try {
            const formData = new FormData();
            formData.append("branch_id", modalData.branch_id);
            formData.append("meal_type", modalData.meal_type || "");
            formData.append("category_id", modalData.category_id);
            formData.append("title", modalData.title);
            formData.append("japanese_title", modalData.japanese_title || "");
            formData.append("japanese_details", modalData.japanese_details || "");
            formData.append("description", modalData.description || "");
            formData.append("cost", modalData.cost || 0);
            formData.append("is_available", modalData.is_available ? 1 : 0);
            (modalData.foods_item || []).forEach(id => formData.append("foods_item[]", id));

            // Send changeable foods
            (modalData.changeable_foods || []).forEach(f => {
                formData.append(`changeable_foods[${f.food_id}][food_id]`, f.food_id);
                f.exchange_items.forEach(e => {
                    formData.append(`changeable_foods[${f.food_id}][exchange_items][${e.id}]`, e.additional_price || 0);
                });
            });

            (modalData.removedOldImages || []).forEach(img => formData.append("removed_old_images[]", img));
            if (modalData.images?.length) modalData.images.forEach(file => formData.append("images[]", file));
            if (isEdit && modalData.old_images?.length) modalData.old_images.forEach(img => formData.append("old_images[]", img));

            if (isEdit) {
                await API.post(`/setmenu/${modalData.id}?_method=PUT`, formData, { headers: { "Content-Type": "multipart/form-data" } });
            } else {
                await API.post("/setmenu", formData, { headers: { "Content-Type": "multipart/form-data" } });
            }

            fetchMenus(currentPage);
            setShowModal(false);
            setImagePreview([]);
        } catch (err) {
            console.error(err);
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
            else alert(err.response?.data?.message || "Failed to save");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure to delete this set menu?")) return;
        try {
            await API.delete(`/setmenu/${id}`);
            fetchMenus(currentPage);
        } catch (err) {
            console.error(err);
            alert("Delete failed");
        }
    };

    const getImageUrl = (img) => `${BASE_URL}/storage/${img}`;

    return (
        <div className="container mt-4">
            {/* Search + Add */}
            <div className="d-flex justify-content-between mb-3">
                <Form.Control placeholder="Search set menus..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 360 }} />
                <Button variant="primary" onClick={openCreate}>Add Set Menu</Button>
            </div>

            {/* Table */}
            <Table striped bordered hover responsive>
                <thead>
                <tr>
                    <th>Image</th>
                    <th>Branch</th>
                    <th>Meal Type</th>
                    <th>Category</th>
                    <th>Title</th>
                    <th>Foods</th>
                    <th>Calculated Cost</th>
                    <th>Cost</th>
                    <th>Available</th>
                    <th>Created By</th>
                    <th style={{ width: 180 }}>Actions</th>
                </tr>
                </thead>
                <tbody>
                {menus.map(menu => (
                    <tr key={menu.id}>
                        <td>{menu.images && menu.images.length > 0 && <img src={getImageUrl(menu.images[0])} width="80" className="rounded border" alt="menu" />}</td>
                        <td>{menu.branch?.name}</td>
                        <td>{menu.meal_type}</td>
                        <td>{menu.category?.name}</td>
                        <td>{menu.title}</td>
                        <td>{menu.food_names?.map(f => `${f.name} (${f.price})`).join(", ")}</td>
                        <td>{Number(menu.calculated_cost).toFixed(2)}</td>
                        <td>{Number(menu.cost).toFixed(2)}</td>
                        <td>{menu.is_available ? "Yes" : "No"}</td>
                        <td>{menu.creator?.name}</td>
                        <td>
                            <Button size="sm" variant="info" className="me-1" onClick={() => openView(menu)}>View</Button>
                            <Button size="sm" variant="warning" className="me-1" onClick={() => openEdit(menu)}>Edit</Button>
                            <Button size="sm" variant="danger" onClick={() => handleDelete(menu.id)}>Delete</Button>
                        </td>
                    </tr>
                ))}
                {menus.length === 0 && <tr><td colSpan={11} className="text-center text-muted">No set menus found</td></tr>}
                </tbody>
            </Table>

            {/* Pagination */}
            <Pagination>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <Pagination.Item key={p} active={p === currentPage} onClick={() => fetchMenus(p)}>{p}</Pagination.Item>
                ))}
            </Pagination>

            {/* Create/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Form onSubmit={handleSubmit} encType="multipart/form-data">
                    <Modal.Header closeButton>
                        <Modal.Title>{isEdit ? "Edit Set Menu" : "Add Set Menu"}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <SetMenuForm
                            modalData={modalData}
                            setModalData={setModalData}
                            branches={branches}
                            categories={categories}
                            foods={foods}
                            mealTypes={mealTypes}
                            errors={errors}
                            handleChange={handleChange}
                            handleFoodsSelect={handleFoodsSelect}
                            mapSelected={mapSelected}
                            toggleChangeableFood={toggleChangeableFood}
                            handleExchangePriceChange={handleExchangePriceChange}
                            imagePreview={imagePreview}
                            setImagePreview={setImagePreview}
                            isEdit={isEdit}
                            handleRemoveOldImage={handleRemoveOldImage}
                        />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
                        <Button type="submit" variant="primary" disabled={loading}>{loading ? "Saving..." : (isEdit ? "Update" : "Create")}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Detail Modal */}
            <Modal show={showDetail} onHide={() => setShowDetail(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Set Menu Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalData && (
                        <>
                            <h5>{modalData.title}</h5>
                            <p className="text-muted">{modalData.japanese_title}</p>
                            <p><strong>Meal Type:</strong> {modalData.meal_type}</p>
                            <p><strong>Branch:</strong> {modalData.branch?.name}</p>
                            <p><strong>Category:</strong> {modalData.category?.name}</p>
                            <p><strong>Foods included:</strong></p>
                            <ul>{modalData.food_names?.map(f => (
                                <li key={f.id}>
                                    {f.name} ({f.japanese_name}) - ${f.price} <Button
                                    variant="warning"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => {
                                        navigate(`/admin/setmenu/${modalData.id}/${f.id}`);
                                        setShowDetail(false); // optional: close the details modal
                                    }}
                                >
                                    Edit Exchangeable Foods
                                </Button>
                                </li>))}</ul>
                            <p><strong>Calculated Cost:</strong> {Number(modalData.calculated_cost ?? 0).toFixed(2)}</p>
                            <p><strong>Cost (sell):</strong> {Number(modalData.cost ?? 0).toFixed(2)}</p>
                            <p><strong>Available:</strong> {modalData.is_available ? "Yes" : "No"}</p>
                            <p><strong>Japanese Description:</strong> {modalData.japanese_details}</p>
                            <p><strong>Description:</strong></p>
                            <div className="mb-3">{modalData.description}</div>
                            {modalData.images?.length > 0 && (
                                <div className="mb-3">
                                    <img
                                        src={typeof modalData.images[0] === "string" ? getImageUrl(modalData.images[0]) : URL.createObjectURL(modalData.images[0])}
                                        alt="" width="200" className="rounded border"/>
                                </div>
                            )}
                            <p><strong>Created By:</strong> {modalData.creator?.name}</p>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetail(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
