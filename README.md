# OpenCode — Sistema de ventas y facturación para una tienda de computadoras

## Objetivo

Desarrollar una aplicación web funcional para administrar una tienda de computadoras y accesorios, usando MongoDB como base de datos y tomando como referencia el ejemplo académico de API REST con Node.js, Express y Mongoose.

El sistema debe permitir registrar productos, administrar inventario, registrar ventas con uno o varios productos, guardar el detalle de lo vendido y generar un comprobante interno imprimible. Debe incluir backend y una interfaz web moderna.

## Instrucciones generales

1. Inspecciona primero los archivos y la estructura actual del proyecto antes de modificar nada.
2. Identifica las tecnologías, dependencias, scripts y configuraciones existentes.
3. Reutiliza la estructura actual cuando sea posible. No elimines ni sobrescribas archivos funcionales sin necesidad.
4. Implementa una solución completa: interfaz web conectada a la API REST y a MongoDB.
5. No dejes botones decorativos ni funcionalidades simuladas. Cada acción visible debe funcionar.
6. No afirmes que una funcionalidad está probada si no la ejecutaste.
7. No sobrescribas el archivo `.env` existente ni incluyas credenciales reales en el repositorio. Crea un `.env.example`.
8. Antes de instalar dependencias, revisa cuáles están instaladas y reutiliza las existentes.
9. Si el proyecto está vacío, crea una estructura clara con backend y frontend.
10. Al finalizar, documenta los cambios, los comandos de ejecución y cualquier prueba que no se haya podido realizar.

## Tecnologías

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- dotenv
- cors
- helmet
- morgan

Usa CommonJS (`require` y `module.exports`) si el proyecto no tiene una configuración distinta ya establecida. Organiza el código en modelos, rutas, controladores y servicios cuando sea conveniente.

### Frontend

Si el proyecto ya tiene una tecnología frontend, respétala. Si está vacío, usa React con Vite y CSS moderno, salvo que exista una razón clara para elegir otra tecnología.

El frontend debe consumir los datos reales de la API, no arreglos hardcodeados como fuente permanente.

## Base de datos

Nombre de la base de datos: `tienda_computadoras_db`

Colecciones principales:

- `productos`
- `ventas`
- `clientes` (opcional, recomendado)

Las referencias entre documentos deben utilizar `ObjectId` de MongoDB y referencias de Mongoose cuando corresponda.

## Modelo de datos

### Colección `productos`

Cada documento representa un equipo o accesorio de la tienda.

Campos:

- `nombre`: String, obligatorio.
- `marca`: String, obligatorio.
- `modelo`: String, obligatorio.
- `categoria`: String, obligatorio. Ejemplos: Laptop, PC de escritorio, Monitor, Teclado, Mouse, Componentes, Almacenamiento y Accesorios.
- `descripcion`: String, opcional.
- `sku`: String, obligatorio y único.
- `precioCompra`: Number, mayor o igual que cero.
- `precioVenta`: Number, obligatorio y mayor que cero.
- `stock`: Number, entero mayor o igual que cero.
- `stockMinimo`: Number, entero mayor o igual que cero.
- `estado`: String, valores permitidos `activo` e `inactivo`.
- `createdAt` y `updatedAt`: fechas automáticas.

Usa `timestamps: true` en el esquema de Mongoose. Añade índices apropiados, incluido un índice único para `sku`.

No permitas eliminar físicamente productos que estén relacionados con ventas. En esos casos, permite desactivarlos.

### Colección `clientes` (opcional, recomendado)

Campos:

- `nombre`: String, obligatorio.
- `apellido`: String, opcional.
- `documentoTipo`: String, opcional; por ejemplo DNI o RUC.
- `documentoNumero`: String, opcional.
- `telefono`: String, opcional.
- `correo`: String, opcional.
- `direccion`: String, opcional.
- `createdAt` y `updatedAt`: fechas automáticas.

Debe ser posible registrar una venta a un cliente genérico sin obligar a crear un cliente.

### Colección `ventas`

Cada documento representa una venta y debe guardar todos los datos necesarios para consultar posteriormente qué se vendió.

Campos:

