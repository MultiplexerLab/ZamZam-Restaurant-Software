import { useState, useEffect, useCallback } from "react";
import { Modal, Button, Table, Form, Pagination } from "react-bootstrap";
import DatePicker from "react-datepicker";
import API from "../../services/api";
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const DEFAULT_IMAGE =
    BASE_URL + "/storage/branches/fNHLxMdBltb9GgL7kmZHzhym9dsPM2194SDCUAQi.jpg";


function Purchase() {
    const [purchases, setPurchases] = useState([]);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        date: new Date(),
        title: "",
        cost: "",
        description: "",
        images: [],
        old_images: [],
    });
    const [imagePreview, setImagePreview] = useState([]);
    const [isEdit, setIsEdit] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const fetchPurchases = useCallback(async (page = 1) => {
        try {
            const res = await API.get(`/purchase?search=${search}&page=${page}`);
            setPurchases(res.data.data);
            setCurrentPage(res.data.current_page);
            setTotalPages(res.data.last_page);
        } catch (err) {
            console.error(err);
        }
    }, [search]);

    useEffect(() => {
        fetchPurchases();
    }, [fetchPurchases]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "images") {
            const fileArray = Array.from(files);
            setModalData({ ...modalData, images: fileArray });

            const previews = fileArray.map((file) => URL.createObjectURL(file));
            setImagePreview(previews);
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
            formData.append("date", modalData.date.toISOString().split("T")[0]);
            formData.append("title", modalData.title);
            formData.append("cost", modalData.cost);
            formData.append("description", modalData.description);

            modalData.images?.forEach((img) => formData.append("images[]", img));
            modalData.old_images?.forEach((img) => formData.append("old_images[]", img));

            if (isEdit) {
                await API.post(`/purchase/${modalData.id}?_method=PUT`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } else {
                await API.post("/purchase", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }

            fetchPurchases(currentPage);
            setShowModal(false);
            setModalData({
                date: new Date(),
                title: "",
                cost: "",
                description: "",
                images: [],
                old_images: [],
            });
            setImagePreview([]);
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
            else alert(err.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this purchase?")) return;
        try {
            await API.delete(`/purchase/${id}`);
            fetchPurchases(currentPage);
        } catch (err) {
            console.error(err);
        }
    };

    const getImageUrl = (img) => `${BASE_URL}/storage/${img}`;

    return (
        <div className="container mt-4">
            {/* Search + Add */}
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
                        setModalData({
                            date: new Date(),
                            title: "",
                            cost: "",
                            description: "",
                            images: [],
                            old_images: [],
                        });
                        setImagePreview([]);
                        setIsEdit(false);
                        setShowModal(true);
                    }}
                >
                    Add Purchase
                </Button>
            </div>

            {/* Table */}
            <Table striped bordered hover>
                <thead>
                <tr>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Cost</th>
                    <th>Description</th>
                    <th>Images</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {purchases.map((p) => (
                    <tr key={p.id}>
                        <td>{new Date(p.date).toLocaleDateString("en-GB")}</td>
                        <td>{p.title}</td>
                        <td>{p.cost}</td>
                        <td>{p.description}</td>
                        <td>
                            {p.images && p.images.length > 0 && (
                                <img
                                    src={getImageUrl(p.images[0])}
                                    alt=""
                                    width="50"
                                    className="rounded border"
                                />
                            )}
                        </td>
                        <td>
                            <Button
                                variant="info"
                                size="sm"
                                className="me-2"
                                onClick={() => {
                                    setModalData({
                                        ...p,
                                        old_images: p.images || [],
                                        images: [],
                                        date: new Date(p.date),
                                    });
                                    setShowDetailModal(true);
                                }}
                            >
                                Details
                            </Button>
                            <Button
                                variant="warning"
                                size="sm"
                                className="me-2"
                                onClick={() => {
                                    setModalData({
                                        ...p,
                                        old_images: p.images || [],
                                        images: [],
                                        date: new Date(p.date),
                                    });
                                    setImagePreview([]);
                                    setIsEdit(true);
                                    setShowModal(true);
                                }}
                            >
                                Edit
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleDelete(p.id)}>
                                Delete
                            </Button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </Table>

            {/* Pagination */}
            <Pagination>
                {Array.from({ length: totalPages }, (_, i) => (
                    <Pagination.Item
                        key={i + 1}
                        active={i + 1 === currentPage}
                        onClick={() => fetchPurchases(i + 1)}
                    >
                        {i + 1}
                    </Pagination.Item>
                ))}
            </Pagination>

            {/* Add/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{isEdit ? "Edit Purchase" : "Add Purchase"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Date</Form.Label>
                            <br />
                            <DatePicker
                                selected={modalData.date}
                                onChange={(date) => setModalData({ ...modalData, date })}
                                dateFormat="yyyy-MM-dd"
                                className="form-control"
                            />
                            {errors.date && <div className="text-danger">{errors.date[0]}</div>}
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Title</Form.Label>
                            <Form.Control name="title" value={modalData.title} onChange={handleChange} />
                            {errors.title && <div className="text-danger">{errors.title[0]}</div>}
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Cost</Form.Label>
                            <Form.Control
                                type="number"
                                step="0.01"
                                name="cost"
                                value={modalData.cost}
                                onChange={handleChange}
                            />
                            {errors.cost && <div className="text-danger">{errors.cost[0]}</div>}
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                name="description"
                                value={modalData.description}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Images</Form.Label>
                            <Form.Control type="file" name="images" onChange={handleChange} multiple />

                            {/* Preview new uploads */}
                            {imagePreview.length > 0 && (
                                <div className="mt-2 d-flex flex-wrap">
                                    {imagePreview.map((src, idx) => (
                                        <div key={idx} className="position-relative me-2 mb-2">
                                            <img src={src} width="80" className="rounded border" />
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                className="position-absolute top-0 end-0 p-1"
                                                onClick={() => {
                                                    setModalData(prev => ({
                                                        ...prev,
                                                        images: prev.images.filter((_, i) => i !== idx)
                                                    }));
                                                    setImagePreview(prev => prev.filter((_, i) => i !== idx));
                                                }}
                                            >×</Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Existing old images */}
                            {isEdit && modalData.old_images?.length > 0 && (
                                <div className="mt-2 d-flex flex-wrap">
                                    {modalData.old_images.map((img, idx) => (
                                        <div key={idx} className="position-relative me-2 mb-2">
                                            <img src={getImageUrl(img)} width="80" className="rounded border" />
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                className="position-absolute top-0 end-0 p-1"
                                                onClick={() => {
                                                    setModalData(prev => ({
                                                        ...prev,
                                                        old_images: prev.old_images.filter((_, i) => i !== idx)
                                                    }));
                                                }}
                                            >×</Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Form.Group>

                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save"}
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Details Modal */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Purchase Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalData && (
                        <>
                            <p><strong>Date:</strong> {new Date(modalData.date).toLocaleDateString("en-GB")}</p>
                            <p><strong>Title:</strong> {modalData.title}</p>
                            <p><strong>Cost:</strong> {modalData.cost}</p>
                            <p><strong>Description:</strong> {modalData.description}</p>

                            <div className="d-flex flex-wrap mb-2">
                                {modalData.old_images?.map((img, i) => (
                                    <img
                                        key={i}
                                        src={getImageUrl(img)}
                                        alt=""
                                        className="me-2 mb-2 rounded border"
                                        style={{ maxWidth: "200px" }}
                                    />
                                ))}
                            </div>

                            <p><strong>Created By:</strong> {modalData.creator?.name}</p>
                            <p><strong>Created At:</strong> {new Date(modalData.created_at).toLocaleString()}</p>
                        </>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default Purchase;
