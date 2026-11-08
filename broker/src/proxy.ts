import { GatewayTimeoutException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { variable } from './config.js';

type Destino = 'productos' | 'pedidos';

@Injectable()
export class Proxy {
  async enviar(destino: Destino, solicitud: Request, salida: Response, interno = false): Promise<void> {
    const base = variable(destino === 'productos' ? 'PRODUCTOS_URL' : 'PEDIDOS_URL');
    // Pedidos puede hacer dos llamadas al broker durante una compra.
    const signal = AbortSignal.timeout(destino === 'productos' ? 6000 : 16000);
    const headers = new Headers();
    const cuerpo = solicitud.body === undefined ? undefined : JSON.stringify(solicitud.body);
    if (cuerpo !== undefined) headers.set('Content-Type', 'application/json');
    if (solicitud.headers['idempotency-key']) {
      headers.set('Idempotency-Key', String(solicitud.headers['idempotency-key']));
    }
    if (interno) headers.set('X-Servicio-Token', variable('SERVICIO_TOKEN'));

    try {
      // El destino viene de configuración. Se conserva la ruta y el código HTTP del servicio.
      const respuesta = await fetch(`${base}${solicitud.originalUrl}`, {
        method: solicitud.method,
        headers,
        body: cuerpo,
        signal,
        redirect: 'error',
      });
      const contenido = Buffer.from(await respuesta.arrayBuffer());
      const tipo = respuesta.headers.get('content-type');
      if (tipo) salida.setHeader('Content-Type', tipo);
      salida.status(respuesta.status).send(contenido);
    } catch {
      if (signal.aborted) throw new GatewayTimeoutException(`${destino} excedió el tiempo de espera`);
      throw new ServiceUnavailableException(`${destino} no está disponible`);
    }
  }
}