- `numeroVenta`: String, obligatorio y único, generado por el backend.
- `fecha`: Date, con valor predeterminado de la fecha actual.
- `clienteId`: ObjectId con referencia a `Cliente`, opcional.
- `clienteSnapshot`: objeto con el nombre y documento del cliente al momento de la venta, si se proporcionaron.
- `items`: arreglo con los productos vendidos. Cada elemento contiene:
  - `productoId`: ObjectId con referencia a `Producto`.
  - `nombreProducto`: String, copia histórica del nombre.
  - `sku`: String, copia histórica del SKU.
  - `marca`: String.
  - `cantidad`: Number entero mayor que cero.
  - `precioUnitario`: Number, precio aplicado al momento de la venta.
  - `subtotal`: Number, calculado por el backend como cantidad por precio unitario.
- `subtotal`: Number, suma de los subtotales de los artículos.
- `descuento`: Number, predeterminado en cero.
- `impuesto`: Number, calculado según la configuración definida.
- `total`: Number, calculado por el backend.
- `metodoPago`: String, por ejemplo Efectivo, Tarjeta, Transferencia u Otro.
- `estado`: String, por ejemplo `completada` o `anulada`.
- `observaciones`: String, opcional.
- `createdAt` y `updatedAt`: fechas automáticas.

## Reglas de negocio de las ventas

1. El backend debe validar y calcular todos los precios, subtotales, descuentos, impuestos y totales. No confíes en los importes enviados por el frontend.
2. Comprueba que cada producto exista, esté activo y tenga stock suficiente.
3. Al confirmar una venta, descuenta del inventario las unidades vendidas.
4. Si falla una validación, no guardes una venta incompleta ni permitas que el inventario quede parcialmente actualizado. Utiliza transacciones de MongoDB cuando el entorno las soporte. Si no están disponibles, implementa un mecanismo seguro y documentado para evitar inconsistencias.
5. Conserva el nombre, SKU y precio unitario históricos dentro de cada ítem para que las ventas anteriores no cambien cuando se actualice el producto.
6. No permitas cantidades cero, negativas o decimales.
7. No permitas descuentos negativos ni descuentos superiores al subtotal.
8. La anulación de una venta debe cambiar su estado y restaurar el stock exactamente una vez. No elimines físicamente una venta completada.
9. Usa un tratamiento monetario consistente con dos decimales.
10. Deja la tasa del impuesto configurable mediante una variable de entorno y documenta su cálculo.
11. El comprobante será interno para la aplicación académica; no lo presentes como factura electrónica oficial de SUNAT.

## API REST

Todas las rutas deben utilizar el prefijo `/api`. Valida los parámetros, los `ObjectId` y el cuerpo de las peticiones. Devuelve JSON consistente y códigos HTTP apropiados.

### Productos

- `GET /api/productos`: listar productos. Admite búsqueda por nombre o SKU, filtros por marca, categoría y estado, y paginación.
- `GET /api/productos/:id`: consultar un producto.
- `POST /api/productos`: crear un producto.
- `PUT /api/productos/:id` o `PATCH /api/productos/:id`: actualizar un producto.
- `PATCH /api/productos/:id/estado`: activar o desactivar un producto.
- `DELETE /api/productos/:id`: eliminar únicamente si no está relacionado con ventas; si tiene referencias, informar que debe desactivarse.

### Ventas

- `GET /api/ventas`: listar ventas. Admite filtros por rango de fechas, estado y número de venta.
- `GET /api/ventas/:id`: consultar el detalle completo de una venta.
- `POST /api/ventas`: registrar una venta y descontar el inventario de forma segura.
- `PATCH /api/ventas/:id/anular`: anular una venta y restaurar el stock una sola vez.

### Clientes (si se implementa el módulo)

- `GET /api/clientes`
- `GET /api/clientes/:id`
- `POST /api/clientes`
- `PATCH /api/clientes/:id`
- `DELETE /api/clientes/:id`, sujeto a las referencias existentes.

### Dashboard

- `GET /api/dashboard/resumen`: devolver el total vendido en el día, la cantidad de ventas del día, la cantidad de productos activos, productos con stock bajo, ventas recientes y productos más vendidos si se puede calcular razonablemente.

Calcula agregaciones en el backend mediante consultas y `aggregate()` cuando sea conveniente.

### Salud del servidor

