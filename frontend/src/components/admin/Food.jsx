import { useState, useEffect, useCallback } from "react";
import { Modal, Button, Table, Form, Pagination } from "react-bootstrap";
import API from "../../services/api";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function Food() {
    const [foods, setFoods] = useState([]);
    const [branches, setBranches] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        branch_id: "",
        meal_type: "",
        category_id: "",
        name: "",
        japanese_name: "",
        price: "",
        description: "",
        jp_description: "",
        images: [],
        old_images: [],
        is_available: true,
        spice_level: "",
        set_menu_image: null,
        old_set_menu_image: null,
        is_takeout_menu: false,
    });
    const [imagePreview, setImagePreview] = useState([]);
    const [setMenuPreview, setSetMenuPreview] = useState(null);
    const [isEdit, setIsEdit] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const SPICE_CATEGORY_ID = "9";
    const SPICE_LEVELS = [
        { value: "mild", label: "1 マイルド (MILD)" },
        { value: "medium", label: "2 普通 (MEDIUM)" },
        { value: "hot", label: "3 中辛 (HOT)" },
        { value: "very_hot", label: "4 大辛 (VERY HOT)" },
        { value: "super_hot", label: "5 激辛 (SUPER HOT)" },
    ];

    const fetchFoods = useCallback(async (page = 1) => {
        try {
            const res = await API.get(`/food?search=${encodeURIComponent(search)}&page=${page}`);
            setFoods(res.data.data || []);
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
            let all = [];
            let page = 1;
            let hasNext = true;

            while (hasNext) {
                const res = await API.get(`/category?page=${page}`);
                const data = res.data.data || [];
                all = [...all, ...data];
                hasNext = res.data.next_page_url !== null;
                page++;
            }

            setCategories(all);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchFoods();
        fetchBranches();
        fetchCategories();
    }, [fetchFoods]);

    const getImageUrl = (path) => (path ? `${BASE_URL}/storage/${path}` : null);

    const handleChange = (e) => {
        const { name, value, files, type, checked } = e.target;

        if (name === "images") {
            const fileArray = Array.from(files);
            setModalData(prev => ({ ...prev, images: fileArray }));
            setImagePreview(fileArray.map(file => URL.createObjectURL(file)));
        } else if (name === "set_menu_image") {
            const file = files[0];
            setModalData(prev => ({ ...prev, set_menu_image: file }));
            setSetMenuPreview(file ? URL.createObjectURL(file) : null);
        } else if (type === "checkbox") {
            setModalData(prev => ({ ...prev, [name]: checked }));
        } else {
            setModalData(prev => {
                let updated = { ...prev, [name]: value };
                if (name === "category_id" && String(value) !== SPICE_CATEGORY_ID) {
                    updated.spice_level = "";
                }
                return updated;
            });
        }

        setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleRemoveNewImage = (index) => {
        setModalData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
        setImagePreview(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveOldImage = (index) => {
        setModalData(prev => ({ ...prev, old_images: prev.old_images.filter((_, i) => i !== index) }));
    };

    const resetModal = () => {
        setModalData(prev => ({
            branch_id: "",
            meal_type: "",
            category_id: "",
            name: "",
            japanese_name: "",
            price: "",
            description: "",
            jp_description: "",
            images: [],
            old_images: [],
            is_available: true,
            spice_level: "",
            set_menu_image: null,
            old_set_menu_image: null,
            is_takeout_menu: false,
        }));
        setImagePreview([]);
        setSetMenuPreview(null);
        setErrors({});
        setIsEdit(false);
    };

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
            Object.keys(modalData).forEach((key) => {
                if (key === "images") {
                    modalData.images.forEach(file => formData.append("images[]", file));
                } else if (key === "old_images") {
                    modalData.old_images.forEach(img => formData.append("old_images[]", img));
                } else if (key === "set_menu_image" && modalData.set_menu_image) {
                    formData.append("set_menu_image", modalData.set_menu_image);
                } else if (key === "old_set_menu_image" && modalData.old_set_menu_image) {
                    formData.append("old_set_menu_image", modalData.old_set_menu_image);
                } else if (modalData[key] !== null && modalData[key] !== undefined) {
                    if (key === "is_available" || key == "is_takeout_menu") {
                        formData.append(key, modalData[key] ? 1 : 0);
                    } else {
                        formData.append(key, modalData[key]);
                    }
                }
            });

            await API.post(
                isEdit ? `/food/${modalData.id}?_method=PUT` : "/food",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            fetchFoods(currentPage);
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
        if (!window.confirm("Are you sure you want to delete this food?")) return;
        try {
            await API.delete(`/food/${id}`);
            fetchFoods(currentPage);
        } catch (err) {
            console.error(err);
            alert("Failed to delete food");
        }
    };

    const openEdit = (food) => {
        setModalData({
            ...food,
            images: [],
            old_images: food.images || [],
            set_menu_image: null,
            old_set_menu_image: food.set_menu_image || null,
        });
        setImagePreview([]);
        setSetMenuPreview(food.set_menu_image ? getImageUrl(food.set_menu_image) : null);
        setIsEdit(true);
        setShowModal(true);
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between mb-3">
                <Form.Control
                    type="text"
                    placeholder="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: "300px" }}
                />
                <Button
                    onClick={() => {
                        resetModal();
                        setShowModal(true);
                    }}
                >
                    Add Food
                </Button>
            </div>

            <Table striped bordered hover responsive>
                <thead>
                <tr>
                    <th>Branch</th>
                    <th>Meal Type</th>
                    <th>Category</th>
                    <th>Name</th>
                    <th>Japanese Name</th>
                    <th>Price</th>
                    <th>Available</th>
                    <th>Takeout</th>
                    <th>Images</th>
                    <th>Set Menu Image</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {foods.map(food => (
                    <tr key={food.id}>
                        <td>{food.branch?.name || "-"}</td>
                        <td>{food.meal_type || "-"}</td>
                        <td>{food.category?.name || "-"}</td>
                        <td>{food.name || "-"}</td>
                        <td>{food.japanese_name || "-"}</td>
                        <td>{food.price || "-"}</td>
                        <td>{food.is_available ? "Yes" : "No"}</td>
                        <td>{food.is_takeout_menu == "1" ? "Yes" : "No"}</td>
                        <td>
                            {(food.images || []).map((img, idx) => (
                                <img key={idx} src={getImageUrl(img)} width="50" className="me-1 mb-1 rounded"
                                     alt="food"/>
                            ))}
                        </td>
                        <td>
                            {food.set_menu_image && (
                                <img src={getImageUrl(food.set_menu_image)} width="50" className="rounded"
                                     alt="set menu"/>
                            )}
                        </td>
                        <td>
                            <Button
                                variant="info"
                                size="sm"
                                className="me-2"
                                onClick={() => {
                                    setModalData({
                                        ...food,
                                        old_images: food.images || [],
                                        old_set_menu_image: food.set_menu_image || null,
                                    });
                                    setImagePreview([]);
                                    setSetMenuPreview(food.set_menu_image ? getImageUrl(food.set_menu_image) : null);
                                    setShowDetailModal(true);
                                }}
                            >
                                Details
                            </Button>
                            <Button
                                variant="warning"
                                size="sm"
                                className="me-2"
                                onClick={() => openEdit(food)}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(food.id)}
                            >
                                Delete
                            </Button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </Table>

            <Pagination>
                {Array.from({ length: totalPages }, (_, i) => (
                    <Pagination.Item
                        key={i + 1}
                        active={i + 1 === currentPage}
                        onClick={() => fetchFoods(i + 1)}
                    >
                        {i + 1}
                    </Pagination.Item>
                ))}
            </Pagination>

            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Form onSubmit={handleSubmit} encType="multipart/form-data">
                    <Modal.Header closeButton>
                        <Modal.Title>{isEdit ? "Edit Food" : "Add Food"}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {/* Branch */}
                        <Form.Group className="mb-3">
                            <Form.Label>Branch</Form.Label>
                            <Form.Select
                                name="branch_id"
                                value={modalData.branch_id || ""}
                                onChange={handleChange}
                                isInvalid={!!errors.branch_id}
                            >
                                <option value="">Select Branch</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">{errors.branch_id?.[0]}</Form.Control.Feedback>
                        </Form.Group>

                        {/* Meal Type */}
                        <Form.Group className="mb-3">
                            <Form.Label>Meal Type</Form.Label>
                            <Form.Select
                                name="meal_type"
                                value={modalData.meal_type || ""}
                                onChange={handleChange}
                                isInvalid={!!errors.meal_type}
                            >
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

                        {/* Category */}
                        <Form.Group className="mb-3">
                            <Form.Label>Category</Form.Label>
                            <Form.Select
                                name="category_id"
                                value={modalData.category_id || ""}
                                onChange={handleChange}
                                isInvalid={!!errors.category_id}
                            >
                                <option value="">Select Category</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">{errors.category_id?.[0]}</Form.Control.Feedback>
                        </Form.Group>

                        {/* Name */}
                        <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                name="name"
                                value={modalData.name || ""}
                                onChange={handleChange}
                                isInvalid={!!errors.name}
                            />
                            <Form.Control.Feedback type="invalid">{errors.name?.[0]}</Form.Control.Feedback>
                        </Form.Group>

                        {/* Japanese Name */}
                        <Form.Group className="mb-3">
                            <Form.Label>Japanese Name</Form.Label>
                            <Form.Control
                                name="japanese_name"
                                value={modalData.japanese_name || ""}
                                onChange={handleChange}
                                isInvalid={!!errors.japanese_name}
                            />
                            <Form.Control.Feedback type="invalid">{errors.japanese_name?.[0]}</Form.Control.Feedback>
                        </Form.Group>

                        {/* Price */}
                        <Form.Group className="mb-3">
                            <Form.Label>Price</Form.Label>
                            <Form.Control
                                type="number"
                                name="price"
                                value={modalData.price || ""}
                                onChange={handleChange}
                                isInvalid={!!errors.price}
                            />
                            <Form.Control.Feedback type="invalid">{errors.price?.[0]}</Form.Control.Feedback>
                        </Form.Group>

                        {/* Description */}
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                name="description"
                                value={modalData.description || ""}
                                onChange={handleChange}
                                isInvalid={!!errors.description}
                            />
                            <Form.Control.Feedback type="invalid">{errors.description?.[0]}</Form.Control.Feedback>
                        </Form.Group>

                        {/* Japanese Description */}
                        <Form.Group className="mb-3">
                            <Form.Label>Japanese Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                name="jp_description"
                                value={modalData.jp_description || ""}
                                onChange={handleChange}
                                isInvalid={!!errors.jp_description}
                            />
                            <Form.Control.Feedback type="invalid">{errors.jp_description?.[0]}</Form.Control.Feedback>
                        </Form.Group>

                        {/* Is Available */}
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Is Available"
                                name="is_available"
                                checked={modalData.is_available}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        {/* Is Takeout Menu */}
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Is Takeout Menu"
                                name="is_takeout_menu"
                                checked={modalData.is_takeout_menu == "1"}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        {/* Images */}
                        <Form.Group className="mb-3">
                            <Form.Label>Images</Form.Label>
                            <Form.Control
                                type="file"
                                name="images"
                                onChange={handleChange}
                                isInvalid={!!errors.images}
                                multiple
                            />
                            <Form.Control.Feedback type="invalid">{errors.images?.[0]}</Form.Control.Feedback>

                            <div className="d-flex flex-wrap mt-2">
                                {(imagePreview || []).map((src, idx) => (
                                    <div key={`new-${idx}`} className="position-relative me-2 mb-2">
                                        <img src={src} alt="preview" width="100" className="rounded border" />
                                        <Button
                                            size="sm"
                                            variant="outline-danger"
                                            className="position-absolute top-0 end-0"
                                            onClick={() => handleRemoveNewImage(idx)}
                                        >
                                            ×
                                        </Button>
                                    </div>
                                ))}

                                {(modalData.old_images || []).map((src, idx) => (
                                    <div key={`old-${idx}`} className="position-relative me-2 mb-2">
                                        <img src={getImageUrl(src)} alt={`old-${idx}`} width="100" className="rounded border" />
                                        <Button
                                            size="sm"
                                            variant="outline-danger"
                                            className="position-absolute top-0 end-0"
                                            onClick={() => handleRemoveOldImage(idx)}
                                        >
                                            ×
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </Form.Group>

                        {/* Set Menu Image */}
                        <Form.Group className="mb-3">
                            <Form.Label>Set Menu Image</Form.Label>
                            <Form.Control
                                type="file"
                                name="set_menu_image"
                                onChange={handleChange}
                                accept="image/*"
                            />
                            {setMenuPreview && (
                                <div className="mt-2 position-relative">
                                    <img
                                        src={setMenuPreview}
                                        alt="Set Menu Preview"
                                        width="100"
                                        className="rounded border"
                                    />
                                </div>
                            )}
                        </Form.Group>

                        {/* Spice Level */}
                        {String(modalData.category_id) === SPICE_CATEGORY_ID && (
                            <Form.Group className="mb-3">
                                <Form.Label>Spice Level</Form.Label>
                                <Form.Select
                                    name="spice_level"
                                    value={modalData.spice_level || ""}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Spice Level</option>
                                    {SPICE_LEVELS.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? "Saving..." : "Save"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Details Modal */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Food Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalData && (
                        <>
                            <p><strong>Branch:</strong> {modalData.branch?.name || "-"}</p>
                            <p><strong>Meal Type:</strong> {modalData.meal_type || "-"}</p>
                            <p><strong>Category:</strong> {modalData.category?.name || "-"}</p>
                            <p><strong>Name:</strong> {modalData.name || "-"}</p>
                            <p><strong>Japanese Name:</strong> {modalData.japanese_name || "-"}</p>
                            <p><strong>Price:</strong> {modalData.price || "-"}</p>
                            <p><strong>Description:</strong> {modalData.description || "-"}</p>
                            <p><strong>Japanese Description:</strong> {modalData.jp_description || "-"}</p>
                            <p><strong>Available:</strong> {modalData.is_available ? "Yes" : "No"}</p>
                            <p><strong>Takeout Menu:</strong> {modalData.is_takeout_menu == "1" ? "Yes" : "No"}</p>
                            {String(modalData.category_id) === SPICE_CATEGORY_ID && (
                                <p>
                                    <strong>Spice Level:</strong>{" "}
                                    {SPICE_LEVELS.find((lvl) => lvl.value === modalData.spice_level)?.label || "-"}
                                </p>
                            )}

                            {/* ✅ Set Menu Image Section */}
                            {(modalData.old_set_menu_image || setMenuPreview) && (
                                <div className="mb-3">
                                    <strong>Set Menu Image:</strong>
                                    <div className="mt-2">
                                        {setMenuPreview && (
                                            <img
                                                src={setMenuPreview}
                                                alt="New Set Menu"
                                                width="150"
                                                className="rounded border"
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            <strong>Food Image:</strong>
                            <div className="d-flex flex-wrap mt-2">
                                {(modalData.old_images || []).map((img, idx) => (
                                    <img
                                        key={`old-${idx}`}
                                        src={getImageUrl(img)}
                                        width="100"
                                        className="me-2 mb-2 rounded border"
                                        alt={`old-${idx}`}
                                    />
                                ))}

                                {(imagePreview || []).map((src, idx) => (
                                    <img
                                        key={`new-${idx}`}
                                        src={src}
                                        width="100"
                                        className="me-2 mb-2 rounded border"
                                        alt={`new-${idx}`}
                                    />
                                ))}
                            </div>
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

export default Food;
