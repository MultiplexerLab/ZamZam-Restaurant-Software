import { useState, useEffect, useCallback } from "react";
import { Modal, Button, Table, Form, Pagination } from "react-bootstrap";
import API from "../../services/api";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function SetMenuV1() {
    const [setMenus, setSetMenus] = useState([]);
    const [branches, setBranches] = useState([]);
    const [categories, setCategories] = useState([]);
    const [foodsByCategory, setFoodsByCategory] = useState({}); // cached foods per category
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailData, setDetailData] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        branch_id: "",
        title: "",
        japanese_title: "",
        meal_type: "",
        description: "",
        jp_description: "",
        base_price: "",
        is_available: true,
        is_takeout_menu: false,
        images: [],
        old_images: [],
        slots: [], // {category_id, type, default_food_id, quantity, other_foods: [{food_id, additional_price}]}
    });
    const [imagePreview, setImagePreview] = useState([]);
    const [slotForm, setSlotForm] = useState({
        category_id: "",
        type: "choosable",
        default_food_id: "",
        quantity: 1,
        other_foods: [],
    });
    const [editingSlotIndex, setEditingSlotIndex] = useState(null);

    const [isEdit, setIsEdit] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // NEW: track original old images and removed ones (fix for deletion)
    const [originalOldImages, setOriginalOldImages] = useState([]); // snapshot when opening edit
    const [removedOldImages, setRemovedOldImages] = useState([]); // images user removed

    // Fetch set menus
    const fetchSetMenus = useCallback(async (page = 1) => {
        try {
            const res = await API.get(`/admin/set-menus?search=${encodeURIComponent(search)}&page=${page}`);
            setSetMenus(mapSetMenus(res.data) || []);
            setCurrentPage(res.data.current_page || 1);
            setTotalPages(res.data.last_page || 1);
        } catch (err) {
            console.error(err);
        }
    }, [search]);

    const fetchBranches = async () => {
        try {
            const res = await API.get("/branch");
            setBranches(res.data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await API.get("/category");
            setCategories(res.data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchFoodsByCategory = async (categoryId) => {
        if (!categoryId || foodsByCategory[categoryId]) return;
        try {
            const res = await API.get(`/admin/categories/${categoryId}/foods`);
            setFoodsByCategory(prev => ({ ...prev, [categoryId]: res.data || [] }));
        } catch (err) {
            console.error(err);
        }
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
                    default_food: f.default_food, // keep full object if needed
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
            };
        });

        return {
            ...menu,
            slots,
        };
    }

    const mapSetMenus = (apiResponse) => {
        return apiResponse.map(menu => {
            return mapMenu(menu)
        });
    }

    useEffect(() => {
        fetchSetMenus();
        fetchBranches();
        fetchCategories();
    }, [fetchSetMenus]);

    const getImageUrl = (path) => path ? `${BASE_URL}/storage/${path}` : null;

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

    const resetModal = () => {
        setModalData({
            branch_id: "",
            title: "",
            japanese_title: "",
            meal_type: "",
            description: "",
            jp_description: "",
            base_price: "",
            is_available: true,
            is_takeout_menu: false, // ✅ reset value
            images: [],
            old_images: [],
            slots: [],
        });
        setImagePreview([]);
        setErrors({});
        setIsEdit(false);
        setSlotForm({ category_id: "", type: "choosable", default_food_id: "", quantity: 1, other_foods: [] });
        setEditingSlotIndex(null);
        setOriginalOldImages([]);
        setRemovedOldImages([]);
    };

    const handleRemoveNewImage = (index) => {
        setModalData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
        setImagePreview(prev => prev.filter((_, i) => i !== index));
    };

    // UPDATED: when removing old image, track that it was removed (for backend)
    const handleRemoveOldImage = (index) => {
        setModalData(prev => {
            const removed = prev.old_images[index];
            // push removed into removedOldImages if it's not already there
            setRemovedOldImages(prevRemoved => {
                if (removed == null) return prevRemoved;
                // avoid duplicates
                return prevRemoved.includes(removed) ? prevRemoved : [...prevRemoved, removed];
            });
            const newOld = prev.old_images.filter((_, i) => i !== index);
            return { ...prev, old_images: newOld };
        });
    };

    // ----- Slots management -----
    const handleSlotChange = (e) => {
        const { name, value } = e.target;
        setSlotForm(prev => ({ ...prev, [name]: value }));
        if (name === "category_id") {
            setSlotForm(prev => ({ ...prev, default_food_id: "", other_foods: [] }));
            fetchFoodsByCategory(value);
        }
    };

    const addOrUpdateSlot = () => {
        const slot = { ...slotForm };
        const updatedSlots = [...modalData.slots];
        if (editingSlotIndex !== null) {
            updatedSlots[editingSlotIndex] = slot;
        } else {
            updatedSlots.push(slot);
        }
        setModalData(prev => ({ ...prev, slots: updatedSlots }));
        setSlotForm({ category_id: "", type: "choosable", default_food_id: "", quantity: 1, other_foods: [] });
        setEditingSlotIndex(null);
    };

    const editSlot = (index) => {
        setSlotForm({ ...modalData.slots[index] });
        setEditingSlotIndex(index);
    };

    const removeSlot = (index) => {
        setModalData(prev => ({ ...prev, slots: prev.slots.filter((_, i) => i !== index) }));
    };

    // ----- Submit set menu -----
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        if (!isEdit && modalData.images.length === 0) {
            setErrors({ images: ["At least one image is required"] });
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            Object.keys(modalData).forEach(key => {
                if (key === "images") {
                    modalData.images.forEach(file => formData.append("images[]", file));
                } else if (key === "old_images") {
                    // append remaining old images (if backend expects remaining)
                    modalData.old_images.forEach(img => formData.append("old_images[]", img));
                } else if (key === "slots") {
                    formData.append("slots", JSON.stringify(modalData.slots));
                } else if (key === "is_available" || key === "is_takeout_menu") {
                    // ✅ handle booleans as 1/0
                    formData.append(key, modalData[key] ? 1 : 0);
                }
                else {
                    formData.append(key, modalData[key]);
                }
            });

            // IMPORTANT: also append removed_old_images[] explicitly so backend knows which to delete
            removedOldImages.forEach(img => formData.append("removed_old_images[]", img));

            await API.post(
                isEdit ? `/admin/set-menus/${modalData.id}?_method=PUT` : "/admin/set-menus",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            fetchSetMenus(currentPage);
            setShowModal(false);
            resetModal();
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                alert(err.response?.data?.message || "Something went wrong");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this set menu?")) return;
        try {
            await API.delete(`/admin/set-menus/${id}`);
            fetchSetMenus(currentPage);
        } catch (err) {
            console.error(err);
            alert("Failed to delete set menu");
        }
    };

    const openEdit = (menu) => {
        setModalData({
            ...menu,
            images: [],
            old_images: menu.images || [],
            jp_description: menu.jp_description || "",
            slots: menu.slots?.map(s => ({
                ...s,
                other_foods: s.other_foods || []
            })) || [],
        });
        setImagePreview([]);
        setIsEdit(true);
        setShowModal(true);

        // NEW: snapshot original old images and clear removed tracking
        setOriginalOldImages(menu.images || []);
        setRemovedOldImages([]);
    };

    const handleShowDetails = async (id) => {
        try {
            const res = await API.get(`/admin/set-menus/${id}`);
            setDetailData(mapMenu(res.data));
            setShowDetailModal(true);
        } catch (err) {
            console.error(err);
            alert("Failed to fetch set menu details");
        }
    };

    return (
        <div className="container mt-4">
            {/* Search & Add */}
            <div className="d-flex justify-content-between mb-3">
                <Form.Control
                    type="text"
                    placeholder="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: "300px" }}
                />
                <Button onClick={() => { resetModal(); setShowModal(true); }}>Add Set Menu</Button>
            </div>

            {/* Set Menus Table */}
            <Table striped bordered hover responsive>
                <thead>
                <tr>
                    <th>Branch</th>
                    <th>Title</th>
                    <th>Japanese Title</th>
                    <th>Meal Type</th>
                    <th>Base Price</th>
                    <th>Available</th>
                    <th>Takeout</th>
                    <th>Images</th>
                    <th>Food Items</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {setMenus.map(menu => (
                    <tr key={menu.id}>
                        <td>{menu.branch?.name || "-"}</td>
                        <td>{menu.title}</td>
                        <td>{menu.japanese_title || "-"}</td>
                        <td>{menu.meal_type || "-"}</td>
                        <td>{menu.base_price}</td>
                        <td>{menu.is_available ? "Yes" : "No"}</td>
                        <td>{menu.is_takeout_menu ? "Yes" : "No"}</td>
                        <td>
                            {(menu.images || []).map((img, idx) => (
                                <img key={idx} src={getImageUrl(img)} width="50" className="me-1 mb-1 rounded" alt="menu" />
                            ))}
                        </td>
                        <td>{menu.slots?.length || 0}</td>
                        <td>
                            <Button variant="warning" size="sm" className="me-2" onClick={() => openEdit(menu)}>Edit</Button>
                            <Button variant="danger" size="sm" onClick={() => handleDelete(menu.id)}>Delete</Button>
                            <Button variant="info" size="sm" className="me-2" onClick={() => handleShowDetails(menu.id)}>Details</Button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </Table>

            {/* Pagination */}
            <Pagination>
                {Array.from({ length: totalPages }, (_, i) => (
                    <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => fetchSetMenus(i + 1)}>
                        {i + 1}
                    </Pagination.Item>
                ))}
            </Pagination>

            {/* Add/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Form onSubmit={handleSubmit} encType="multipart/form-data">
                    <Modal.Header closeButton>
                        <Modal.Title>{isEdit ? "Edit Set Menu" : "Add Set Menu"}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {/* Branch */}
                        <Form.Group className="mb-3">
                            <Form.Label>Branch</Form.Label>
                            <Form.Select name="branch_id" value={modalData.branch_id} onChange={handleChange} isInvalid={!!errors.branch_id}>
                                <option value="">Select Branch</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">{errors.branch_id?.[0]}</Form.Control.Feedback>
                        </Form.Group>

                        {/* Title */}
                        <Form.Group className="mb-3">
                            <Form.Label>Title</Form.Label>
                            <Form.Control name="title" value={modalData.title} onChange={handleChange} isInvalid={!!errors.title} />
                            <Form.Control.Feedback type="invalid">{errors.title?.[0]}</Form.Control.Feedback>
                        </Form.Group>

                        {/* Japanese Title */}
                        <Form.Group className="mb-3">
                            <Form.Label>Japanese Title</Form.Label>
                            <Form.Control name="japanese_title" value={modalData.japanese_title} onChange={handleChange} isInvalid={!!errors.japanese_title} />
                            <Form.Control.Feedback type="invalid">{errors.japanese_title?.[0]}</Form.Control.Feedback>
                        </Form.Group>

                        {/* Meal Type */}
                        <Form.Group className="mb-3">
                            <Form.Label>Meal Type</Form.Label>
                            <Form.Select name="meal_type" value={modalData.meal_type} onChange={handleChange} isInvalid={!!errors.meal_type}>
                                <option value="">Select Meal Type</option>
                                {[
                                    { label: "A-la-carte menu/単品メニュー", value: "thampin" },
                                    { label: "Lunch Menu/ランチメニュー", value: "lunch" },
                                    { label: "Dinner Menu/夕食", value: "dinner" }
                                ].map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">{errors.meal_type?.[0]}</Form.Control.Feedback>
                        </Form.Group>

                        {/* Base Price */}
                        <Form.Group className="mb-3">
                            <Form.Label>Base Price</Form.Label>
                            <Form.Control type="number" name="base_price" value={modalData.base_price} onChange={handleChange} isInvalid={!!errors.base_price} />
                            <Form.Control.Feedback type="invalid">{errors.base_price?.[0]}</Form.Control.Feedback>
                        </Form.Group>

                        {/* Description */}
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control as="textarea" rows={2} name="description" value={modalData.description} onChange={handleChange} isInvalid={!!errors.description} />
                            <Form.Control.Feedback type="invalid">{errors.description?.[0]}</Form.Control.Feedback>
                        </Form.Group>

                        {/* Japanese Description */}
                        <Form.Group className="mb-3">
                            <Form.Label>Japanese Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                name="jp_description"
                                value={modalData.jp_description}
                                onChange={handleChange}
                                isInvalid={!!errors.jp_description}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.jp_description?.[0]}
                            </Form.Control.Feedback>
                        </Form.Group>

                        {/* Availability */}
                        <Form.Group className="mb-3">
                            <Form.Check type="checkbox" label="Is Available" name="is_available" checked={modalData.is_available} onChange={handleChange} />
                        </Form.Group>

                        {/* Takeout Menu */}
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Is Takeout Menu"
                                name="is_takeout_menu"
                                checked={modalData.is_takeout_menu}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        {/* Images */}
                        <Form.Group className="mb-3">
                            <Form.Label>Images</Form.Label>
                            <Form.Control type="file" name="images" onChange={handleChange} isInvalid={!!errors.images} multiple />
                            <Form.Control.Feedback type="invalid">{errors.images?.[0]}</Form.Control.Feedback>

                            <div className="d-flex flex-wrap mt-2">
                                {imagePreview.map((src, idx) => (
                                    <div key={`new-${idx}`} className="position-relative me-2 mb-2">
                                        <img src={src} width="100" className="rounded border" alt="preview" />
                                        <Button size="sm" variant="outline-danger" className="position-absolute top-0 end-0" onClick={() => handleRemoveNewImage(idx)}>×</Button>
                                    </div>
                                ))}
                                {modalData.old_images.map((img, idx) => (
                                    <div key={`old-${idx}`} className="position-relative me-2 mb-2">
                                        <img src={getImageUrl(img)} width="100" className="rounded border" alt={`old-${idx}`} />
                                        <Button size="sm" variant="outline-danger" className="position-absolute top-0 end-0" onClick={() => handleRemoveOldImage(idx)}>×</Button>
                                    </div>
                                ))}
                            </div>
                        </Form.Group>

                        {/* Slots */}
                        <h5>Food Items</h5>
                        <Table bordered size="sm">
                            <thead>
                            <tr>
                                <th>Category</th>
                                <th>Type</th>
                                <th>Default Food</th>
                                <th>Quantity</th>
                                <th>Other Foods (Add. Price)</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {modalData.slots.map((slot, idx) => (
                                <tr key={idx}>
                                    <td>{categories.find(c => c.id === slot.category_id)?.name || "-"}</td>
                                    <td>{slot.type}</td>
                                    <td>{foodsByCategory[slot.category_id]?.find(f => f.id === slot.default_food_id)?.name || "-"}</td>
                                    <td>{slot.quantity}</td>
                                    <td>{slot.other_foods?.map(f => `${f.name}: ${f.additional_price}`).join(", ")}</td>
                                    <td>
                                        <Button size="sm" onClick={() => editSlot(idx)}>Edit</Button>{" "}
                                        <Button size="sm" variant="danger" onClick={() => removeSlot(idx)}>Delete</Button>
                                    </td>
                                </tr>
                            ))}

                            {/* Add / Edit slot row */}
                            <tr>
                                <td>
                                    <Form.Select name="category_id" value={slotForm.category_id} onChange={handleSlotChange}>
                                        <option value="">Select</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </Form.Select>
                                </td>
                                <td>
                                    <Form.Select name="type" value={slotForm.type} onChange={handleSlotChange}>
                                        <option value="changeable">Changeable</option>
                                        <option value="choosable">Choosable</option>
                                        <option value="fixed">Fixed</option>
                                    </Form.Select>
                                </td>
                                <td>
                                    {slotForm.category_id && (slotForm.type !== "choosable") && (
                                        <Form.Select name="default_food_id" value={slotForm.default_food_id} onChange={handleSlotChange}>
                                            <option value="">Select Food</option>
                                            {foodsByCategory[slotForm.category_id]?.map(f => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </Form.Select>
                                    )}
                                </td>
                                <td>
                                    <Form.Control type="number" name="quantity" value={slotForm.quantity} onChange={handleSlotChange} />
                                </td>
                                <td>
                                    {slotForm.category_id && slotForm.type === "changeable" && (
                                        foodsByCategory[slotForm.category_id]
                                            ?.filter(f => f.id !== slotForm.default_food_id)
                                            .map(f => (
                                                <div key={f.id}>
                                                    {f.name}:
                                                    <Form.Control
                                                        type="number"
                                                        size="sm"
                                                        value={slotForm.other_foods?.find(of => of.food_id === f.id)?.additional_price || 0}
                                                        onChange={e => {
                                                            const price = Number(e.target.value);
                                                            setSlotForm(prev => ({
                                                                ...prev,
                                                                other_foods: prev.other_foods.map(of =>
                                                                    of.food_id === f.id ? { ...of, additional_price: price } : of
                                                                ).concat(prev.other_foods.find(of => of.food_id === f.id) ? [] : [{food_id: f.id, name: f.name, additional_price: price}])
                                                            }));
                                                        }}
                                                    />
                                                </div>
                                            ))
                                    )}
                                </td>
                                <td>
                                    <Button size="sm" onClick={addOrUpdateSlot}>
                                        {editingSlotIndex !== null ? "Update" : "Add"}
                                    </Button>
                                </td>
                            </tr>
                            </tbody>
                        </Table>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
                        <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Details Modal */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Set Menu Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {detailData && (
                        <>
                            <p><strong>Branch:</strong> {detailData.branch?.name || "-"}</p>
                            <p><strong>Title:</strong> {detailData.title || "-"}</p>
                            <p><strong>Japanese Title:</strong> {detailData.japanese_title || "-"}</p>
                            <p><strong>Meal Type:</strong> {detailData.meal_type || "-"}</p>
                            <p><strong>Description:</strong> {detailData.description || "-"}</p>
                            <p><strong>JP Description:</strong> {detailData.jp_description || "-"}</p>
                            <p><strong>Base Price:</strong> ¥{detailData.base_price || 0}</p>
                            <p><strong>Is available:</strong> {detailData.is_available ? "Yes" : "No"}</p>
                            <p><strong>Takeout Menu:</strong> {detailData.is_takeout_menu ? "Yes" : "No"}</p>
                            <div className="d-flex flex-wrap mb-3">
                                {(detailData.images || []).map((img, idx) => (
                                    <img key={idx} src={`${BASE_URL}/storage/${img}`} alt={`setmenu-${idx}`} width="100"
                                         className="me-2 mb-2 rounded border"/>
                                ))}
                            </div>

                            <h5>Food Items</h5>
                            {detailData.slots.length > 0 ? (
                                <Table striped bordered hover size="sm">
                                    <thead>
                                    <tr>
                                        <th>Category</th>
                                        <th>Type</th>
                                        <th>Default Food</th>
                                        <th>Quantity</th>
                                        <th>Other Foods (Add. Price)</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {detailData.slots.map(slot => (
                                        <tr key={slot.id}>
                                            <td>{slot.category_name || "-"}</td>
                                            <td>{slot.type}</td>
                                            <td>{slot.default_food?.name || "-"}</td>
                                            <td>{slot.quantity}</td>
                                            <td>{slot.other_foods?.map(f => `${f.name}: ${f.additional_price}`).join(", ")}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <p>No FoodItem found.</p>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default SetMenuV1;