- `GET /api/health`: informar si el servidor está activo y el estado de la conexión con MongoDB.

## Interfaz web

Construye una interfaz profesional, moderna y responsive para una tienda de tecnología. Debe parecer un sistema de gestión real y ser fácil de utilizar.

### Diseño visual

- Paleta sugerida: azul oscuro o grafito, blanco, gris claro y un acento azul o cian.
- Navegación lateral con iconos y etiquetas.
- Barra superior con el nombre de la tienda.
- Tarjetas de indicadores para el dashboard.
- Tablas claras, filtros y estados vacíos.
- Formularios con etiquetas, validaciones y mensajes de error.
- Diseño adaptable a escritorio, tablet y móvil.
- Buen contraste, tipografía legible y navegación por teclado razonable.
- Evita el exceso de gradientes, animaciones y elementos decorativos.
- Utiliza una librería de iconos si ya está instalada o si resulta apropiado añadirla.

### Vistas necesarias

#### 1. Dashboard

- Total vendido durante el día.
- Número de ventas realizadas.
- Cantidad de productos activos.
- Alertas de productos con stock bajo.
- Tabla de ventas recientes.
- Accesos rápidos a “Nueva venta” y “Registrar producto”.

#### 2. Inventario

- Tabla con nombre, SKU, marca, modelo, categoría, precio, stock y estado.
- Búsqueda y filtros.
- Botón para registrar un producto.
- Acciones para editar y activar/desactivar productos.
- Indicadores visuales para productos con stock bajo o agotado.
- Paginación cuando sea necesaria.

#### 3. Formulario de producto

- Crear y editar productos.
- Validaciones coherentes con el backend.
- Mensajes comprensibles cuando el SKU ya exista o haya otros errores.

#### 4. Historial de ventas

- Tabla con número de venta, fecha, cliente, método de pago, estado y total.
- Filtros por fecha y estado.
- Acceso al detalle de cada venta.

#### 5. Nueva venta

- Buscar productos por nombre o SKU.
- Mostrar precio y stock disponible.
- Agregar varios productos al carrito.
- Cambiar cantidades y quitar artículos antes de confirmar.
- Permitir seleccionar un cliente o usar cliente genérico.
- Seleccionar el método de pago.
- Mostrar subtotal, descuento, impuesto y total.
- Validar cantidades respecto del stock disponible.
- Solicitar confirmación antes de guardar.
- Mostrar confirmación y el detalle de la venta al finalizar.

#### 6. Detalle de venta y comprobante

- Mostrar número de venta, fecha, datos configurables de la tienda, cliente si corresponde, artículos, cantidades, precios y totales.
- Incluir un botón para imprimir con `window.print()` y estilos CSS específicos para impresión.
- Aclarar que se trata de un comprobante interno, no una factura electrónica oficial de SUNAT.

#### 7. Clientes (opcional)

- Listar, buscar, registrar y editar clientes.

## Experiencia de usuario

- Maneja estados de carga, éxito, error y ausencia de datos.
- Presenta los errores de la API con mensajes comprensibles.
- Solicita confirmación antes de anular ventas o realizar acciones destructivas.
- Evita usar `alert()` como mecanismo principal; utiliza notificaciones y mensajes integrados en la interfaz.
- Actualiza los datos después de crear, editar o anular registros.
- No presentes datos de demostración como si fueran datos reales.

## Datos de demostración

Crea un script `seed.js` que permita cargar datos de prueba:

- Al menos 12 productos variados: laptops, PC de escritorio, monitores, teclados, mouse, SSD, memoria RAM, tarjetas gráficas y accesorios.
- Varias marcas y categorías.
- Precios y stock plausibles para una práctica académica, usando soles peruanos (S/).
- Algunos productos con stock bajo para probar las alertas.
- Varios clientes, si se implementa el módulo.
- Varias ventas de demostración con diferentes cantidades, fechas y métodos de pago.

El seed normal no debe borrar datos existentes. Crea un comando de reinicio explícito, por ejemplo `npm run seed:reset`, y advierte claramente que elimina los datos que corresponda. Mantén coherencia entre las ventas de demostración y las cantidades de inventario.

## Configuración y seguridad básica

