const NOMBRE_TRABAJADOR_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
const MONTO_PATTERN = /^\d+(?:\.\d{1,2})?$/;

export function validarAperturaCaja({ nombreTrabajador, montoInicial }) {
  const nombre = String(nombreTrabajador || "").trim();
  const montoTexto = String(montoInicial ?? "").trim();
  const monto = Number(montoTexto);

  if (!NOMBRE_TRABAJADOR_PATTERN.test(nombre)) {
    return "Ingrese un nombre válido para el trabajador.";
  }

  if (!MONTO_PATTERN.test(montoTexto) || !Number.isFinite(monto) || monto < 0) {
    return "El monto inicial debe ser un número mayor o igual a 0, con máximo 2 decimales.";
  }

  return "";
}
