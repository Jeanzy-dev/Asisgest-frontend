import { writable } from 'svelte/store';


const CLAVE = 'sesion_llegadas';

function leerSesionGuardada() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE)) || null;
  } catch {
    return null;
  }
}

export const sesion = writable(leerSesionGuardada());

sesion.subscribe((valor) => {
  try {
    if (valor) localStorage.setItem(CLAVE, JSON.stringify(valor));
    else localStorage.removeItem(CLAVE);
  } catch {
  }
});

export function obtenerToken() {
  return leerSesionGuardada()?.token || null;
}

export function cerrarSesion() {
  sesion.set(null);
}
