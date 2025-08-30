import { apiGet, apiPost, apiPut, apiDelete } from './apiClient'

export const getNotes = (token,q='', filter='') => apiGet(`/api/notes?q=${encodeURIComponent(q)}&filter=${encodeURIComponent(filter)}`, token)

export const createNote = (token,note) => apiPost('/api/notes', note, token)

export const getNote = (token,id) => apiGet(`/api/notes/${id}`, token)

export const updateNote = (token,id,patch) => apiPut(`/api/notes/${id}`, patch, token)

export const deleteNote = (token,id) => apiDelete(`/api/notes/${id}`, token)

export const createShare = (token,id) => apiPost(`/api/notes/${id}/share`, {}, token)

export const getPublicNote = (shareId) => apiGet(`/api/notes/public/${shareId}`)