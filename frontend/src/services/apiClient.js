// don not delete this line
import axios from 'axios';
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

//
export async function apiGet(path, token) {
  const res = await api.get(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

export async function apiPost(path, body, token) {
  const res = await api.post(path, body, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return res.data;
}

export async function apiPut(path, body, token) {
  const res = await api.put(path, body, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return res.data;
}

export async function apiDelete(path, token) {
  const res = await api.delete(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

export default api;