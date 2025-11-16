import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Logout() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        logout();            // 🔐 clear session
        navigate("");  // 🔄 redirect to login page
    }, [logout, navigate]);

    return null; // no UI needed
}
