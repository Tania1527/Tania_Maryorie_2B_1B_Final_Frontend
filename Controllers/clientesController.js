import {
    getClientes,
    getClientePorId,
    createCliente,
    updateCliente,
    deleteCliente
} from "../Services/clienteService.js";

// Elementos del DOM
const tablaBody = document.querySelector("#tablaClientesBody");
const emptyState = document.querySelector("#emptyState");
const alertContainer = document.querySelector("#alertContainer");
const formCliente = document.querySelector("#formCliente");
const btnNuevoCliente = document.querySelector("#btnNuevoCliente");
const modalElement = document.querySelector("#modalCliente");
const modalTitle = document.querySelector("#modalClienteLabel");
const btnGuardar = document.querySelector("#btnGuardarCliente");
const spinnerGuardar = document.querySelector("#spinnerGuardar");

// Instancia de Modal de Bootstrap
let bsModal = null;

// Inicialización
document.addEventListener("DOMContentLoaded", async () => {
    if (typeof bootstrap !== "undefined" && modalElement) {
        bsModal = new bootstrap.Modal(modalElement);
    }
    setupEvents();
    await cargarClientes();
});

function setupEvents() {
    btnNuevoCliente?.addEventListener("click", () => abrirModalCrear());
    formCliente?.addEventListener("submit", guardarCliente);
    tablaBody?.addEventListener("click", manejarAccionesTabla);
}

// Cargar listado de clientes
async function cargarClientes() {
    try {
        tablaBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                    <div class="spinner-border spinner-border-sm text-primary" role="status"></div> Cargando clientes...
                </td>
            </tr>
        `;
        const clientes = await getClientes();
        renderTabla(clientes || []);
    } catch (error) {
        mostrarAlerta(error.message || "Error al conectar con el servidor", "danger");
        tablaBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle"></i> Error al cargar los clientes.
                </td>
            </tr>
        `;
    }
}

// Renderizar filas de la tabla
function renderTabla(clientes) {
    if (!clientes || clientes.length === 0) {
        tablaBody.innerHTML = "";
        emptyState.classList.remove("d-none");
        return;
    }

    emptyState.classList.add("d-none");
    tablaBody.innerHTML = clientes.map(cliente => `
        <tr>
            <td class="fw-bold">#${cliente.id_cliente}</td>
            <td>${cliente.nombre} ${cliente.apellido}</td>
            <td><i class="bi bi-telephone text-muted me-1"></i>${cliente.telefono}</td>
            <td><i class="bi bi-envelope text-muted me-1"></i>${cliente.email}</td>
            <td>${cliente.direccion || '<span class="text-muted fst-italic">No especificada</span>'}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-1" data-action="edit" data-id="${cliente.id_cliente}">
                    <i class="bi bi-pencil-square"></i> Editar
                </button>
                <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${cliente.id_cliente}" data-name="${cliente.nombre} ${cliente.apellido}">
                    <i class="bi bi-trash"></i> Eliminar
                </button>
            </td>
        </tr>
    `).join("");
}

// Abrir modal para crear
function abrirModalCrear() {
    formCliente.reset();
    formCliente.classList.remove("was-validated");
    formCliente.clienteId.value = "";
    modalTitle.textContent = "Registrar Nuevo Cliente";
    btnGuardar.textContent = "Guardar Cliente";
    bsModal?.show();
}

// Abrir modal para editar
async function abrirModalEditar(id) {
    formCliente.reset();
    formCliente.classList.remove("was-validated");
    try {
        const cliente = await getClientePorId(id);
        formCliente.clienteId.value = cliente.id_cliente;
        formCliente.nombre.value = cliente.nombre;
        formCliente.apellido.value = cliente.apellido;
        formCliente.telefono.value = cliente.telefono;
        formCliente.email.value = cliente.email;
        formCliente.direccion.value = cliente.direccion || "";

        modalTitle.textContent = "Editar Cliente";
        btnGuardar.textContent = "Guardar Cambios";
        bsModal?.show();
    } catch (error) {
        mostrarAlerta("No se pudo cargar la información del cliente.", "danger");
    }
}

// Guardar cliente (Crear o Actualizar)
async function guardarCliente(event) {
    event.preventDefault();

    if (!formCliente.checkValidity()) {
        formCliente.classList.add("was-validated");
        return;
    }

    const id = formCliente.clienteId.value;
    const datosCliente = {
        nombre: formCliente.nombre.value.trim(),
        apellido: formCliente.apellido.value.trim(),
        telefono: formCliente.telefono.value.trim(),
        email: formCliente.email.value.trim(),
        direccion: formCliente.direccion.value.trim()
    };

    setLoading(true);

    try {
        if (id) {
            await updateCliente(id, datosCliente);
            mostrarAlerta("Cliente actualizado correctamente.", "success");
        } else {
            await createCliente(datosCliente);
            mostrarAlerta("Cliente registrado con éxito.", "success");
        }
        bsModal?.hide();
        await cargarClientes();
    } catch (error) {
        mostrarAlerta(error.message, "danger");
    } finally {
        setLoading(false);
    }
}

// Manejar botones de acciones en la tabla
async function manejarAccionesTabla(event) {
    const boton = event.target.closest("button[data-action]");
    if (!boton) return;

    const action = boton.dataset.action;
    const id = boton.dataset.id;
    const nombre = boton.dataset.name;

    if (action === "edit") {
        await abrirModalEditar(id);
    } else if (action === "delete") {
        if (confirm(`¿Estás seguro de que deseas eliminar a "${nombre}"? Esta acción no se puede deshacer.`)) {
            try {
                await deleteCliente(id);
                mostrarAlerta("Cliente eliminado con éxito.", "success");
                await cargarClientes();
            } catch (error) {
                mostrarAlerta(error.message, "danger");
            }
        }
    }
}

// Control del estado de carga del botón
function setLoading(loading) {
    if (loading) {
        btnGuardar.disabled = true;
        spinnerGuardar?.classList.remove("d-none");
    } else {
        btnGuardar.disabled = false;
        spinnerGuardar?.classList.add("d-none");
    }
}

// Mostrar alertas de Bootstrap
function mostrarAlerta(mensaje, tipo = "info") {
    alertContainer.innerHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            ${tipo === "success" ? '<i class="bi bi-check-circle-fill me-2"></i>' : '<i class="bi bi-exclamation-octagon-fill me-2"></i>'}
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
        </div>
    `;

    setTimeout(() => {
        const alertElement = alertContainer.querySelector(".alert");
        if (alertElement) {
            alertElement.classList.remove("show");
            setTimeout(() => alertElement.remove(), 150);
        }
    }, 5000);
}
