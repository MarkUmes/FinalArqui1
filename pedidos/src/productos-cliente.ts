import {
  BadGatewayException, ConflictException, GatewayTimeoutException, Injectable,
  NotFoundException, ServiceUnavailableException,
} from '@nestjs/common';

@Injectable()
export class ProductosCliente {
  consultar(productoId: number): Promise<{ stock: number }> {
    return this.enviar(`/productos/${productoId}`);
  }

  descontar(productoId: number, pedidoId: string, cantidad: number): Promise<{ precioUnitario: string }> {
    return this.enviar(`/interno/productos/${productoId}/descuentos`, { pedidoId, cantidad });
  }

  private async enviar<T>(ruta: string, cuerpo?: object): Promise<T> {
    // Pedidos conoce la dirección del broker. El broker resuelve el destino de Productos.
    const signal = AbortSignal.timeout(6500);
    let respuesta: Response;
    try {
      respuesta = await fetch(`${process.env.BROKER_URL}${ruta}`, {
        method: cuerpo ? 'POST' : 'GET',
        headers: {
          Authorization: `Bearer ${process.env.SERVICIO_TOKEN}`,
          ...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
        },
        body: cuerpo ? JSON.stringify(cuerpo) : undefined,
        signal,
      });
    } catch {
      if (signal.aborted) throw new GatewayTimeoutException('Productos excedió el tiempo de espera');
      throw new ServiceUnavailableException('El broker de Productos no está disponible');
    }

    switch (respuesta.status) {
      case 401:
      case 403:
        throw new BadGatewayException('La autenticación interna de Productos falló');
      case 404:
        throw new NotFoundException('El producto no existe');
      case 409:
        throw new ConflictException('El descuento no se pudo aplicar por falta de stock o conflicto de pedido');
      case 503:
        throw new ServiceUnavailableException('Productos no está disponible');
      case 504:
        throw new GatewayTimeoutException('Productos excedió el tiempo de espera');
    }
    if (!respuesta.ok) throw new BadGatewayException('Productos devolvió un error');
    try {
      return await respuesta.json() as T;
    } catch {
      if (signal.aborted) throw new GatewayTimeoutException('Productos excedió el tiempo de espera');
      throw new BadGatewayException('Productos devolvió una respuesta inválida');
    }
  }
}
