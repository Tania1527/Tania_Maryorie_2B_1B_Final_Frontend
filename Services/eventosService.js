const API_URL = "http://localhost:8080/api/eventos";

// Obtener todos los eventos para el historial
export async function getEventos() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error("Error al obtener los eventos");
        }
        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error("Error en getEventos:", error);
        throw error;
    }
}

// Obtener un evento por su ID
export async function getEventoPorId(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) {
            throw new Error("Error al obtener el evento");
        }
        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error("Error en getEventoPorId:", error);
        throw error;
    }
}

// Crear un nuevo evento
export async function createEvento(evento) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(evento)
        });

        const result = await response.json();
        if (!response.ok || result.succes === false) {
            throw new Error(result.message || "Error al registrar el evento");
        }
        return result.data;
    } catch (error) {
        console.error("Error en createEvento:", error);
        throw error;
    }
}

// Actualizar un evento existente (por ejemplo cambiar estado)
export async function updateEvento(id, evento) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(evento)
        });

        const result = await response.json();
        if (!response.ok || result.succes === false) {
            throw new Error(result.message || "Error al actualizar el evento");
        }
        return result.data;
    } catch (error) {
        console.error("Error en updateEvento:", error);
        throw error;
    }
}

// Eliminar un evento
export async function deleteEvento(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        const result = await response.json().catch(() => null);
        if (!response.ok) {
            throw new Error(result?.message || "Error al eliminar el evento");
        }

        return true;
    } catch (error) {
        console.error("Error en deleteEvento:", error);
        throw error;
    }
}
