const API_URL = "http://localhost:8080/api/clientes";

// Obtener todos los clientes
export async function getClientes() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error("Error al obtener los clientes");
        }
        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error("Error en getClientes:", error);
        throw error;
    }
}

// Obtener un cliente por su ID
export async function getClientePorId(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) {
            throw new Error("Error al obtener el cliente");
        }
        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error("Error en getClientePorId:", error);
        throw error;
    }
}

// Crear un nuevo cliente
export async function createCliente(cliente) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(cliente)
        });

        const result = await response.json();
        if (!response.ok || result.succes === false) {
            throw new Error(result.message || "Error al crear el cliente");
        }
        return result.data;
    } catch (error) {
        console.error("Error en createCliente:", error);
        throw error;
    }
}

// Actualizar un cliente existente
export async function updateCliente(id, cliente) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(cliente)
        });

        const result = await response.json();
        if (!response.ok || result.succes === false) {
            throw new Error(result.message || "Error al actualizar el cliente");
        }
        return result.data;
    } catch (error) {
        console.error("Error en updateCliente:", error);
        throw error;
    }
}

// Eliminar un cliente
export async function deleteCliente(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        const result = await response.json().catch(() => null);
        
        if (response.status === 409) {
            throw new Error(result?.message || "No se puede eliminar: el cliente tiene eventos asociados.");
        }

        if (!response.ok) {
            throw new Error(result?.message || "Error al eliminar el cliente.");
        }

        return true;
    } catch (error) {
        console.error("Error en deleteCliente:", error);
        throw error;
    }
}
