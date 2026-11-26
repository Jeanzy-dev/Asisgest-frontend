export function escapar(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function fechaCorta(fechaISO) {
  if (!fechaISO) return '';
  const [a, m, d] = String(fechaISO).slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

export function horaCorta(hora) {
  return hora ? String(hora).slice(0, 5) : '';
}

export function fechaHora(valor) {
  if (!valor) return '';
  return fechaCorta(valor) + ' ' + String(valor).slice(11, 16);
}

export function hoyISO(diasAtras = 0) {
  const f = new Date();
  f.setDate(f.getDate() - diasAtras);
  const m = String(f.getMonth() + 1).padStart(2, '0');
  const d = String(f.getDate()).padStart(2, '0');
  return `${f.getFullYear()}-${m}-${d}`;
}

export function horaActual() {
  const f = new Date();
  return String(f.getHours()).padStart(2, '0') + ':' + String(f.getMinutes()).padStart(2, '0');
}

export function nombreCurso(grado, grupo) {
  return `${grado}°${grupo}`;
}
