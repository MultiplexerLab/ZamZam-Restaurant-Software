import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Api from "../../services/api";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const DEFAULT_IMAGE = BASE_URL + "/storage/branches/fNHLxMdBltb9GgL7kmZHzhym9dsPM2194SDCUAQi.jpg";

export default function Employee() {
    const [employees, setEmployees] = useState([]);
    const [branches, setBranches] = useState([]);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(5);
    const [totalPages, setTotalPages] = useState(0);
    const [sortField, setSortField] = useState("id");
    const [sortOrder, setSortOrder] = useState("desc");

    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(""); // create/edit/view
    const [modalData, setModalData] = useState({ date_of_birth: null, joining_date: null, old_image: null });
    const [imagePreview, setImagePreview] = useState(null);

    // Fetch employees
    const fetchEmployees = async () => {
        try {
            const res = await Api.get("/employee", {
                params: {
                    page: currentPage,
                    per_page: perPage,
                    search,
                    sort_field: sortField,
                    sort_order: sortOrder,
                },
            });
            setEmployees(res.data.data);
            setTotalPages(res.data.last_page);
        } catch (err) {
            console.error(err);
        }
    };

    // Fetch branches
    const fetchBranches = async () => {
        try {
            const res = await Api.get("/branch");
            setBranches(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => { fetchBranches(); }, []);
    useEffect(() => { fetchEmployees(); }, [currentPage, search, sortField, sortOrder]);

    const handleSort = (field) => {
        if (sortField === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        else { setSortField(field); setSortOrder("asc"); }
    };

    const handleShow = (type, employee = null) => {
        setModalType(type);
        if (employee) {
            setModalData({
                id: employee.id,
                email: employee.user.email,
                first_name: employee.first_name,
                first_name_japanese: employee.first_name_japanese,
                last_name: employee.last_name,
                last_name_japanese: employee.last_name_japanese,
                details: employee.details,
                details_japanese: employee.details_japanese,
                branch_id: employee.branch_id,
                image: null,
                old_image: employee.image,
                designation: employee.designation,
                designation_japanese: employee.designation_japanese,
                date_of_birth: employee.date_of_birth ? new Date(employee.date_of_birth) : null,
                joining_date: employee.joining_date ? new Date(employee.joining_date) : null,
            });
            setImagePreview(null);
        } else {
            setModalData({ date_of_birth: null, joining_date: null, old_image: null });
            setImagePreview(null);
        }
        setShowModal(true);
    };

    const handleClose = () => {
        setShowModal(false);
        setModalData({ date_of_birth: null, joining_date: null, old_image: null });
        setImagePreview(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setModalData({ ...modalData, [name]: value });
    };

    const handleDateChange = (name, date) => {
        setModalData({ ...modalData, [name]: date });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setModalData({ ...modalData, image: file });
        if (file) setImagePreview(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        const formData = new FormData();
        for (let key in modalData) {
            if (modalData[key] instanceof Date) {
                formData.append(key, modalData[key].toISOString().split("T")[0]);
            } else if (key === "image" && modalData[key]) {
                formData.append("image", modalData[key]);
            } else if (key !== "old_image") {
                formData.append(key, modalData[key] ?? "");
            }
        }

        try {
            if (modalType === "edit") {
                await Api.post(`/employee/${modalData.id}?_method=PUT`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } else {
                await Api.post(`/employee`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }
            fetchEmployees();
            handleClose();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure?")) {
            await Api.delete(`/employee/${id}`);
            fetchEmployees();
        }
    };

    const paginate = (page) => setCurrentPage(page);

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between mb-3">
                <input
                    type="text"
                    className="form-control w-25"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Button onClick={() => handleShow("create")}>Add Employee</Button>
            </div>

            <Table striped bordered hover responsive>
                <thead>
                <tr>
                    <th>Image</th>
                    <th onClick={() => handleSort("email")}>Email</th>
                    <th onClick={() => handleSort("first_name")}>First Name</th>
                    <th>First Name (JP)</th>
                    <th onClick={() => handleSort("last_name")}>Last Name</th>
                    <th>Last Name (JP)</th>
                    <th>Branch</th>
                    <th>Designation</th>
                    <th>DOB</th>
                    <th>Joining Date</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {employees.map((emp) => (
                    <tr key={emp.id}>
                        <td>
                            <img
                                src={emp.image ? `${BASE_URL}/storage/${emp.image}` : DEFAULT_IMAGE}
                                alt="employee"
                                width="50"
                                className="rounded border"
                            />
                        </td>
                        <td>{emp.user.email}</td>
                        <td>{emp.first_name}</td>
                        <td>{emp.first_name_japanese}</td>
                        <td>{emp.last_name}</td>
                        <td>{emp.last_name_japanese}</td>
                        <td>{emp.branch?.name}</td>
                        <td>{emp.designation}</td>
                        <td>{emp.date_of_birth ? new Date(emp.date_of_birth).toLocaleDateString() : ""}</td>
                        <td>{emp.joining_date ? new Date(emp.joining_date).toLocaleDateString() : ""}</td>
                        <td>
                            <Button size="sm" variant="info" onClick={() => handleShow("view", emp)}>View</Button>{" "}
                            <Button size="sm" variant="primary" onClick={() => handleShow("edit", emp)}>Edit</Button>{" "}
                            <Button size="sm" variant="danger" onClick={() => handleDelete(emp.id)}>Delete</Button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </Table>

            {/* Pagination */}
            <nav>
                <ul className="pagination">
                    {Array.from({ length: totalPages }, (_, i) => (
                        <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                            <button className="page-link" onClick={() => paginate(i + 1)}>{i + 1}</button>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Modal */}
            <Modal show={showModal} onHide={handleClose} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {modalType === "create"
                            ? "Add Employee"
                            : modalType === "edit"
                                ? "Edit Employee"
                                : "View Employee"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        {modalType === "create" && (
                            <>
                                <Form.Group className="mb-2">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control type="email" name="email" value={modalData.email || ""} onChange={handleChange} />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control type="password" name="password" value={modalData.password || ""} onChange={handleChange} />
                                </Form.Group>
                            </>
                        )}

                        {/* Names, Branch, Designation */}
                        <Form.Group className="mb-2">
                            <Form.Label>First Name</Form.Label>
                            <Form.Control type="text" name="first_name" value={modalData.first_name || ""} onChange={handleChange} readOnly={modalType==="view"} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>First Name (JP)</Form.Label>
                            <Form.Control type="text" name="first_name_japanese" value={modalData.first_name_japanese || ""} onChange={handleChange} readOnly={modalType==="view"} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Last Name</Form.Label>
                            <Form.Control type="text" name="last_name" value={modalData.last_name || ""} onChange={handleChange} readOnly={modalType==="view"} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Last Name (JP)</Form.Label>
                            <Form.Control type="text" name="last_name_japanese" value={modalData.last_name_japanese || ""} onChange={handleChange} readOnly={modalType==="view"} />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Branch</Form.Label>
                            <Form.Select name="branch_id" value={modalData.branch_id || ""} onChange={handleChange} disabled={modalType==="view"}>
                                <option value="">Select Branch</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Designation</Form.Label>
                            <Form.Control type="text" name="designation" value={modalData.designation || ""} onChange={handleChange} readOnly={modalType==="view"} />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Designation (JP)</Form.Label>
                            <Form.Control type="text" name="designation_japanese" value={modalData.designation_japanese || ""} onChange={handleChange} readOnly={modalType==="view"} />
                        </Form.Group>

                        {/* Dates */}
                        <Form.Group className="mb-2">
                            <Form.Label>Date of Birth</Form.Label>
                            <DatePicker selected={modalData.date_of_birth} onChange={(date)=>handleDateChange("date_of_birth", date)} className="form-control" dateFormat="yyyy-MM-dd" disabled={modalType==="view"} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Joining Date</Form.Label>
                            <DatePicker selected={modalData.joining_date} onChange={(date)=>handleDateChange("joining_date", date)} className="form-control" dateFormat="yyyy-MM-dd" disabled={modalType==="view"} />
                        </Form.Group>

                        {/* Details */}
                        <Form.Group className="mb-2">
                            <Form.Label>Details</Form.Label>
                            <Form.Control as="textarea" name="details" value={modalData.details || ""} onChange={handleChange} readOnly={modalType==="view"} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Details (JP)</Form.Label>
                            <Form.Control as="textarea" name="details_japanese" value={modalData.details_japanese || ""} onChange={handleChange} readOnly={modalType==="view"} />
                        </Form.Group>

                        {/* Image */}
                        <Form.Group className="mb-2">
                            <Form.Label>Image</Form.Label>
                            {modalType !== "view" && <Form.Control type="file" onChange={handleFileChange} />}
                            <img
                                src={imagePreview || (modalData.old_image ? `${BASE_URL}/storage/${modalData.old_image}` : DEFAULT_IMAGE)}
                                alt="employee"
                                className="img-fluid mt-2"
                                style={{ maxHeight: "150px" }}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>Close</Button>
                    {modalType !== "view" && <Button variant="primary" onClick={handleSave}>Save</Button>}
                </Modal.Footer>
            </Modal>
        </div>
    );
}
