import React, { useState, useEffect } from "react";
import { Form, Button, Table, Spinner, Alert } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import API from "../../services/api";

const PaymentHistory = () => {
    const location = useLocation();

    // Get table number from query params (?table=5)
    const queryParams = new URLSearchParams(location.search);
    const initialTableNumber = queryParams.get("table") || "";

    // Default date range — today
    const today = new Date().toISOString().split("T")[0];
    const [fromDate, setFromDate] = useState(today);
    const [toDate, setToDate] = useState(today);

    const [tableNumber, setTableNumber] = useState(initialTableNumber);

    const [loading, setLoading] = useState(false);
    const [payments, setPayments] = useState([]);
    const [error, setError] = useState(null);

    // Fetch payments
    const fetchPayments = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                from_date: fromDate,
                to_date: toDate,
            };
            if (tableNumber) {
                params.table_number = tableNumber;
            }
            const res = await API.get("/payment-history", { params });
            setPayments(res.data.payments || []);
        } catch (err) {
            console.error(err);
            setError("Failed to load payment history");
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch on mount (with today's date)
    useEffect(() => {
        fetchPayments();
        // eslint-disable-next-line
    }, [tableNumber]);

    const handleSubmit = (e) => {
        e.preventDefault();
        fetchPayments();
    };

    return (
        <div className="p-4">
            <h2>💰 Payment History</h2>
            {/* Filter Form */}
            <Form onSubmit={handleSubmit} className="mb-4">
                <div className="d-flex gap-3 flex-wrap align-items-end">
                    <Form.Group>
                        <Form.Label>Table Number</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Enter table number"
                            value={tableNumber}
                            onChange={(e) => setTableNumber(e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group>
                        <Form.Label>From Date</Form.Label>
                        <Form.Control
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group>
                        <Form.Label>To Date</Form.Label>
                        <Form.Control
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </Form.Group>

                            <Form.Group>
                       <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? <Spinner animation="border" size="sm" /> : "Filter"}
                        </Button>
                    </Form.Group>
                        
                </div>
            </Form>

            {error && <Alert variant="danger">{error}</Alert>}

            {/* Payments Table */}
            <Table striped bordered hover responsive size="sm">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Table</th>
                        <th>Total</th>
                        <th>Discount</th>
                        <th>Paid</th>
                        <th>Method</th>
                        <th>Card Number</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody>
                    {payments.length > 0 ? (
                        payments.map((p) => (
                            <tr key={p.id}>
                                <td>{p.id}</td>
                                <td>{p.table_number}</td>
                                <td>¥{p.total_amount.toFixed(0)}</td>
                                <td>¥{p.discount.toFixed(0)}</td>
                                <td>¥{p.paid_amount.toFixed(0)}</td>
                                <td>{p.payment_method}</td>
                                <td>{p.card_number || "-"}</td>
                                <td>{new Date(p.created_at).toLocaleString()}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="8" className="text-center">
                                {loading ? "Loading..." : "No payments found"}
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </div>
    );
};

export default PaymentHistory;
