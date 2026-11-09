import 'reflect-metadata';
import { BadRequestException, Module, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductosController, InventarioController } from './controlador.js';
import { Descuento, Producto } from './modelos.js';
import { Productos } from './productos.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3306),
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      entities: [Producto, Descuento],
      // El esquema se crea con los scripts SQL versionados.
      synchronize: false,
    }),
    TypeOrmModule.forFeature([Producto, Descuento]),
  ],
  controllers: [ProductosController, InventarioController],
  providers: [Productos],
})
class App {}

const app = await NestFactory.create(App);
app.useGlobalPipes(new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  exceptionFactory: (errores) => new BadRequestException(
    errores.flatMap(({ property, constraints }) =>
      Object.entries(constraints ?? {}).map(([regla, mensaje]) => {
        if (regla === 'whitelistValidation') return `El campo "${property}" no está permitido`;
        if (regla === 'isObject') return 'El cuerpo de la solicitud debe ser un objeto JSON';
        return mensaje;
      }),
    ),
  ),
}));
const swagger = new DocumentBuilder().setTitle('Productos').setVersion('1.0').build();
SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, swagger));
await app.listen(Number(process.env.PORT ?? 3001), '0.0.0.0');
