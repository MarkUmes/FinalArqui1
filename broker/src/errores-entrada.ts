import { BadRequestException, Catch, NotFoundException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch(BadRequestException, NotFoundException)
export class ErroresEntrada extends BaseExceptionFilter {
  override catch(error: BadRequestException | NotFoundException, contexto: ArgumentsHost): void {
    if (error instanceof NotFoundException) {
      super.catch(new NotFoundException('La ruta solicitada no existe'), contexto);
      return;
    }

    // El analizador HTTP devuelve un texto. Las validaciones de campos ya devuelven una lista.
    const respuesta = error.getResponse();
    const mensaje = typeof respuesta === 'string' ? respuesta : ('message' in respuesta ? respuesta.message : undefined);
    if (typeof mensaje === 'string') {
      super.catch(new BadRequestException('La solicitud tiene un formato inválido'), contexto);
      return;
    }

    super.catch(error, contexto);
  }
}
