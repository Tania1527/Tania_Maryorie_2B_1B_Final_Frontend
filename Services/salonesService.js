const API_URL = "http://localhost:8080/api/salones";

// Obtener todos los salones (para llenar el select de eventos y ver sus capacidades/precios)
export async function getSalones() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error("Error al obtener los salones");
        }
        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error("Error en getSalones:", error);
        throw error;
    }
}

// Obtener un salón por su ID
export async function getSalonPorId(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) {
            throw new Error("Error al obtener el salón");
        }
        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error("Error en getSalonPorId:", error);
        throw error;
    }
}
