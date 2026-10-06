import {
    getEventos,
    getEventoPorId,
    createEvento,
    updateEvento,
    deleteEvento
} from "../Services/eventosService.js";
import { getClientes } from "../Services/clienteService.js";
import { getSalones } from "../Services/salonesService.js";

// Elementos del DOM
const tablaBody = document.querySelector("#tablaEventosBody");
const emptyState = document.querySelector("#emptyState");
const alertContainer = document.querySelector("#alertContainer");
const formEvento = document.querySelector("#formEvento");
const btnNuevoEvento = document.querySelector("#btnNuevoEvento");
const modalElement = document.querySelector("#modalEvento");
const modalTitle = document.querySelector("#modalEventoLabel");
const btnGuardar = document.querySelector("#btnGuardarEvento");
const spinnerGuardar = document.querySelector("#spinnerGuardar");

const selectCliente = document.querySelector("#id_cliente");
const selectSalon = document.querySelector("#id_salon");
const inputHoras = document.querySelector("#cantidad_horas");
const inputPersonas = document.querySelector("#cantidad_personas");
const previewTotal = document.querySelector("#previewTotal");
const alertaCapacidad = document.querySelector("#alertaCapacidad");
const textoAlertaCapacidad = document.querySelector("#textoAlertaCapacidad");

// Modal de Cambio de Estado
const modalEstadoElement = document.querySelector("#modalCambiarEstado");
const inputCambioEstadoId = document.querySelector("#cambioEstadoEventoId");
const nombreEventoEstado = document.querySelector("#nombreEventoEstado");

// Instancias de Modales Bootstrap
let bsModal = null;
let bsModalEstado = null;

// Caché de salones y clientes en memoria para cálculos rápidos
let listaSalones = [];
let listaClientes = [];

document.addEventListener("DOMContentLoaded", async () => {
    if (typeof bootstrap !== "undefined") {
        if (modalElement) bsModal = new bootstrap.Modal(modalElement);
        if (modalEstadoElement) bsModalEstado = new bootstrap.Modal(modalEstadoElement);
    }
    setupEvents();
    await cargarDatosIniciales();
});

function setupEvents() {
    btnNuevoEvento?.addEventListener("click", () => abrirModalCrear());
    formEvento?.addEventListener("submit", guardarEvento);
    tablaBody?.addEventListener("click", manejarAccionesTabla);

    // Cálculos en tiempo real
    selectSalon?.addEventListener("change", recalcularPreview);
    inputHoras?.addEventListener("input", recalcularPreview);
    inputPersonas?.addEventListener("input", validarCapacidadTiempoReal);

    // Botones rápidos de cambio de estado
    document.querySelectorAll(".btn-estado").forEach(btn => {
        btn.addEventListener("click", (e) => cambiarEstadoRapido(e.currentTarget.dataset.estado));
    });
}

// Cargar listas y tabla
async function cargarDatosIniciales() {
    await Promise.all([cargarSelectClientes(), cargarSelectSalones()]);
    await cargarEventos();
}

// Llenar select de Clientes
async function cargarSelectClientes() {
    try {
        listaClientes = (await getClientes()) || [];
        selectCliente.innerHTML = '<option value="">Selecciona un cliente</option>';
        listaClientes.forEach(cliente => {
            const option = document.createElement("option");
            option.value = cliente.id_cliente;
            option.textContent = `${cliente.nombre} ${cliente.apellido} (${cliente.email})`;
            selectCliente.appendChild(option);
        });
    } catch (error) {
        console.error("Error cargando clientes en select:", error);
    }
}

// Llenar select de Salones
async function cargarSelectSalones() {
    try {
        listaSalones = (await getSalones()) || [];
        selectSalon.innerHTML = '<option value="">Selecciona un salón</option>';
        listaSalones.forEach(salon => {
            const option = document.createElement("option");
            option.value = salon.id_salon;
            option.textContent = `${salon.nombre_salon} - Capacidad: ${salon.capacidad} pers. ($${salon.precio_renta}/hora)`;
            option.dataset.precio = salon.precio_renta;
            option.dataset.capacidad = salon.capacidad;
            selectSalon.appendChild(option);
        });
    } catch (error) {
        console.error("Error cargando salones en select:", error);
    }
}

