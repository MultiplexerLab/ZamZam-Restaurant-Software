import React, { useEffect, useRef, useState } from "react";
import {
    Card,
    Table,
    Spinner,
    Alert,
    Row,
    Col,
    Badge,
    Button,
} from "react-bootstrap";
import API from "../../services/api";
import TodaysOrdersGrid from "./TodaysOrdersGrid";

const PendingOrdersGrid = () => {
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [ordersError, setOrdersError] = useState("");
    const [soundEnabled, setSoundEnabled] = useState(false);
    const notificationSound = useRef(null);
    const lastDataRef = useRef([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // 🧩 Spice Levels
    const SPICE_LEVELS = [
        { value: "mild", label: "1 マイルド (MILD)" },
        { value: "medium", label: "2 普通 (MEDIUM)" },
        { value: "hot", label: "3 中辛 (HOT)" },
        { value: "very_hot", label: "4 大辛 (VERY HOT)" },
        { value: "super_hot", label: "5 激辛 (SUPER HOT)" },
    ];

    const getSpiceLabel = (level) =>
        SPICE_LEVELS.find((s) => s.value === level)?.label || "";
    const renderSpiceChili = (level) => {
        const icons = {
            mild: "🌶️",
            medium: "🌶️🌶️",
            hot: "🌶️🌶️🌶️",
            very_hot: "🌶️🌶️🌶️🌶️",
            super_hot: "🌶️🌶️🌶️🌶️🌶️",
        };
        return icons[level] || "";
    };

    const getTableLabel = (tableNum) => {
        return tableNum === 20 ? "TakeOut Order" : tableNum;
    };

    // 🕹 Enable Sound Interaction
    const enableSound = () => {
        setSoundEnabled(true);
        if (notificationSound.current) {
            notificationSound.current.loop = true;
            notificationSound.current
                .play()
                .then(() => {
                    notificationSound.current.pause();
                    notificationSound.current.currentTime = 0;
                    console.log("✅ Sound ready");
                })
                .catch(() =>
                    console.warn("⚠️ Autoplay blocked until interaction")
                );
        }
    };

    // 🔔 Initialize sound
    useEffect(() => {
        notificationSound.current = new Audio("/sound/alert.wav");
        notificationSound.current.loop = true;
    }, []);

    // 🧭 Fetch pending orders
    const fetchOrders = async () => {
        try {
            const res = await API.get("/orders?status=pending");
            const newData = res.data.data || [];

            setOrders(newData);
            lastDataRef.current = newData;

            // 🔊 Play sound continuously if pending orders exist
            if (soundEnabled && notificationSound.current) {
                if (newData.length > 0) {
                    notificationSound.current.play().catch(() => {
                        console.warn("⚠️ Autoplay blocked until interaction.");
                    });
                } else {
                    notificationSound.current.pause();
                    notificationSound.current.currentTime = 0;
                }
            }
        } catch (err) {
            console.error(err);
            setOrdersError("⚠️ Failed to fetch pending orders.");
        } finally {
            setLoadingOrders(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, [soundEnabled]);

    // 🧾 Update order status
    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            if (notificationSound.current) {
                notificationSound.current.pause();
                notificationSound.current.currentTime = 0;
            }

            await API.put(`/orders/${orderId}/status`, { status: newStatus });
            setOrders((prev) => prev.filter((o) => o.id !== orderId));

            // 🌀 Notify today's grid to refresh
            setRefreshTrigger((prev) => prev + 1);
        } catch (err) {
            console.error("❌ Failed to update order:", err);
        }
    };


    // 🖨 Thermal Print Handler (88 mm optimized)
    const handlePrint = (order) => {
        if (notificationSound.current) {
            notificationSound.current.pause();
            notificationSound.current.currentTime = 0;
        }

        const total = order.items.reduce(
            (sum, i) => sum + i.price * i.quantity,
            0
        );

        // Build receipt content
        const receiptItems = order.items
            .map((item) => {
                const subItems = item.meta?.slots?.length
                    ? item.meta.slots
                        .map(
                            (s) =>
                                `   • ${s.food_name}${
                                    s.spice_level
                                        ? ` ${renderSpiceChili(s.spice_level)}`
                                        : ""
                                }${
                                    s.additional_price > 0 ? ` +¥${s.additional_price}` : ""
                                }`
                        )
                        .join("\n")
                    : "";
                return `${item.title}${
                    item.spice_level ? ` ${renderSpiceChili(item.spice_level)}` : ""
                }\n${subItems ? subItems + "\n" : ""}   x${item.quantity}   ¥${(
                    item.price * item.quantity
                ).toFixed(0)}`;
            })
            .join("\n----------------------------------------\n");

        const printContent = `
      <html>
        <head>
          <title>Order #${order.id}</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
        </head>
        <body style="
          font-family: monospace;
          font-size: 15px;
          width: 350px;
          margin: 0;
          padding: 12px;
          line-height: 1.4;
        ">
          <div style="text-align:center;">
            <h3 style="margin:0;">🍛 KITCHEN ORDER</h3>
            <div>Order #${order.id}</div>
            <div>${getTableLabel(order.table_number)}</div>
            <div>${new Date(order.created_at).toLocaleTimeString()}</div>
            <svg id="barcode"></svg>
          </div>

          <hr style="border:0; border-top:1px dashed #000; margin:6px 0;"/>

          <pre style="white-space: pre-wrap; word-wrap: break-word; margin:0;">
${receiptItems}
          </pre>

          <hr style="border:0; border-top:1px dashed #000; margin:6px 0;"/>

          <div style="text-align:right; font-weight:bold; font-size:16px;">
            TOTAL: ¥${total.toFixed(0)}
          </div>

          <hr style="border:0; border-top:1px dashed #000; margin:6px 0;"/>

          <div style="text-align:center; margin-top:8px;">
            Thank you 🙏
          </div>

          <script>
            window.onload = function() {
              JsBarcode("#barcode", "${order.table_number}", {
                format: "CODE128",
                width: 1.5,
                height: 50,
                displayValue: false,
                margin: 0
              });
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;

        const printWindow = window.open("", "", "width=400,height=800");
        if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.onafterprint = () => {
                updateOrderStatus(order.id, "preparing");
                setRefreshTrigger((prev) => prev + 1); // 🌀 Refresh today orders
            };
        }
    };

    // 🧭 UI States
    if (loadingOrders)
        return (
            <div className="text-center">
                <Spinner animation="border" /> Loading orders...
            </div>
        );
    if (ordersError) return <Alert variant="danger">{ordersError}</Alert>;
    // if (orders.length === 0)
    //     return <Alert variant="info">No pending orders found.</Alert>;

    // 🧱 Layout
    return (
        <>
            {!soundEnabled && (
                <div className="text-center mb-3">
                    <Button variant="success" size="sm" onClick={enableSound}>
                        🔔 Enable Sound Alerts
                    </Button>
                </div>
            )}

            { orders.length > 0 && <Row className="g-3">
                {orders.map((order) => (
                    <Col md={6} lg={4} key={order.id}>
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex justify-content-between mb-2 align-items-center">
                                    <strong>Order #{order.id}</strong>
                                    <Badge bg="warning" text="dark">
                                        {order.status}
                                    </Badge>
                                </div>

                                <div className="mb-2 text-muted">
                                    🕒{" "}
                                    {new Date(order.created_at).toLocaleTimeString()} — Table{" "}
                                    <strong>{getTableLabel(order.table_number)}</strong>
                                </div>

                                <Table striped bordered hover size="sm">
                                    <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Sub-items</th>
                                        <th>Qty</th>
                                        <th>Price</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {order.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                {item.title}{" "}
                                                {item.spice_level && (
                                                    <span
                                                        style={{
                                                            color: "#ff4500",
                                                            fontSize: "0.85rem",
                                                        }}
                                                    >
                              {renderSpiceChili(item.spice_level)} (
                                                        {getSpiceLabel(item.spice_level)})
                            </span>
                                                )}
                                            </td>
                                            <td>
                                                {item.meta?.slots?.length > 0 ? (
                                                    <ul
                                                        className="mb-0 p-0"
                                                        style={{ listStyle: "none" }}
                                                    >
                                                        {item.meta.slots.map((s, i) => (
                                                            <li key={i}>
                                                                {s.food_name}{" "}
                                                                {s.spice_level && (
                                                                    <span
                                                                        style={{
                                                                            color: "#ff4500",
                                                                            fontSize: "0.8rem",
                                                                        }}
                                                                    >
                                      {renderSpiceChili(s.spice_level)} (
                                                                        {getSpiceLabel(s.spice_level)})
                                    </span>
                                                                )}{" "}
                                                                {s.additional_price > 0 &&
                                                                    `( +¥${s.additional_price})`}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
                                            <td>{item.quantity}</td>
                                            <td>
                                                ¥{(item.price * item.quantity).toFixed(0)}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>

                                <div className="text-end mt-2 mb-2">
                                    <strong>
                                        Total: ¥
                                        {order.items
                                            .reduce(
                                                (sum, item) => sum + item.price * item.quantity,
                                                0
                                            )
                                            .toFixed(0)}
                                    </strong>
                                </div>

                                <div className="text-end d-flex justify-content-end gap-3 mt-3">
                                    <Button
                                        variant="success"
                                        className="fw-bold fs-5 px-5 py-3"
                                        onClick={() =>
                                            updateOrderStatus(order.id, "preparing")
                                        }
                                    >
                                        🍳 Prepare
                                    </Button>

                                    <Button
                                        variant="primary"
                                        className="fw-bold fs-5 px-5 py-3"
                                        onClick={() => handlePrint(order)}
                                    >
                                        🖨 Print
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>}

            <TodaysOrdersGrid
                renderSpiceChili={renderSpiceChili}
                getSpiceLabel={getSpiceLabel}
                refreshTrigger={refreshTrigger}
            />
        </>
    );
};

export default PendingOrdersGrid;
