import 'reflect-metadata';
import { BadRequestException, Module, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Autenticacion, Usuario } from './autenticacion.js';
import { BrokerController } from './controlador.js';
import { ErroresEntrada } from './errores-entrada.js';
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
      synchronize: false,
    }),
    TypeOrmModule.forFeature([Usuario]),
  ],
  controllers: [BrokerController],
  providers: [Autenticacion, JwtGuard, LecturaGuard, ServicioGuard, Proxy],
})
class App {}

const app = await NestFactory.create(App);
app.useGlobalFilters(new ErroresEntrada(app.getHttpAdapter()));
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
const swagger = new DocumentBuilder()
  .setTitle('Broker de la tienda')
  .setVersion('1.0')
  .addBearerAuth()
  .addBearerAuth({ type: 'http', scheme: 'bearer' }, 'servicio')
  .build();
SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, swagger));
await app.listen(Number(process.env.PORT ?? 3000), '0.0.0.0');
