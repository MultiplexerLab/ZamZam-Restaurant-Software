// api/FoodApi.js
import API from "./api";

export const foodService = {
    getFoods: () => API.get(`/food`),
    getSetMenus: () => API.get(`/setmenu`),
    getCart: () => API.get(`/cart`, { withCredentials: true }),
    addToCart: (data) => API.post(`/cart/add`, data, { withCredentials: true }),
    updateCart: (id, data) => API.put(`/cart/${id}`, data, { withCredentials: true }),
    removeFromCart: (id) => API.delete(`/cart/${id}`, { withCredentials: true }),
    placeOrder: (token) =>
        API.post(
            `/order`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        ),
};