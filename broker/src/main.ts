import 'reflect-metadata';
import { Module, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Autenticacion, Usuario } from './autenticacion.js';
import { BrokerController } from './controlador.js';
import { JwtGuard, LecturaGuard, ServicioGuard } from './guardas.js';
import { Proxy } from './proxy.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3306),
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      entities: [Usuario],
      // El broker guarda usuarios. Las bases de Productos y Pedidos tienen sus propios permisos.
      synchronize: false,
    }),
    TypeOrmModule.forFeature([Usuario]),
  ],
  controllers: [BrokerController],
  providers: [Autenticacion, JwtGuard, LecturaGuard, ServicioGuard, Proxy],
})
class App {}

const app = await NestFactory.create(App);
app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
const swagger = new DocumentBuilder()
  .setTitle('Broker de la tienda')
  .setVersion('1.0')
  .addBearerAuth()
  .addBearerAuth({ type: 'http', scheme: 'bearer' }, 'servicio')
  .build();
SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, swagger));
await app.listen(Number(process.env.PORT ?? 3000), '0.0.0.0');
