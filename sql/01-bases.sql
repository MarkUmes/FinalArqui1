-- Cada servicio tiene su propia base dentro de la misma instancia MySQL.
CREATE DATABASE IF NOT EXISTS broker CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS productos CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS pedidos CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS broker.usuarios (
  usuario VARCHAR(80) PRIMARY KEY,
  clave VARCHAR(160) NOT NULL
);

CREATE TABLE IF NOT EXISTS productos.productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  precio DECIMAL(10, 2) NOT NULL CHECK (precio > 0),
  stock INT NOT NULL CHECK (stock >= 0)
);

-- Guardar la operación por pedido permite repetir una solicitud sin descontar dos veces.
CREATE TABLE IF NOT EXISTS productos.descuentos (
  pedido_id CHAR(36) PRIMARY KEY,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL CHECK (cantidad > 0),
  resultado SMALLINT NULL,
  precio_unitario DECIMAL(10, 2) NULL
);

CREATE TABLE IF NOT EXISTS pedidos.pedidos (
  id CHAR(36) PRIMARY KEY,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(10, 2) NULL,
  estado VARCHAR(12) NOT NULL,
  error SMALLINT NULL,
  creado DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
);
