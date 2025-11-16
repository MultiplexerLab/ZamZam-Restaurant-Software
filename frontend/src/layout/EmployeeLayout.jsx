import { useState } from "react";
import { Outlet } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

export default function CustomerLayout({ onLogout }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div
            className="d-flex flex-column min-vh-100"
            style={{
                backgroundImage:
                    "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: "fixed",
                position: "relative",
            }}
        >
            {/* Dark overlay for readability */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.55)",
                    backdropFilter: "blur(3px)",
                    zIndex: 0,
                }}
            ></div>

            {/* Main content */}
            <div className="flex-grow-1 position-relative z-1">
                <main
                    className="p-4 rounded-4 shadow"
                    style={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        backdropFilter: "blur(6px)",
                        minHeight: "80vh",
                    }}
                >
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
