import { useState, useEffect, useCallback } from "react";
import { Modal, Button, Table, Form, Pagination } from "react-bootstrap";
import API from "../../services/api";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function Category() {
    const [categories, setCategories] = useState([]);
    const [branches, setBranches] = useState([]);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        branch_id: "",
        name: "",
        japanese_name: "",
        description: "",
        image: null,
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [isEdit, setIsEdit] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Fetch categories
    const fetchCategories = useCallback(async (page = 1) => {
        try {
            const res = await API.get(`/category?search=${search}&page=${page}`);
            setCategories(res.data.data);
            setCurrentPage(res.data.current_page);
            setTotalPages(res.data.last_page);
        } catch (err) {
            console.error(err);
        }
    }, [search]);

    // Fetch branches
    const fetchBranches = async () => {
        try {
            const res = await API.get("/branch");
            setBranches(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchBranches();
    }, [fetchCategories]);

    // Handle form input
    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "image") {
            const file = files[0];
            setModalData({ ...modalData, image: file });

            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setImagePreview(reader.result);
                reader.readAsDataURL(file);
            } else {
                setImagePreview(null);
            }
        } else {
            setModalData({ ...modalData, [name]: value });
        }
        setErrors({ ...errors, [name]: null });
    };

    // Create / Update
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        try {
            const formData = new FormData();
            formData.append("branch_id", modalData.branch_id);
            formData.append("name", modalData.name);
            formData.append("japanese_name", modalData.japanese_name);
            formData.append("description", modalData.description);
            if (modalData.image) formData.append("image", modalData.image);

            if (isEdit) {
                await API.post(`/category/${modalData.id}?_method=PUT`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } else {
                await API.post(`/category`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }

            fetchCategories(currentPage);
            setShowModal(false);
            setModalData({ branch_id: "", name: "", japanese_name: "", description: "", image: null });
            setImagePreview(null);
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

    // Delete
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this category?")) return;
        try {
            await API.delete(`/category/${id}`);
            fetchCategories(currentPage);
        } catch (err) {
            console.error(err);
            alert("Failed to delete category");
        }
    };

    const getImageUrl = (path) => `${BASE_URL}/storage/${path}`;

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
                        setModalData({ branch_id: "", name: "", japanese_name: "", description: "", image: null });
                        setImagePreview(null);
                        setIsEdit(false);
                        setErrors({});
                        setShowModal(true);
                    }}
                >
                    Add Category
                </Button>
            </div>

            <Table striped bordered hover responsive>
                <thead>
                <tr>
                    <th>Branch</th>
                    <th>Name</th>
                    <th>Japanese Name</th>
                    <th>Description</th>
                    <th>Image</th>
                    <th>Created By</th>
                    <th>Created At</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {categories.map((c) => (
                    <tr key={c.id}>
                        <td>{c.branch?.name}</td>
                        <td>{c.name}</td>
                        <td>{c.japanese_name}</td>
                        <td>{c.description}</td>
                        <td>
                            {c.image && (
                                <img
                                    src={getImageUrl(c.image)}
                                    alt=""
                                    width="50"
                                />
                            )}
                        </td>
                        <td>{c.creator?.name}</td>
                        <td>{new Date(c.created_at).toLocaleString()}</td>
                        <td>
                            <Button
                                size="sm"
                                variant="info"
                                className="me-1"
                                onClick={() => {
                                    setModalData(c);
                                    setIsEdit(true);
                                    setErrors({});
                                    setShowModal(true);
                                    setImagePreview(c.image ? getImageUrl(c.image) : null);
                                }}
                            >
                                Edit
                            </Button>
                            <Button
                                size="sm"
                                variant="danger"
                                className="me-1"
                                onClick={() => handleDelete(c.id)}
                            >
                                Delete
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                    setModalData(c);
                                    setShowDetailModal(true);
                                }}
                            >
                                View
                            </Button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </Table>

            {/* Pagination */}
            <Pagination>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Pagination.Item
                        key={page}
                        active={page === currentPage}
                        onClick={() => fetchCategories(page)}
                    >
                        {page}
                    </Pagination.Item>
                ))}
            </Pagination>

            {/* Create / Update Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Form onSubmit={handleSubmit} encType="multipart/form-data">
                    <Modal.Header closeButton>
                        <Modal.Title>{isEdit ? "Update Category" : "Add Category"}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Branch</Form.Label>
                            <Form.Select
                                name="branch_id"
                                value={modalData.branch_id}
                                onChange={handleChange}
                                isInvalid={!!errors.branch_id}
                            >
                                <option value="">Select Branch</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                                {errors.branch_id?.[0]}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={modalData.name}
                                onChange={handleChange}
                                isInvalid={!!errors.name}
                            />
                            <Form.Control.Feedback type="invalid">{errors.name?.[0]}</Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Japanese Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="japanese_name"
                                value={modalData.japanese_name}
                                onChange={handleChange}
                                isInvalid={!!errors.japanese_name}
                            />
                            <Form.Control.Feedback type="invalid">{errors.japanese_name?.[0]}</Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                name="description"
                                value={modalData.description}
                                onChange={handleChange}
                                isInvalid={!!errors.description}
                            />
                            <Form.Control.Feedback type="invalid">{errors.description?.[0]}</Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Image</Form.Label>
                            <Form.Control type="file" name="image" onChange={handleChange} isInvalid={!!errors.image} />
                            <Form.Control.Feedback type="invalid">{errors.image?.[0]}</Form.Control.Feedback>

                            {(imagePreview ||
                                (isEdit && modalData.image && typeof modalData.image === "string")) && (
                                <img
                                    src={imagePreview || getImageUrl(modalData.image)}
                                    alt="preview"
                                    width="100"
                                    className="mt-2"
                                />
                            )}
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? "Processing..." : isEdit ? "Update" : "Create"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Detail Modal */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Category Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalData && (
                        <>
                            <p><strong>Branch:</strong> {modalData.branch?.name}</p>
                            <p><strong>Name:</strong> {modalData.name}</p>
                            <p><strong>Japanese Name:</strong> {modalData.japanese_name}</p>
                            <p><strong>Description:</strong> {modalData.description}</p>
                            <p>
                                <strong>Image:</strong>{" "}
                                {modalData.image && (
                                    <img
                                        src={getImageUrl(modalData.image)}
                                        alt=""
                                        width="100"
                                    />
                                )}
                            </p>
                            <p><strong>Created By:</strong> {modalData.creator?.name}</p>
                            <p><strong>Created At:</strong> {new Date(modalData.created_at).toLocaleString()}</p>
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

export default Category;
