import { getJSON } from './api.js';

// GET /reportes/resumen?desde=&hasta=  -> totales y agrupaciones para tableros
export async function obtenerResumen(desde, hasta) {
  const parametros = new URLSearchParams();
  if (desde) parametros.set('desde', desde);
  if (hasta) parametros.set('hasta', hasta);
  return await getJSON('/api/reportes/resumen?' + parametros.toString());
}