// Cargar y listar eventos
async function cargarEventos() {
    try {
        tablaBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-4 text-muted">
                    <div class="spinner-border spinner-border-sm text-primary" role="status"></div> Cargando eventos...
                </td>
            </tr>
        `;
        const eventos = await getEventos();
        renderTabla(eventos || []);
    } catch (error) {
        mostrarAlerta(error.message || "Error al conectar con el servidor", "danger");
        tablaBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle"></i> Error al cargar los eventos.
                </td>
            </tr>
        `;
    }
}

// Renderizar tabla de eventos
function renderTabla(eventos) {
    if (!eventos || eventos.length === 0) {
        tablaBody.innerHTML = "";
        emptyState.classList.remove("d-none");
        return;
    }

    emptyState.classList.add("d-none");
    tablaBody.innerHTML = eventos.map(e => {
        const badgeColor = obtenerColorEstado(e.estado);
        const totalFormateado = Number(e.total_pago || 0).toLocaleString("es-SV", {
            style: "currency",
            currency: "USD"
        });

        return `
            <tr>
                <td class="fw-bold">#${e.id_evento}</td>
                <td><strong>${e.nombre_evento}</strong></td>
                <td><i class="bi bi-person text-muted me-1"></i>${e.nombre_cliente || `Cliente #${e.id_cliente}`}</td>
                <td><i class="bi bi-building text-muted me-1"></i>${e.nombre_salon || `Salón #${e.id_salon}`}</td>
                <td><i class="bi bi-calendar3 text-muted me-1"></i>${formatearFecha(e.fecha_evento)}</td>
                <td><span class="badge bg-secondary text-light">${e.cantidad_personas} pers.</span></td>
                <td>${e.cantidad_horas} hrs</td>
                <td class="text-success fw-bold">${totalFormateado}</td>
                <td>
                    <button class="btn badge ${badgeColor} badge-estado" data-action="quick-status" data-id="${e.id_evento}" data-name="${e.nombre_evento}">
                        ${e.estado} <i class="bi bi-pencil-fill ms-1" style="font-size: 0.7em;"></i>
                    </button>
                </td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary me-1" data-action="edit" data-id="${e.id_evento}" title="Editar">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${e.id_evento}" data-name="${e.nombre_evento}" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

// Cálculo en vivo del total a pagar
function recalcularPreview() {
    const horas = Number(inputHoras.value) || 0;
    const selectedOption = selectSalon.options[selectSalon.selectedIndex];
    const precioHora = selectedOption ? Number(selectedOption.dataset.precio || 0) : 0;
    const total = horas * precioHora;

    previewTotal.value = total.toFixed(2);
    validarCapacidadTiempoReal();
}

// Alerta en vivo si las personas superan la capacidad
function validarCapacidadTiempoReal() {
    const personas = Number(inputPersonas.value) || 0;
    const selectedOption = selectSalon.options[selectSalon.selectedIndex];
    const capacidadMax = selectedOption ? Number(selectedOption.dataset.capacidad || 0) : 0;

    if (capacidadMax > 0 && personas > capacidadMax) {
        alertaCapacidad.classList.remove("d-none");
        textoAlertaCapacidad.textContent = `¡Atención! La cantidad de personas (${personas}) supera la capacidad máxima de este salón (${capacidadMax} personas).`;
    } else {
        alertaCapacidad.classList.add("d-none");
    }
}

// Abrir modal crear
function abrirModalCrear() {
    formEvento.reset();
    formEvento.classList.remove("was-validated");
    formEvento.eventoId.value = "";
    alertaCapacidad.classList.add("d-none");
    previewTotal.value = "0.00";
    modalTitle.textContent = "Registrar Nuevo Evento";
    btnGuardar.textContent = "Guardar Evento";
    document.querySelector("#estado").value = "CONFIRMADA";
    bsModal?.show();
}

// Abrir modal editar
async function abrirModalEditar(id) {
    formEvento.reset();
    formEvento.classList.remove("was-validated");
    alertaCapacidad.classList.add("d-none");
    try {
        const evento = await getEventoPorId(id);
        formEvento.eventoId.value = evento.id_evento;
        formEvento.nombre_evento.value = evento.nombre_evento;
        formEvento.id_cliente.value = evento.id_cliente;
        formEvento.id_salon.value = evento.id_salon;
        formEvento.fecha_evento.value = evento.fecha_evento;
        formEvento.cantidad_personas.value = evento.cantidad_personas;
        formEvento.cantidad_horas.value = evento.cantidad_horas;
        formEvento.estado.value = evento.estado;

        recalcularPreview();

        modalTitle.textContent = "Editar Evento";
        btnGuardar.textContent = "Guardar Cambios";
        bsModal?.show();
    } catch (error) {
        mostrarAlerta("No se pudo cargar la información del evento.", "danger");
    }
}

// Guardar evento (Crear o Actualizar)
async function guardarEvento(event) {
    event.preventDefault();

    if (!formEvento.checkValidity()) {
        formEvento.classList.add("was-validated");
        return;
    }

    const id = formEvento.eventoId.value;
    const datosEvento = {
        nombre_evento: formEvento.nombre_evento.value.trim(),
        id_cliente: Number(formEvento.id_cliente.value),
        id_salon: Number(formEvento.id_salon.value),
        fecha_evento: formEvento.fecha_evento.value,
        cantidad_personas: Number(formEvento.cantidad_personas.value),
        cantidad_horas: Number(formEvento.cantidad_horas.value),
        estado: formEvento.estado.value
    };

    setLoading(true);

    try {
        if (id) {
            await updateEvento(id, datosEvento);
            mostrarAlerta("Evento actualizado correctamente.", "success");
        } else {
            await createEvento(datosEvento);
            mostrarAlerta("Evento registrado con éxito con estado inicial CONFIRMADA.", "success");
        }
        bsModal?.hide();
        await cargarEventos();
    } catch (error) {
        mostrarAlerta(error.message, "danger");
    } finally {
        setLoading(false);
    }
}

// Manejar clics en la tabla
async function manejarAccionesTabla(event) {
    const boton = event.target.closest("button[data-action]");
    if (!boton) return;

    const action = boton.dataset.action;
    const id = boton.dataset.id;
    const nombre = boton.dataset.name;

    if (action === "edit") {
        await abrirModalEditar(id);
    } else if (action === "delete") {
        if (confirm(`¿Estás seguro de que deseas eliminar el evento "${nombre}"?`)) {
            try {
                await deleteEvento(id);
                mostrarAlerta("Evento eliminado con éxito.", "success");
                await cargarEventos();
            } catch (error) {
                mostrarAlerta(error.message, "danger");
            }
        }
    } else if (action === "quick-status") {
        inputCambioEstadoId.value = id;
        nombreEventoEstado.textContent = nombre;
        bsModalEstado?.show();
    }
}

// Cambiar estado rápido
async function cambiarEstadoRapido(nuevoEstado) {
    const id = inputCambioEstadoId.value;
    if (!id) return;

    try {
        const eventoActual = await getEventoPorId(id);
        const datosActualizados = {
            nombre_evento: eventoActual.nombre_evento,
            id_cliente: eventoActual.id_cliente,
            id_salon: eventoActual.id_salon,
            fecha_evento: eventoActual.fecha_evento,
            cantidad_personas: eventoActual.cantidad_personas,
            cantidad_horas: eventoActual.cantidad_horas,
            estado: nuevoEstado
        };

        await updateEvento(id, datosActualizados);
        mostrarAlerta(`Estado del evento actualizado a "${nuevoEstado}".`, "success");
        bsModalEstado?.hide();
        await cargarEventos();
    } catch (error) {
        mostrarAlerta(error.message, "danger");
    }
}

// Formatear colores según estado
function obtenerColorEstado(estado) {
    switch (estado?.toUpperCase()) {
        case "CONFIRMADA":
        case "CONFIRMADO":
            return "bg-success text-light";
        case "COMPLETADA":
        case "FINALIZADO":
            return "bg-primary text-light";
        case "PENDIENTE":
            return "bg-warning text-dark";
        case "CANCELADO":
            return "bg-danger text-light";
        default:
            return "bg-secondary text-light";
    }
}

// Formatear fechas
function formatearFecha(fechaStr) {
    if (!fechaStr) return "—";
    const [year, month, day] = fechaStr.split("-");
    if (!year || !month || !day) return fechaStr;
    return `${day}/${month}/${year}`;
}

// Control de carga del botón
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
    }, 6000);
}
