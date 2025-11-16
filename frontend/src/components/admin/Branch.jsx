import { useState, useEffect, useCallback } from "react";
import API from "../../services/api";
import { Modal, Button, Table, Form, Pagination } from "react-bootstrap";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const DEFAULT_IMAGE =
    BASE_URL + "/storage/branches/fNHLxMdBltb9GgL7kmZHzhym9dsPM2194SDCUAQi.jpg";

function Branch() {
    const [branches, setBranches] = useState([]);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        name: "",
        japanese_name: "",
        location: "",
        image: null,
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [isEdit, setIsEdit] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const fetchBranches = useCallback(
        async (page = 1) => {
            try {
                const res = await API.get(`/branch?search=${search}&page=${page}`);
                setBranches(res.data.data);
                setCurrentPage(res.data.current_page);
                setTotalPages(res.data.last_page);
            } catch (err) {
                console.error(err);
            }
        },
        [search]
    );

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        try {
            const formData = new FormData();
            formData.append("name", modalData.name);
            formData.append("japanese_name", modalData.japanese_name);
            formData.append("location", modalData.location);
            if (modalData.image) formData.append("image", modalData.image);

            if (isEdit) {
                await API.post(`/branch/${modalData.id}?_method=PUT`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } else {
                await API.post("/branch", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }

            fetchBranches(currentPage);
            setShowModal(false);
            setModalData({ name: "", japanese_name: "", location: "", image: null });
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

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this branch?")) return;

        try {
            await API.delete(`/branch/${id}`);
            fetchBranches(currentPage);
        } catch (err) {
            console.error(err);
            alert("Failed to delete branch");
        }
    };

    const getImageUrl = (imgPath) => {
        if (!imgPath) return DEFAULT_IMAGE;
        return `${BASE_URL}/storage/${imgPath}`;
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
                        setModalData({ name: "", japanese_name: "", location: "", image: null });
                        setImagePreview(null);
                        setIsEdit(false);
                        setErrors({});
                        setShowModal(true);
                    }}
                >
                    Add Branch
                </Button>
            </div>

            <Table striped bordered hover responsive>
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Japanese Name</th>
                    <th>Location</th>
                    <th>Image</th>
                    <th>Created By</th>
                    <th>Created At</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {branches.map((b) => (
                    <tr key={b.id}>
                        <td>{b.name}</td>
                        <td>{b.japanese_name}</td>
                        <td>{b.location}</td>
                        <td>
                            <img
                                src={getImageUrl(b.image)}
                                alt={b.name}
                                width="50"
                                onError={(e) => (e.target.src = DEFAULT_IMAGE)}
                            />
                        </td>
                        <td>{b.creator?.name}</td>
                        <td>{new Date(b.created_at).toLocaleString()}</td>
                        <td>
                            <Button
                                size="sm"
                                variant="info"
                                className="me-1"
                                onClick={() => {
                                    setModalData(b);
                                    setIsEdit(true);
                                    setErrors({});
                                    setShowModal(true);
                                    setImagePreview(getImageUrl(b.image));
                                }}
                            >
                                Edit
                            </Button>
                            <Button
                                size="sm"
                                variant="danger"
                                className="me-1"
                                onClick={() => handleDelete(b.id)}
                            >
                                Delete
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                    setModalData(b);
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

            <Pagination>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Pagination.Item
                        key={page}
                        active={page === currentPage}
                        onClick={() => fetchBranches(page)}
                    >
                        {page}
                    </Pagination.Item>
                ))}
            </Pagination>

            {/* Create / Update Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Form onSubmit={handleSubmit} encType="multipart/form-data">
                    <Modal.Header closeButton>
                        <Modal.Title>{isEdit ? "Update Branch" : "Add Branch"}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={modalData.name}
                                onChange={handleChange}
                                isInvalid={!!errors.name}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.name?.[0]}
                            </Form.Control.Feedback>
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
                            <Form.Control.Feedback type="invalid">
                                {errors.japanese_name?.[0]}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Location</Form.Label>
                            <Form.Control
                                type="text"
                                name="location"
                                value={modalData.location}
                                onChange={handleChange}
                                isInvalid={!!errors.location}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.location?.[0]}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Image</Form.Label>
                            <Form.Control
                                type="file"
                                name="image"
                                onChange={handleChange}
                                isInvalid={!!errors.image}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.image?.[0]}
                            </Form.Control.Feedback>

                            {(imagePreview ||
                                (isEdit && modalData.image && typeof modalData.image === "string")) && (
                                <img
                                    src={imagePreview || getImageUrl(modalData.image)}
                                    alt="preview"
                                    width="100"
                                    className="mt-2"
                                    onError={(e) => (e.target.src = DEFAULT_IMAGE)}
                                />
                            )}
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Close
                        </Button>
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? "Processing..." : isEdit ? "Update" : "Create"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Detail Modal */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Branch Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalData && (
                        <>
                            <p>
                                <strong>Name:</strong> {modalData.name}
                            </p>
                            <p>
                                <strong>Japanese Name:</strong> {modalData.japanese_name}
                            </p>
                            <p>
                                <strong>Location:</strong> {modalData.location}
                            </p>
                            <p>
                                <strong>Image:</strong>{" "}
                                {modalData.image && (
                                    <img
                                        src={getImageUrl(modalData.image)}
                                        alt={modalData.name}
                                        width="100"
                                        onError={(e) => (e.target.src = DEFAULT_IMAGE)}
                                    />
                                )}
                            </p>
                            <p>
                                <strong>Created By:</strong> {modalData.creator?.name}
                            </p>
                            <p>
                                <strong>Created At:</strong>{" "}
                                {new Date(modalData.created_at).toLocaleString()}
                            </p>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default Branch;
