// Simple in-memory token store (persists for the app session)
let _token = null;

export const setToken = (token) => { _token = token; };
export const getToken = () => _token;
export const clearToken = () => { _token = null; };

export const authHeader = () =>
    _token ? { Authorization: `Bearer ${_token}` } : {};
