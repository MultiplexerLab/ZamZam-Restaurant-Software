import React, { useState, useEffect, useRef } from "react";
import { Table, Button, Modal, Spinner } from "react-bootstrap";
import API from "../../services/api";
import { useNavigate } from "react-router-dom";

const CashierOrderDashboard = () => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedTableOrders, setSelectedTableOrders] = useState([]);
    const [prevTables, setPrevTables] = useState([]); // keep track of old table data
    const [notification, setNotification] = useState(null);

    const navigate = useNavigate();

    const printRefKitchen = useRef();
    const printRefCustomer = useRef();

    const SPICE_LEVELS = [
        { value: "mild", label: "1 マイルド (MILD)" },
        { value: "medium", label: "2 普通 (MEDIUM)" },
        { value: "hot", label: "3 中辛 (HOT)" },
        { value: "very_hot", label: "4 大辛 (VERY HOT)" },
        { value: "super_hot", label: "5 激辛 (SUPER HOT)" },
    ];

    const getSpiceLabel = (level) => {
        const spice = SPICE_LEVELS.find(s => s.value === level);
        return spice ? spice.label : "";
    };

    const checkForUpdates = (newTables) => {
    // Compare old tables with new tables
    newTables.forEach((table) => {
        const oldTable = prevTables.find(t => t.table_number === table.table_number);
        if (!oldTable) {
            // New table appeared
            setNotification(`New table order received: Table #${getTableLabel(table.table_number)}`);
        } else {
            // Compare order count or last_order_at
            if (table.order_count > oldTable.order_count || table.last_order_at !== oldTable.last_order_at) {
                setNotification(`Order update detected for Table #${getTableLabel(table.table_number)}`);
            }
        }
    });
    setPrevTables(newTables);
};

