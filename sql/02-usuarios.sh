#!/bin/sh
(
  set -eu

  crear_usuario() {
    cuenta="$1"
    clave="$2"

    case "$clave" in
      ''|*[!a-zA-Z0-9_-]*)
        printf 'Clave MySQL inválida para %s\n' "$cuenta" >&2
        exit 1
        ;;
    esac

    MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql --user=root --protocol=socket <<SQL
CREATE USER IF NOT EXISTS '$cuenta'@'%' IDENTIFIED BY '$clave';
GRANT SELECT, INSERT, UPDATE, DELETE ON \`$cuenta\`.* TO '$cuenta'@'%';
SQL
  }

  crear_usuario broker "$BROKER_DB_PASSWORD"
  crear_usuario productos "$PRODUCTOS_DB_PASSWORD"
  crear_usuario pedidos "$PEDIDOS_DB_PASSWORD"
)