Usa variables de entorno. Crea `.env.example` con valores de ejemplo y no subas `.env` al control de versiones.

Variables sugeridas:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/tienda_computadoras_db
FRONTEND_URL=http://localhost:5173
TAX_RATE=0
CURRENCY=PEN
```

- Configura `helmet`, CORS con origen configurable, `express.json()` con un límite razonable y `morgan` en desarrollo.
- Valida los datos en la capa de entrada y en los modelos.
- No expongas secretos ni trazas internas en respuestas HTTP.
- Maneja adecuadamente errores de conexión con MongoDB.
- Evita duplicar la lógica de cálculo de ventas en distintos lugares del backend.

## Estructura de carpetas sugerida

Adapta esta estructura a la estructura actual del proyecto; no es obligatorio replicarla literalmente.

```text
tienda-computadoras/
├── backend/
│   ├── index.js
│   ├── .env.example
│   ├── package.json
│   ├── models/
│   │   ├── Producto.js
│   │   ├── Venta.js
│   │   └── Cliente.js
│   ├── routes/
│   │   ├── productoRoutes.js
│   │   ├── ventaRoutes.js
│   │   ├── clienteRoutes.js
│   │   └── dashboardRoutes.js
│   ├── controllers/
│   ├── middleware/
│   ├── services/
│   ├── scripts/
│   │   └── seed.js
│   └── README.md
└── frontend/
    ├── package.json
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   ├── hooks/
    │   ├── styles/
    │   └── App.jsx
    └── README.md
```

## Pruebas y criterios de aceptación

- [ ] El backend se conecta a MongoDB mediante `MONGO_URI`.
- [ ] Se pueden crear, listar, buscar, editar y desactivar productos.
- [ ] Los SKU duplicados se rechazan con un mensaje claro.
- [ ] Se puede registrar una venta con uno o varios productos.
- [ ] El backend calcula los totales y no confía en los importes del frontend.
- [ ] Una venta válida reduce el stock correctamente.
- [ ] Una venta con stock insuficiente no se guarda.
- [ ] Anular una venta restaura el stock una sola vez.
- [ ] Las ventas conservan los datos históricos de los artículos.
- [ ] El dashboard obtiene datos reales de la API.
- [ ] La interfaz funciona en escritorio y móvil.
- [ ] El comprobante se puede imprimir.
- [ ] Los formularios y errores se muestran claramente.
- [ ] El seed no elimina información existente por accidente.
- [ ] Se ejecutaron las verificaciones posibles y se documentaron las que no pudieron realizarse.

Prueba los casos normales y los errores importantes. Si no hay una instancia de MongoDB disponible, indícalo y no afirmes que las pruebas de integración fueron exitosas.

## README final

Crea o actualiza un `README.md` que incluya:

1. Requisitos previos.
2. Cómo iniciar MongoDB local o configurar MongoDB Atlas.
3. Cómo instalar las dependencias del backend y frontend.
4. Cómo configurar `.env`.
5. Cómo cargar datos de demostración.
6. Comandos para iniciar el backend y frontend.
7. URL de la interfaz local y del endpoint `/api/health`.
8. Endpoints principales con ejemplos JSON de petición y respuesta.
9. Explicación del cálculo de importes, control de stock, anulación y limitaciones del comprobante.

## Orden de trabajo

1. Inspeccionar el proyecto actual y resumir su estructura.
2. Implementar los modelos y la conexión con MongoDB.
3. Implementar productos e inventario.
4. Implementar ventas, cálculo de importes y control de stock.
5. Implementar el dashboard y el endpoint de salud.
6. Construir la interfaz y conectar cada vista con la API.
7. Crear los datos de demostración de forma segura.
8. Ejecutar pruebas y corregir errores.
9. Actualizar la documentación.
10. Entregar un resumen de lo implementado y los comandos exactos para ejecutar el sistema.

## Prioridad principal

El flujo completo debe funcionar de extremo a extremo:

1. Registrar un producto.
2. Verlo en el inventario.
3. Crear una venta con uno o varios productos.
4. Guardar el detalle de los productos vendidos.
5. Calcular el total en el backend.
6. Descontar las unidades del inventario.
7. Consultar e imprimir el comprobante.
8. Consultar el historial de ventas y el dashboard.