useEffect(() => {
    const interval = setInterval(async () => {
        try {
            const res = await API.get("/table-orders");
            const tablesData = res.data.data || [];
            checkForUpdates(tablesData);
            setTables(tablesData);
        } catch (err) {
            console.error("Failed to fetch table orders:", err);
        }
    }, 20000); // every 5 seconds, adjust as needed

    return () => clearInterval(interval); // cleanup on unmount
}, [prevTables]);

    // Fetch table-wise incomplete orders
    const fetchTableOrders = async () => {
        setLoading(true);
        try {
            const res = await API.get("/table-orders");
            setTables(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch table orders:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTableOrders();
    }, []);

    const handleTableDetails = (orders) => {
        setSelectedTableOrders(orders);
        setShowModal(true);
    };

    const renderSpice = (spice_level) => {
        if (!spice_level) return null;
        return <span style={{ color: "#ff4500", fontSize: "0.9rem" }}>🌶 ({spice_level})</span>;
    };

    const renderSpiceChili = (level) => {
        if (!level) return null;

        const chiliIcons = {
            mild: "🌶️",
            medium: "🌶️🌶️",
            hot: "🌶️🌶️🌶️",
            very_hot: "🌶️🌶️🌶️🌶️",
            super_hot: "🌶️🌶️🌶️🌶️🌶️",
        };

        return <span>{chiliIcons[level] || "🌶️"}</span>;
    };

    // Calculate total including set menu slots
    const calculateItemTotal = (item) => {
        let total = item.price * item.quantity;
        return total;
    };

    const getTableLabel = (tableNum) => {
        return tableNum == 20 ? "TakeOut" : tableNum;
    };

    const handlePrint = (ref) => {
        if (!ref.current) return;
        const printContents = ref.current.innerHTML;
        const newWindow = window.open("", "_blank");
        newWindow.document.write(`
      <html>
        <head><title>Print Token</title></head>
        <body>${printContents}</body>
      </html>
    `);
        newWindow.document.close();
        newWindow.print();
    };

    const handlePrintBarcode = (orders) => {
        console.log(orders);
        setSelectedTableOrders(orders);
        if (selectedTableOrders.length === 0) return;

        const tableNumber = selectedTableOrders[0].table_number;
        const printWindow = window.open("", "_blank", "height=800,width=600");

        const ordersHtml = selectedTableOrders?.map(order => `
        <div style="margin-bottom:20px;">
            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:14px;">
                <span>Order #${order.id}</span>
                <span>Status: ${order.status}</span>
            </div>
            <table style="width:100%; border-collapse: collapse; margin-top:5px; font-size:13px;">
                <thead>
                    <tr>
                        <th style="border-bottom:1px solid #000; text-align:left; padding:2px;">Item</th>
                        <th style="border-bottom:1px solid #000; text-align:left; padding:2px;">Sub-items</th>
                        <th style="border-bottom:1px solid #000; text-align:right; padding:2px;">Unit</th>
                        <th style="border-bottom:1px solid #000; text-align:right; padding:2px;">Qty</th>
                        <th style="border-bottom:1px solid #000; text-align:right; padding:2px;">Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map(item => `
                        <tr>
                            <td style="padding:2px;">${item.set_menu_id ? item.name : item.name}
                                ${!item.set_menu_id && item.spice_level ? `<span style="color:#ff4500; font-size:12px;"> (${getSpiceLabel(item.spice_level)})</span>` : ''}
                            </td>
                            <td style="padding:2px;">
                                ${item.meta?.slots?.length > 0 ? `<ul style="list-style:none; padding-left:0; margin:0;">
                                    ${item.meta.slots.map(s => `
                                        <li style="margin-bottom:2px;">
                                            ${s.food_name} 
                                            ${s.spice_level ? `<span style="color:#ff4500; font-size:12px;">  (${getSpiceLabel(s.spice_level)})</span>` : ''}
                                            ${s.additional_price > 0 ? ` (+¥${s.additional_price})` : ''}
                                        </li>`).join('')}
                                </ul>` : '-'}
                            </td>
                            <td style="text-align:right; padding:2px;">¥${Number(item.price).toFixed(0)}</td>
                            <td style="text-align:right; padding:2px;">${item.quantity}</td>
                            <td style="text-align:right; padding:2px;">¥${calculateItemTotal(item).toFixed(0)}</td>
                        </tr>`).join('')}
                </tbody>
            </table>
            <div style="text-align:right; font-weight:bold; margin-top:5px; font-size:14px;">
                Total: ¥${order.items.reduce((sum, item) => sum + calculateItemTotal(item), 0).toFixed(0)}
            </div>
        </div>
    `).join('');

        const cumulativeTotal = selectedTableOrders
            .reduce((total, order) => total + order.items.reduce((sum, item) => sum + calculateItemTotal(item), 0), 0);

        printWindow.document.write(`
        <html>
            <head><title>Table #${getTableLabel(tableNumber)} Orders</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px; line-height:1.4;">
                <h2 style="text-align:center; margin-bottom:10px;">Table #${getTableLabel(tableNumber)} Orders</h2>
                <div style="text-align:center; margin-bottom:20px;">
                    <svg id="barcode"></svg>
                </div>
                ${ordersHtml}
                <hr style="margin-top:10px; margin-bottom:10px;"/>
                <h3 style="text-align:right;">Cumulative Total: ¥${cumulativeTotal.toFixed(0)}</h3>
            </body>
        </html>
    `);

        printWindow.document.close();

        const script = printWindow.document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js";
        script.onload = () => {
            printWindow.JsBarcode(
                printWindow.document.getElementById("barcode"),
                `${tableNumber}`,
                { format: "CODE128", displayValue: true, width: 2, height: 50 }
            );
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        };
        printWindow.document.body.appendChild(script);
    };

    return (
        <div className="p-4">
            <h2>Order Management</h2>

            {notification && (
                <div className="alert alert-warning fixed-top text-center m-3" role="alert">
                {notification}
                <button 
                    type="button" 
                    className="btn-close float-end" 
                    aria-label="Close" 
                    onClick={() => setNotification(null)}
                />
                </div>
            )}

            {loading ? (
                <div className="text-center my-4"><Spinner animation="border" /></div>
            ) : tables.length === 0 ? (
                <p>No incomplete orders found.</p>
            ) : (
                <Table striped bordered hover responsive>
                    <thead>
                    <tr>
                        <th>Table</th>
                        <th>Number of Orders</th>
                        <th>Last Order</th>
                        <th>Total Cost</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {tables.map((table) => (
                        <tr key={table.table_number}>
                            <td>{getTableLabel(table.table_number)}</td>
                            <td>{table.order_count}</td>
                            <td>{new Date(table.last_order_at).toLocaleString()}</td>
                            <td>¥{table.total_cost}</td>
                            <td>
                                <div className="d-flex flex-wrap gap-2">
                                    <Button
                                    variant="info"
                                    size="sm"
                                    onClick={() => handleTableDetails(table.orders)}
                                    >
                                    Details
                                    </Button>

                                    {/* <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => navigate(`/cashier/order-detail`)}
                                    >
                                    Manage Order
                                    </Button> */}

                                    <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => handlePrintBarcode(table.orders)}
                                    >
                                    Generate Invoice
                                    </Button>

                                    <Button
                                    variant="warning"
                                    size="sm"
                                    onClick={() => navigate(`/cashier/payment`)}
                                    >
                                    Payment
                                    </Button>
                                </div>
                                </td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
            )}

            {/* Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Table #{getTableLabel(selectedTableOrders[0]?.table_number || "")} Orders
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedTableOrders.length === 0 ? (
                        <p>No orders available.</p>
                    ) : (
                        selectedTableOrders?.map((order) => (
                            <div key={order.id} className="mb-3 p-2 border rounded">
                                <div className="d-flex justify-content-between mb-2">
                                    <strong>Order #{order.id}</strong>
                                    <span>Status: {order.status}</span>
                                </div>

                                <Table striped bordered hover size="sm">
                                    <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Sub-items</th>
                                        <th>Unit Price</th>
                                        <th>Qty</th>
                                        <th>Price</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {order.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                {item.set_menu_id ? item.name : item.name}{" "}
                                                {!item.set_menu_id && item.spice_level && (  // Only show for single items
                                                    <span style={{color: "#ff4500", fontSize: "0.9rem"}}>
                                                        {renderSpiceChili(item.spice_level)} ({getSpiceLabel(item.spice_level)})
                                                     </span>
                                                )}
                                            </td>
                                            <td>
                                                {item.meta?.slots?.length > 0 ? (
                                                    <ul style={{listStyle: "none", padding: 0, margin: 0}}>
                                                        {item.meta.slots.map((s, i) => (
                                                            <li key={i}>
                                                                {s.food_name}
                                                                {renderSpice(s.spice_level)}

                                                                {s.spice_level && (  // Only show for single items
                                                                    <span style={{color: "#ff4500", fontSize: "0.9rem"}}>
                                                        {renderSpiceChili(s.spice_level)} ({getSpiceLabel(s.spice_level)})
                                                     </span>
                                                                )}

                                                                {s.additional_price > 0 && `(+¥${s.additional_price})`}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : "-"}
                                            </td>
                                            <td>¥{Number(item.price).toFixed(0)}</td>
                                            <td>{item.quantity}</td>
                                            <td>¥{calculateItemTotal(item).toFixed(0)}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>

                                <div className="text-end">
                                    <strong>
                                        Total: ¥{order.items.reduce((sum, item) => sum + calculateItemTotal(item), 0).toFixed(0)}
                                    </strong>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Cumulative total for all orders */}
                    <div className="mt-3 text-end">
                        <h5>
                            🧾 Cumulative Total: ¥
                            {selectedTableOrders
                                .reduce(
                                    (total, order) => total + order.items.reduce((sum, item) => sum + calculateItemTotal(item), 0),
                                    0
                                )
                                .toFixed(0)}
                        </h5>
                    </div>

                    {/* Hidden print sections */}
                    <div style={{ display: "none" }}>
                        <div ref={printRefKitchen}>
                            <h2>Kitchen Token</h2>
                            {selectedTableOrders?.map(order => (
                                <div key={order.id}>
                                    <p>Order #: {order.id}</p>
                                    <ul>
                                        {order.items.map(item => (
                                            <li key={item.id}>
                                                {item.set_menu_id ? item.name : item.name} x {item.quantity}
                                                {item.meta?.slots?.length > 0 && (
                                                    <ul>{item.meta.slots.map(s => <li key={s.slot_id}>{s.food_name}</li>)}</ul>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        <div ref={printRefCustomer}>
                            <h2>Customer Token</h2>
                            {selectedTableOrders?.map(order => (
                                <div key={order.id}>
                                    <p>Order #: {order.id} | Total: ¥{order.items.reduce((sum, item) => sum + calculateItemTotal(item), 0)}</p>
                                    <ul>
                                        {order.items.map(item => (
                                            <li key={item.id}>
                                                {item.set_menu_id ? item.name : item.name} x {item.quantity} (¥{item.price})
                                                {item.meta?.slots?.length > 0 && (
                                                    <ul>{item.meta.slots.map(s => <li key={s.slot_id}>{s.food_name}</li>)}</ul>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    {/*<Button variant="primary" onClick={() => handlePrint(printRefKitchen)}>Print Kitchen Token</Button>*/}
                    {/*<Button variant="secondary" onClick={() => handlePrint(printRefCustomer)}>Print Customer Token</Button>*/}
                    <Button 
    variant="success" 
    onClick={() => handlePrintBarcode(selectedTableOrders)}
>
    Print Barcode 1
</Button>                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default CashierOrderDashboard;
