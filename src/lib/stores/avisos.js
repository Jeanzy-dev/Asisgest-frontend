import { writable } from 'svelte/store';

export const avisos = writable([]);
let contador = 0;

export function avisar(texto, tipo = 'exito', duracion = 4000) {
  const id = ++contador;
  avisos.update((lista) => [...lista, { id, texto, tipo }]);
  setTimeout(() => quitarAviso(id), duracion);
}

export function quitarAviso(id) {
  avisos.update((lista) => lista.filter((a) => a.id !== id));
}
