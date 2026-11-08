# Plataforma de gestión de gimnasio / centro de entrenamiento
**Universidad Centroamericana José Simeón Cañas (UCA)**
**Facultad de Ingeniería y Arquitectura - Departamento de Electrónica e Informática**
**Proyecto 2: Ingeniería de Software**

---

## 1. INICIATIVA Y DEFINICIONES GENERALES

### 1.1 Matriz de Permisos por Rol
Se definen tres roles en el sistema: **Miembro**, **Entrenador** y **Recepción/Administrador** (donde Recepción y Administrador operan como el rol administrativo del sistema con permisos según el ámbito funcional).

| Módulo / Acción | Miembro | Entrenador | Recepción / Administrador |
| :--- | :---: | :---: | :---: |
| Consultar propia membresía y reservas | Sí | No | Sí |
| Registrar / renovar membresía y cobrar | No | No | Sí |
| Crear / editar / deshabilitar planes | No | No | Sí |
| Reservar / cancelar clases grupales | Sí | No | No |
| Crear horarios de clases y cupos | No | No | Sí |
| Definir disponibilidad personal | No | Sí | No |
| Agendar sesión personal | Sí | No | No |
| Registrar check-in / ingreso | No | No | Sí |
| Confirmar ingreso por excepción | No | No | Sí |
| Pagar comprobante / consulta de cobros | Sí (Propios) | No | Sí (Todos) |
| Asignar rutinas a clientes | No | Sí | No |
| Registrar progreso corporal / marcas | Sí | No | No |
| Administrar estado de máquinas | No | No | Sí |
| Consultar estado de máquinas | Sí | Sí | Sí |
| Calificar clase o sesión | Sí | No | No |
| Consultar reportes y analítica | No | No | Sí |

### 1.2 Definición de Estados y Transiciones del Sistema
* **Membresía:**
  * **Vigente:** La fecha actual es menor o igual a la fecha de vencimiento (o cuenta con clases disponibles en plan por clases).
  * **Vencida:** La fecha actual supera la fecha de vencimiento (o el saldo de clases es 0).
  * **Transición:** Vigente a Vencida (al expirar fecha/clases) $\rightarrow$ Vigente (al procesar pago de renovación).
* **Clase / Sesión Grupal:**
  * **Programada:** Creada y disponible para reservas.
  * **Cancelada:** Suspendida por administración.
  * **Finalizada:** Fecha y hora de la sesión concluidas.
* **Reserva de Clase:**
  * **Activa:** Reservada por el miembro.
  * **Cancelada:** Anulada por el miembro o por cancelación de la clase.
* **Sesión Personal:**
  * **Agendada:** Bloque reservado por el miembro.
  * **Completada:** Impartida y confirmada.
  * **Cancelada:** Anulada por el miembro o entrenador.
* **Ingreso (Check-in):**
  * **Permitido:** Membresía vigente.
  * **Excepción:** Membresía vencida, autorizada explícitamente por recepción.
  * **Denegado:** Membresía vencida, acceso no autorizado.
* **Cobro Pendiente:**
  * **Pendiente:** Generado por compra, renovación o agendamiento.
  * **Pagado:** Transacción aprobada por pasarela/efectivo.
  * **Anulado:** Cobro descartado o cancelado.
* **Máquina:**
  * **Operativa (Disponible):** Lista para uso general.
  * **En Mantenimiento:** En revisión técnica programada o preventiva.
  * **Fuera de Servicio:** Averiada o fuera de operación por falla.
* **Notificación:**
  * **No leída:** Recibida en la bandeja del usuario.
  * **Leída:** Visualizada por el usuario.

### 1.3 Decisiones Técnicas Base y Supuestos
1. **Modelo de Usuario (User):** Se extiende la entidad `User` de Prisma para incluir la propiedad `role` (Enum: `MIEMBRO`, `ENTRENADOR`, `RECEPCION_ADMIN`), nombre, apellido y carné.
2. **Registro y Autenticación:**
   * El registro público `POST /users` asigna por defecto el rol `MIEMBRO` y crea su perfil inicial.
   * Los usuarios con rol `ENTRENADOR` o `RECEPCION_ADMIN` se inicializan únicamente mediante scripts de seed de Prisma o creación por un administrador existente.
3. **Seguridad y Códigos HTTP:**
   * Respuestas de autenticación y autorización: `401 Unauthorized` si no hay token válido; `403 Forbidden` si no posee el rol requerido para la acción.
4. **Usuarios de Prueba Base (Seed):**
   * Administrador: `admin@thechen.com`
   * Recepción: `recepcion@thechen.com`
   * Entrenador: `entrenador@thechen.com`
   * Miembro Activo: `miembro.activo@thechen.com`
   * Miembro Vencido: `miembro.vencido@thechen.com`

---

## 2. HISTORIAS DE USUARIO Y DISEÑO TÉCNICO

### ÉPICA 1 (MÓDULO 1): MEMBRESÍAS Y PLANES

#### H1. Consulta del estado de membresía
* **Encargado:** Gerson Majano
* **Como** miembro,
* **Quiero** ver el estado de mi membresía, la fecha de vencimiento y mis clases restantes (si aplica),
* **Para** saber cuándo debo renovarla o cuántos accesos me quedan.
* **Criterios de aceptación:**
  * La pantalla muestra el nombre del plan, el estado (Vigente o Vencida), la fecha de vencimiento y las clases restantes en planes por clases.
  * Si el miembro no posee membresía registrada previamente, se muestra el estado "Sin Membresía" con la opción de explorar planes.
  * El sistema no permite que un miembro consulte la membresía de otro miembro (responde `403 Forbidden`).
* **Diseño Técnico:**
  * **Frontend:** Vista "Mi Membresía". Muestra tarjeta (Card) con el estado en color verde (Vigente) o rojo (Vencida), fecha límite y/o contador de clases.
  * **Backend:** `GET /memberships/me`
    * Respuesta `200 OK`: `{"id": "str", "planName": "str", "status": "Vigente" | "Vencida", "endDate": "ISOString", "remainingClasses": int | null}`
    * Errores: `401 Unauthorized`, `403 Forbidden`.
  * **Datos:** Modelo `Membership` de Prisma asociado a `User`.

#### H2. Registro de compra o renovación de membresía
* **Encargado:** Gerson Majano
* **Como** recepción,
* **Quiero** registrar la compra o renovación de una membresía para un miembro,
* **Para** actualizar su vigencia e iniciar el cobro correspondiente.
* **Criterios de aceptación:**
  * Recepción busca al miembro (por nombre o carné) y selecciona un plan activo.
  * Si la membresía está Vigente, la nueva fecha de vencimiento se calcula sumando la duración del plan a la fecha de vencimiento anterior. Si está Vencida o es la primera compra, la vigencia inicia desde la fecha actual.
  * El registro genera un registro de Cobro en estado Pendiente.
  * El sistema no permite registrar compras para miembros inexistentes ni sin seleccionar un plan válido (`400 Bad Request`).
* **Diseño Técnico:**
  * **Frontend:** Vista "Gestión de Renovaciones". Autocompletado de miembros, selector de plan y botón "Confirmar Registro".
  * **Backend:** `POST /memberships/purchase`
    * Payload: `{"memberId": "str", "planId": "str"}`
    * Respuesta `201 Created`: `{"membershipId": "str", "chargeId": "str", "newEndDate": "ISOString", "status": "Pendiente"}`
    * Errores: `400 Bad Request`, `404 Not Found`.

#### H3. Definición y administración de planes
* **Encargado:** Gerson Majano
* **Como** administrador,
* **Quiero** crear, editar y deshabilitar tipos de planes,
* **Para** mantener actualizada la oferta comercial del gimnasio.
* **Criterios de aceptación:**
  * El administrador define un plan con: nombre (string max 50), tipo (Enum: `MENSUAL`, `TRIMESTRAL`, `CLASES_SUELTAS`), precio (decimal $> 0$), duracionDias (entero $\ge 0$), cantidadClases (entero $\ge 0$, requerido para clases sueltas) y beneficios (string).
  * Permite editar los datos de un plan existente o deshabilitarlo; los planes deshabilitados no se pueden vender, pero conservan las membresías previas.
  * No se permite crear planes con nombres duplicados o precios $\le 0$ (`400 Bad Request`).
* **Diseño Técnico:**
  * **Frontend:** Vista "Administración de Planes". Tabla con planes activos e inactivos, modal para creación/edición y switch de estado.
  * **Backend:**
    * `POST /plans` (Crear)
    * `PUT /plans/:id` (Editar)
    * `PATCH /plans/:id/status` (Deshabilitar)
  * **Datos:** Modelo `Plan` de Prisma.

---

### ÉPICA 2 (MÓDULO 2): RESERVA DE CLASES GRUPALES
Gestionar la oferta de clases grupales (Spinning, Yoga, CrossFit), sus cupos y permitir que los miembros aseguren o cancelen su lugar de forma transparente.

#### H4. Reserva de cupo en una clase
* **Encargado:** Astrid Vides
* **Como** miembro,
* **Quiero** consultar la programación semanal de clases y reservar un cupo,
* **Para** asegurar mi lugar en la actividad deseada.
* **Criterios de aceptación:**
  * Muestra la lista de clases de los siguientes 7 días detallando nombre, nombre del entrenador, horario y cupos disponibles (cupoMaximo menos reservas activas).
  * Si dos miembros intentan reservar el último cupo al mismo tiempo, solo uno obtiene la reserva con éxito (HTTP 201) y el otro recibe una respuesta de sobrecupo (HTTP 409 Conflict).
  * El sistema no permite reservar si el miembro tiene su membresía en estado Vencida, si los cupos están agotados o si el miembro ya cuenta con una reserva activa para esa misma clase.
* **Diseño Técnico:**
  * **Frontend:**
    * Pantalla/Ruta: `/clases/reservar`
    * Rol Autorizado: `MIEMBRO`
    * Tabla de elementos:
      | Elemento | Tipo de Control | Obligatorio | Validación | Opciones |
      | :--- | :--- | :--- | :--- | :--- |
      | Selector de Día | Tabs por día | Sí | Fecha válida dentro de 7 días | Día actual seleccionado |
      | Lista de Clases | Tarjetas de clase | N/A | Muestra cupo libre | N/A |
      | Botón Reservar | Botón | N/A | Deshabilitado si cupo=0 o si ya está reservado | "Reservar Cupo" |
    * Estados: Cargando, Éxito (muestra badge "Reservado" y descuenta 1 cupo visualmente), Sin Permiso (muestra alerta "Membresía Vencida").
  * **Backend:**
    * Endpoint: `POST /api/class-sessions/:id/reserve`
    * Rol Autorizado: `MIEMBRO`
    * Respuesta de Éxito (`HTTP 201 Created`):
      ```json
      {
        "reservationId": "b11a2f33-1122-4433-8899-001122334455",
        "status": "Activa",
        "message": "Reserva confirmada"
      }
      ```
    * Errores:
      * `HTTP 403`: Membresía vencida.
      * `HTTP 409`: Cupo agotado o reserva ya existente para la misma sesión.
    * Operación BD: La verificación e incremento de reservas se ejecutan dentro de una transacción de base de datos (`prisma.$transaction`) con nivel de aislamiento serializable para evitar race conditions.

#### H5. Cancelación de reserva
* **Encargado:** Astrid Vides
* **Como** miembro,
* **Quiero** cancelar una reserva con al menos 2 horas de anticipación,
* **Para** liberar el cupo a otros miembros.
* **Criterios de aceptación:**
  * El miembro puede visualizar sus reservas activas y ejecutar la cancelación si faltan al menos 2 horas o más para el inicio de la clase.
  * Al confirmarse la cancelación, la reserva cambia a estado Cancelada y el cupo disponible de la clase se incrementa automáticamente en 1.
  * El sistema no permite cancelar la reserva si faltan menos de 2 horas para el inicio de la clase, respondiendo con el mensaje explícito "No es posible cancelar con menos de 2 horas de anticipación" (HTTP 400).
* **Diseño Técnico:**
  * **Frontend:**
    * Pantalla / Ruta: `/mis-reservas`
    * Rol Autorizado: `MIEMBRO`.
    * Acción: Lista de reservas activas con botón "Cancelar Reserva". Si la clase inicia en menos de 2 horas, el botón se muestra inhabilitado con un tooltip indicando la razón. Al hacer clic, pide confirmación antes de llamar a la API.
    * Endpoint consumido: `DELETE /api/reservations/:id`
  * **Backend:**
    * Endpoint: `DELETE /api/reservations/:id`
    * Rol Autorizado: `MIEMBRO`
    * Respuesta de Éxito (`HTTP 200 OK`):
      ```json
      {
        "message": "Reserva cancelada exitosamente"
      }
      ```
    * Errores: `HTTP 400` (Faltan menos de 2 horas para el inicio), `HTTP 404` (Reserva no encontrada o no pertenece al usuario).

#### H6. Definición, edición y cancelación de clases
* **Encargado:** Astrid Vides
* **Como** administrador,
* **Quiero** programar la lista de clases grupales, asignar entrenadores y definir cupos,
* **Para** administrar la capacidad y la oferta de actividades del centro.
* **Criterios de aceptación:**
  * El administrador crea una clase indicando nombre, entrenador asignado, fecha, hora de inicio, duración en minutos y cupo máximo.
  * Si el administrador cancela una clase programada, el estado de esta cambia a Cancelada, se liberan sus reservas y el backend invoca automáticamente al Servicio de Notificaciones (Módulo 9) enviando un aviso a todos los miembros inscritos.
  * El sistema no permite programar clases que presenten solapamiento de horario para el mismo entrenador ni cancelar clases que ya hayan finalizado (`HTTP 409 Conflict`).
* **Diseño Técnico:**
  * **Frontend:**
    * Pantalla / Ruta: `/admin/clases`
    * Rol Autorizado: `RECEPCION_ADMIN`.
    * Acciones: Formulario de programación en modal, botón de "Cancelar Clase" que solicita motivo y dispara la alerta.
    * Endpoints: `POST /api/classes`, `PUT /api/classes/:id`, `PATCH /api/classes/:id/cancel`.
  * **Backend:**
    * Endpoints:
      * `POST /api/classes`
      * `PATCH /api/classes/:id/cancel`
    * Contrato Solicitud (`POST /api/classes`):
      ```json
      {
        "name": "Yoga Flow",
        "trainerId": "d99b1122-3344-5566-7788-9900aabbccdd",
        "date": "2026-11-05",
        "startTime": "08:00",
        "durationMinutes": 60,
        "maxCapacity": 20
      }
      ```
    * Respuesta de Éxito (`HTTP 201 Created`): Retorna la sesión de clase configurada.
    * Errores: `HTTP 409` (Solapamiento de horario del entrenador).
  * **Datos:** Modelo `Plan` de Prisma.

---

### ÉPICA 3 (MÓDULO 3): AGENDA DE ENTRENADORES PERSONALES
Gestionar la disponibilidad horaria de los entrenadores y permitir el agendamiento de sesiones 1 a 1 de forma libre de conflictos.

#### H7. Registro de bloques de disponibilidad de entrenador
* **Encargado:** Jonathan Rodrigo Rivera Jiménez
* **Como** Entrenador,
* **Quiero** definir mis bloques de disponibilidad horaria,
* **Para** que los miembros puedan agendar sesiones de entrenamiento personal conmigo.
* **Criterios de Aceptación:**
  1. El entrenador define bloques horarios especificando fecha y hora de inicio. Cada bloque cuenta con una duración fija de 60 minutos entre las 06:00 y las 21:00 horas.
  2. El entrenador visualiza únicamente sus propios bloques de disponibilidad registrados.
  3. El sistema no permite registrar bloques que se crucen con otros bloques ya existentes del mismo entrenador ni crear disponibilidad en fechas u horas pasadas (`HTTP 409` / `HTTP 400`).
* **Diseño Técnico Frontend:**
  * Pantalla / Ruta: `/entrenador/disponibilidad`
  * Rol Autorizado: `ENTRENADOR`.
  * Elementos: Selector de fecha (DatePicker), selector de hora de inicio (Select 06:00 a 21:00) y tabla con los bloques definidos.
  * Estados: Éxito (agrega el bloque a la lista), Error de validación (mensaje "No se pueden registrar fechas pasadas").
  * Endpoint consumido: `POST /api/trainer-availability`
* **Diseño Técnico Backend:**
  * Endpoint: `POST /api/trainer-availability`
  * Rol Autorizado: `ENTRENADOR`
  * Solicitud (Body):
    ```json
    {
      "date": "2026-11-10",
      "startTime": "10:00"
    }
    ```
  * Respuesta de Éxito (`HTTP 201 Created`):
    ```json
    {
      "slotId": "e11a0099-8877-6655-4433-221100ffffff",
      "date": "2026-11-10",
      "startTime": "10:00",
      "endTime": "11:00",
      "isBooked": false
    }
    ```
  * Errores: `HTTP 400` (Fecha pasada), `HTTP 409` (Bloque duplicado o cruzado).

#### H8. Agendamiento de sesión personal
* **Encargado:** Jonathan Rodrigo Rivera Jiménez
* **Como** Miembro,
* **Quiero** seleccionar un horario disponible de un entrenador y agendar una sesión,
* **Para** recibir asesoría y entrenamiento personalizado.
* **Criterios de Aceptación:**
  1. El miembro selecciona a un entrenador y visualiza sus bloques disponibles dentro de los próximos 14 días.
  2. Al confirmar la sesión, esta se registra en estado Agendada, se genera un cobro en estado Pendiente (si aplica según el plan) y el bloque de tiempo queda marcado como reservado.
  3. El sistema no permite agendar la sesión si la membresía del miembro está Vencida (devuelve `HTTP 403`) ni si el bloque ya fue agendado concurrentemente por otro miembro (devuelve `HTTP 409 Conflict`).
* **Diseño Técnico Frontend:**
  * Pantalla / Ruta: `/entrenadores/agendar`
  * Rol Autorizado: `MIEMBRO`.
  * Elementos: Selector de Entrenador, cuadrícula de horarios disponibles (Slots) y modal de confirmación mostrando costo y detalle de la sesión.
  * Endpoints: `GET /api/trainers`, `GET /api/trainers/:id/availability`, `POST /api/personal-sessions`.
* **Diseño Técnico Backend:**
  * Endpoint: `POST /api/personal-sessions`
  * Rol Autorizado: `MIEMBRO`
  * Solicitud (Body):
    ```json
    {
      "trainerId": "d99b1122-3344-5566-7788-9900aabbccdd",
      "slotId": "e11a0099-8877-6655-4433-221100ffffff"
    }
    ```
  * Respuesta de Éxito (`HTTP 201 Created`):
    ```json
    {
      "sessionId": "ff887766-5544-3322-1100-aabbccddeeff",
      "status": "Agendada",
      "chargeId": "c0011223-3445-5667-7889-900112233445"
    }
    ```
  * Errores: `HTTP 403` (Membresía vencida), `HTTP 409` (Bloque ya reservado).
  * **Modelos de Datos (ORM Prisma):**
    ```prisma
    model TrainerSlot {
      id               String            @id @default(uuid())
      trainerId        String
      trainer          User              @relation(fields: [trainerId], references: [id])
      date             DateTime
      startTime        String
      endTime          String
      isBooked         Boolean           @default(false)
      personalSession  PersonalSession?
    }

    model PersonalSession {
      id          String        @id @default(uuid())
      slotId      String        @unique
      slot        TrainerSlot   @relation(fields: [slotId], references: [id])
      memberId    String
      member      User          @relation(fields: [memberId], references: [id])
      status      SessionStatus @default(Agendada)
      createdAt   DateTime      @default(now())
    }

    enum SessionStatus {
      Agendada
      Completada
      Cancelada
    }
    ```

---

### ÉPICA 4 (MÓDULO 4): CHECK-IN Y CONTROL DE ACCESO
Validar el acceso físico a las instalaciones del gimnasio comprobando la vigencia de la membresía en tiempo real desde recepción.

#### H9. Registro de ingreso de miembros y validación de vigencia
* **Encargado:** Jonathan Rodrigo Rivera Jiménez
* **Como** Recepción / Administrador,
* **Quiero** ingresar el carné de un miembro y registrar su entrada,
* **Para** validar si su membresía está vigente y controlar el acceso a las instalaciones.
* **Criterios de Aceptación:**
  1. Recepción busca al miembro mediante su código de carné exacto o por su nombre completo.
  2. Si la membresía está Vigente, el sistema autoriza la entrada y registra el acceso con resultado Permitido (`HTTP 201`).
  3. Si la membresía está Vencida, el sistema rechaza el acceso (`HTTP 403`) a menos que recepción marque de forma explícita la casilla "Autorizar por Excepción", guardando el registro con resultado Excepcion.
  4. Si se intenta registrar un segundo acceso para el mismo miembro en un intervalo menor a 5 minutos, el sistema bloquea el registro devolviendo `HTTP 409` con el mensaje "Ingreso ya registrado hace menos de 5 minutos".
* **Diseño Técnico Frontend:**
  * Pantalla / Ruta: `/recepcion/check-in`
  * Rol Autorizado: `RECEPCION_ADMIN`.
  * Tabla de Elementos:
    | Elemento | Tipo de Control | Obligatorio | Validación | Valor por defecto |
    | :--- | :--- | :--- | :--- | :--- |
    | Campo Carné/Nombre | Campo de texto | Sí | Búsqueda rápida | Vacío |
    | Switch Excepción | Checkbox / Switch | No | Solo aplicable en miembros vencidos | false |
    | Botón Registrar | Botón | Sí | Ejecuta el check-in | "Registrar Ingreso" |
  * Estados:
    * Permitido: Pantalla destella en verde con el mensaje "Acceso Autorizado".
    * Denegado: Pantalla destella en rojo con el mensaje "Membresía Vencida".
    * Excepción: Muestra banner amarillo "Acceso Concedido por Excepción".
  * Endpoint consumido: `POST /api/access/check-in`
* **Diseño Técnico Backend:**
  * Endpoint: `POST /api/access/check-in`
  * Rol Autorizado: `RECEPCION_ADMIN`
  * Solicitud (Body):
    ```json
    {
      "cardNumber": "MEM-2026-0042",
      "allowException": false
    }
    ```
  * Respuesta de Éxito (`HTTP 201 Created`):
    ```json
    {
      "accessId": "99887766-5544-3322-1100-112233445566",
      "memberName": "Carlos Gómez",
      "result": "Permitido",
      "timestamp": "2026-10-28T09:30:00Z"
    }
    ```
  * Errores:
    * `HTTP 403`: Membresía vencida sin excepción activada.
    * `HTTP 404`: Carné no encontrado.
    * `HTTP 409`: Intento de check-in repetido en menos de 5 minutos.
  * **Modelos de Datos (ORM Prisma):**
    ```prisma
    model AccessLog {
      id         String       @id @default(uuid())
      memberId   String
      member     User         @relation(fields: [memberId], references: [id])
      result     AccessResult @default(Permitido)
      timestamp  DateTime     @default(now())
    }

    enum AccessResult {
      Permitido
      Excepcion
      Denegado
    }
    ```

---

### ÉPICA 5 (MÓDULO 5): PAGOS Y FACTURACIÓN
Permitir el cobro de membresías y servicios adicionales mediante una pasarela de pago simulada, garantizando el registro de transacciones, la emisión de comprobantes oficiales y la consulta de cobros pendientes sin almacenar datos sensibles de tarjetas.

#### H10. Generación de cobro y pago con comprobante
* **Encargado:** Steven Chen
* **Como** miembro,
* **Quiero** realizar el pago de mis cobros pendientes a través de la plataforma,
* **Para** mantener mis servicios activos y obtener un comprobante oficial.
* **Criterios de aceptación:**
  * El sistema toma el monto directamente del registro de `Charge` generado en estado PENDIENTE por renovaciones (H2) o agendamiento de sesiones (H8).
  * El miembro ingresa los datos de su tarjeta. El sistema simula un tiempo de espera de 2 segundos en la pasarela.
  * El sistema NUNCA almacena el número completo de la tarjeta ni el código de seguridad (CVV); únicamente guarda los últimos 4 dígitos y el mes/año de expiración.
  * Tarjetas terminadas en 4242 son Aprobadas (cambia el cobro a Pagado, activa el servicio y emite comprobante). Tarjetas terminadas en 0002 son Rechazadas, mostrando el motivo del rechazo en pantalla ("Fondos insuficientes / Tarjeta declinada") y manteniendo el cobro en estado Pendiente (respondiendo con código `HTTP 400 Bad Request`).
  * El comprobante oficial contiene: número correlativo único (generado mediante secuencia incremental con formato `REC-XXXXX` sin repetir), fecha y hora, concepto, monto pagado y los últimos 4 dígitos de la tarjeta.
  * El sistema bloquea mediante restricción de unicidad/estado en el backend un segundo pago sobre un cobro ya pagado, respondiendo `409 Conflict` incluso si se realizan peticiones concurrentes o dobles clics.
  * El sistema impide que un miembro intente pagar un cobro perteneciente a otro usuario, respondiendo `403 Forbidden`.
* **Diseño Técnico:**
  * Frontend: Vista "Mi Facturación / Pagos". Formulario de pasarela simulada con datos de prueba e impresión de comprobante, indicador visual de espera de 2 segundos, y sección de impresión/descarga de comprobante.
  * Ruta y Permisos: `/pagos/procesar`, accesible solo por rol `MIEMBRO`.
  * Estados de la Pantalla:
    * Cargando: Muestra indicador visual durante el retardo simulado de 2 segundos.
    * Error de validación: Mensajes debajo de cada campo con datos con formato inválido.
    * Error del servidor / rechazo: Notificación de tipo toast con el mensaje "Tarjeta declinada por la pasarela" o error `409`.
    * Éxito: Renderiza el comprobante de pago con el número `REC-XXXXX` y botón para imprimir/descargar.
  * Tabla de elementos de interfaz:
    | Nombre del elemento | Tipo de control | Obligatorio | Validación | Valor por defecto / Opciones |
    | :--- | :--- | :--- | :--- | :--- |
    | Nombre del Titular | Campo de texto | Sí | Longitud de 3 a 100 caracteres | Vacío |
    | Número de Tarjeta | Campo numérico | Sí | Exactamente 16 dígitos numéricos | Vacío |
    | Fecha de Expiración | Selector / Texto | Sí | Formato MM/YY, fecha no vencida | Vacío |
    | Código CVV | Campo numérico | Sí | Exactamente 3 o 4 dígitos | Vacío |
    | Pagar Ahora | Botón | No aplica | Se deshabilita durante el procesamiento | No aplica |
  * Backend: `POST /api/v1/payments/process`
    * Rol autorizado: `MIEMBRO`.
    * Contrato de Solicitud (Body):
      ```json
      {
        "chargeId": "uuid (obligatorio)",
        "cardNumber": "string (16 dígitos, obligatorio)",
        "expMonth": 12,
        "expYear": 2026,
        "cvv": "string (3-4 dígitos, obligatorio)"
      }
      ```
    * Contrato de Respuesta (`200 OK`):
      ```json
      {
        "receiptNumber": "REC-00001",
        "status": "PAGADO",
        "amount": 45.00,
        "date": "2026-10-29T16:00:00Z",
        "concept": "Renovación Membresía Mensual",
        "last4": "4242"
      }
      ```
    * Errores: `400 Bad Request` (pago rechazado / datos inválidos), `401 Unauthorized` (sin sesión activa), `403 Forbidden` (intento de pagar cobro ajeno), `409 Conflict` (cobro ya procesado previamente).

#### H11. Consulta de pagos pendientes
* **Encargado:** Steven Chen
* **Como** administrador / recepción,
* **Quiero** consultar la lista de cobros pendientes con filtros de fecha y miembro,
* **Para** realizar el seguimiento del flujo de caja e ingresos.
* **Criterios de aceptación:**
  * Muestra la lista de cobros pendientes ordenados por fecha de emisión descendente, con paginación (10 registros por página).
  * Permite filtrar los resultados por nombre/carné del miembro y por rango de fechas.
  * Muestra un mensaje cuando la búsqueda no devuelve cobros pendientes ("No hay pagos pendientes registrados").
  * El sistema rechaza el acceso a esta consulta a usuarios con rol `MIEMBRO` o `ENTRENADOR`, respondiendo con código `HTTP 403 Forbidden`.
* **Diseño Técnico:**
  * Frontend: Vista "Gestión de Cobros Pendientes". Tabla con paginador y filtros de búsqueda por miembro y calendario.
  * Ruta y Permisos: `/admin/cobros-pendientes`, accesible por `RECEPCION_ADMIN`.
  * Estados de la Pantalla:
    * Cargando: Spinner en la tabla mientras realiza la petición.
    * Vacío: Ilustración/mensaje "No hay pagos pendientes registrados".
    * Error: Alerta de error en la llamada a la API.
  * Backend: `GET /api/v1/charges/pending?memberId=str&startDate=date&endDate=date&page=1`
    * Rol Autorizado: `RECEPCION_ADMIN`
    * Parámetros de Consulta (Query Params): `memberId` (uuid, opcional), `startDate` (string ISO, opcional), `endDate` (string ISO, opcional), `page` (int, por defecto 1), `limit` (int, por defecto 10).
    * Contrato de Respuesta (`200 OK`):
      ```json
      {
        "data": [
          {
            "chargeId": "uuid",
            "memberName": "Steven Chen",
            "concept": "Membresía Plan Mensual",
            "amount": 35.00,
            "createdAt": "2026-10-28T10:00:00Z"
          }
        ],
        "total": 1,
        "page": 1,
        "totalPages": 1
      }
      ```
    * Errores: `401 Unauthorized` (sin sesión), `403 Forbidden` (rol Miembro o Entrenador).

---

### ÉPICA 6 (MÓDULO 6): PLANES DE ENTRENAMIENTO Y SEGUIMIENTO
Facilitar a los entrenadores la estructuración de rutinas de ejercicios para sus clientes activos y permitir a los miembros registrar y visualizar la evolución de su progreso corporal y marcas de fuerza a lo largo del tiempo.

#### H12. Asignación de rutina de ejercicios
* **Encargado:** Steven Chen
* **Como** entrenador,
* **Quiero** asignar y actualizar la rutina de ejercicios activa para mis miembros asignados,
* **Para** estructurar sus planes de entrenamiento personalizados.
* **Criterios de aceptación:**
  * El entrenador crea o actualiza la única rutina activa del miembro, indicando al menos 1 ejercicio. Cada ejercicio incluye un nombre (string de 3 a 50 caracteres), series ($>0$) y repeticiones ($>0$).
  * La rutina asignada se refleja para el miembro en la siguiente carga de su vista "Mi Rutina".
  * El sistema no permite asignar rutinas a miembros que no sean clientes activos del entrenador.
  * Se define como "cliente activo" del entrenador a aquel miembro que cuenta con al menos una sesión personal agendada o impartida previamente con dicho entrenador.
  * El sistema no permite asignar rutinas a miembros que no cumplan la relación de cliente activo con el entrenador (`403 Forbidden`).
* **Diseño Técnico:**
  * Frontend: Vista "Gestión de Rutinas". Creador de rutinas interactivo con validación de campos de texto y rangos numéricos.
  * Ruta y Permisos: `/entrenador/rutinas/asignar`, accesible solo por rol `ENTRENADOR`.
  * Estados de la Pantalla:
    * Vacío: Estado inicial antes de seleccionar cliente.
    * Éxito: Mensaje "Rutina asignada exitosamente".
    * Sin Permiso / Rechazo: Mensaje de error 403 cuando el miembro no es cliente activo.
  * Backend: `POST /api/v1/routines`
    * Rol Autorizado: `ENTRENADOR`
    * Contrato de Solicitud (Body):
      ```json
      {
        "memberId": "uuid (obligatorio)",
        "exercises": [
          {
            "name": "string (3-50 caracteres, obligatorio)",
            "series": 3,
            "reps": 10
          }
        ]
      }
      ```
    * Contrato de Respuesta (`201 Created`):
      ```json
      {
        "routineId": "uuid",
        "memberId": "uuid",
        "updatedAt": "2026-10-29T16:00:00Z"
      }
      ```
    * Errores: `400 Bad Request` (ejercicios inválidos o lista vacía), `401 Unauthorized` (sin sesión), `403 Forbidden` (el miembro no es cliente activo del entrenador).

#### H13. Registro de progreso físico y métricas
* **Encargado:** Steven Chen
* **Como** miembro,
* **Quiero** registrar periódicamente mis métricas corporales y marcas de fuerza,
* **Para** visualizar mi avance físico evolutivo en el tiempo.
* **Criterios de aceptación:**
  * El miembro registra la fecha (la cual no puede ser una fecha futura), peso en kg (válido entre 20.0 y 500.0 kg), medidas corporales en cm (cintura y pecho, válidas entre 30.0 y 300.0 cm) y marcas de fuerza (nombre del ejercicio, peso levantado en kg y repeticiones realizadas).
  * La pantalla presenta un gráfico con la evolución temporal de las métricas y la variación numérica respecto al registro anterior o base.
  * Si solo existe un registro inicial, la gráfica muestra el punto base y la diferencia como 0.0.
  * El sistema rechaza fechas futuras o valores numéricos fuera de rango con un código `400 Bad Request` y mensaje descriptivo.
* **Diseño Técnico:**
  * Frontend: Vista "Mi Progreso". Formulario con validaciones estrictas por rango y gráfico lineal evolutivo.
  * Ruta y Permisos: `/progreso/nuevo`, accesible solo por rol `MIEMBRO`.
  * Estados de la Pantalla:
    * Error de validación: Resalta en rojo los campos numéricos o fechas futuras.
    * Éxito: Redirecciona a la vista evolutiva mostrando el nuevo punto en el gráfico.
  * Backend: `POST /api/v1/progress`
    * Rol Autorizado: `MIEMBRO`
    * Contrato de Solicitud (Body):
      ```json
      {
        "date": "2026-10-29",
        "weight": 75.5,
        "waist": 82.0,
        "chest": 100.0,
        "strengthMarks": [
          {
            "exerciseName": "Press de Banca",
            "weightLifted": 80.0,
            "repetitions": 8
          }
        ]
      }
      ```
    * Contrato de Respuesta (`201 Created`):
      ```json
      {
        "progressId": "uuid",
        "memberId": "uuid",
        "date": "2026-10-29"
      }
      ```
    * Errores: `400 Bad Request` (fecha futura, métricas fuera de rango o valores $\le 0$), `401 Unauthorized` (sin sesión), `403 Forbidden` (intento de registrar para otro usuario).

---

### ÉPICA 7 (MÓDULO 7): CONTROL DE EQUIPO Y MANTENIMIENTO

#### H14. Administración de estados y mantenimiento de máquinas
* **Encargado:** Alejandro Orellana
* **Como** administrador,
* **Quiero** actualizar el estado del equipamiento (Operativa, En Mantenimiento, Fuera de Servicio),
* **Para** controlar la disponibilidad de las máquinas y mantener un historial de las intervenciones de mantenimiento.
* **Criterios de aceptación:**
  * El administrador actualiza el estado de una máquina seleccionando entre: Operativa, En Mantenimiento o Fuera de Servicio.
  * Transiciones permitidas:
    * Operativa $\rightarrow$ En Mantenimiento.
    * Operativa $\rightarrow$ Fuera de Servicio.
    * Fuera de Servicio $\rightarrow$ Operativa.
    * Fuera de Servicio $\rightarrow$ En Mantenimiento.
    * En Mantenimiento $\rightarrow$ Operativa.
  * El administrador puede mantener el estado actual de una máquina sin realizar cambios. En ese caso, no se registra una nueva entrada en el historial.
  * Se debe registrar un motivo al cambiar una máquina a "En mantenimiento" o "Fuera de servicio". Este campo no puede quedar en blanco.
  * Se conserva un historial completo de cambios de estado e intervenciones de mantenimiento de cada máquina.
  * Cada cambio de estado genera un registro histórico que contiene: Identificador de la máquina, Estado anterior, Estado nuevo, Motivo del cambio (cuando corresponda), Identificador del usuario que realizó el cambio, Fecha y hora del cambio.
  * El historial conserva todos los cambios registrados y no permite modificar ni eliminar entradas anteriores mediante las operaciones habituales de administración.
  * Solo los usuarios con rol de administrador pueden modificar los estados de las máquinas.
  * Los cambios de estado y sus registros históricos se guardan de forma atómica. Si falla el registro del historial, el cambio de estado tampoco se aplica.
* **Diseño Técnico:**
  * Frontend:
    | Elemento | Tipo de Control | Obligatorio | Validación | Opciones |
    | :--- | :--- | :--- | :--- | :--- |
    | Listado de Máquinas | Tabla/Grid | Sí | Muestra nombre, ID, estado actual y botón de acción. | Lista cargada desde el backend. |
    | Selector de Estado | Dropdown / Select | Sí | Valores permitidos: Operativa, En Mantenimiento, Fuera de Servicio. | Estado actual de la máquina. |
    | Modal de Motivo / Botón Guardar | Diálogo (Modal) / Botón | No / Sí | Obligatorio si el nuevo estado es En Mantenimiento o Fuera de Servicio. Mínimo 5 caracteres, máximo 255. Deshabilitado si no hay cambios o si falta el motivo. | Vacío ("") / Deshabilitado |
  * Backend: `PATCH /api/equipment/:id/status`
    * Autenticación: Requerida
    * Autorización: Recepción / Administrador
    * Cuerpo de la Petición:
      ```json
      {
        "status": "En Mantenimiento",
        "reason": "Reparación de cable de acero en polea principal."
      }
      ```
    * Contrato de Respuesta (`200 OK`):
      ```json
      {
        "equipmentId": "eq_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "previousStatus": "Operativa",
        "newStatus": "En Mantenimiento",
        "reason": "Reparación de cable de acero en polea principal.",
        "updatedBy": "usr_firebase_uid_12345",
        "updatedAt": "2026-10-29T19:30:00.000Z"
      }
      ```
    * Códigos de error: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`.

#### H15. Consulta de disponibilidad de maquinaria
* **Encargado:** Alejandro Orellana
* **Como** usuario autenticado (administrador, entrenador o miembro),
* **Quiero** consultar el estado de las máquinas antes o durante mi visita,
* **Para** conocer la disponibilidad del equipo.
* **Criterios de aceptación:**
  * El listado de máquinas está disponible para los tres roles autenticados: administrador, entrenador y miembro.
  * Cada máquina muestra su nombre, estado actual (Operativa, En Mantenimiento o Fuera de Servicio) y motivo cuando se encuentra en un estado distinto de Operativa.
  * El sistema permite filtrar las máquinas por estado. Si no existen equipos en el estado seleccionado, muestra el mensaje: "No se encontraron equipos en esta categoría".
  * Las máquinas se muestran ordenadas alfabéticamente por nombre, de forma ascendente. El orden se mantiene al aplicar filtros.
  * Los cambios de estado realizados por un administrador se reflejan en la vista de consulta en menos de un minuto.
  * Los usuarios con rol de miembro o entrenador no pueden modificar el estado de las máquinas. Si intentan realizar una modificación mediante una solicitud directa al backend, el sistema responde con `403 Forbidden`.
  * Cuando una máquina vuelve al estado Operativa, deja de mostrarse como no disponible y el motivo del último cambio no se presenta como un motivo de indisponibilidad vigente.
* **Diseño Técnico:**
  * Frontend:
    | Elemento | Tipo de Control | Validación / Obligatorio | Opciones |
    | :--- | :--- | :--- | :--- |
    | Filtro por Estado / Tarjetas de Equipos | Dropdown / Tabs / Grid / Cards | No / Sí | Opciones: Todos, Operativa, En Mantenimiento, Fuera de Servicio. Muestra nombre, categoría, estado actual y etiqueta con el motivo (si aplica). |
  * Backend: `GET /api/equipment`
    * Autenticación: Requerida
    * Autorización: Accesible para todos los roles autenticados (`ADMINISTRADOR`, `ENTRENADOR`, `MIEMBRO`).
    * Parámetros de Consulta (Query Params): `status` (string, opcional).
    * Contrato de Respuesta (`200 OK`):
      ```json
      {
        "data": [
          {
            "id": "eq_uuid_1",
            "name": "Prensa de Pecho",
            "category": "Fuerza",
            "status": "Operativa",
            "reason": null
          }
        ]
      }
      ```
    * Códigos de Error: `401 Unauthorized`, `400 Bad Request`.

---

### ÉPICA 8 (MÓDULO 8): RESEÑAS Y CALIFICACIONES

#### H16. Calificación de clases y sesiones impartidas
* **Encargado:** Alejandro Orellana
* **Como** miembro,
* **Quiero** calificar las clases grupales y sesiones personales en las que he participado,
* **Para** proporcionar retroalimentación sobre el servicio recibido.
* **Criterios de aceptación:**
  * El miembro solo puede calificar clases o sesiones personales que hayan finalizado y en las que cumpla la regla de asistencia. La reserva, por sí sola, no se considera prueba suficiente de asistencia.
  * La calificación debe registrarse dentro de un plazo máximo de 7 días naturales desde la finalización de la clase o sesión. Una vez vencido el plazo, el sistema rechaza nuevos intentos.
  * La calificación consta de un puntaje entero de 1 a 5 estrellas y un comentario opcional de hasta 300 caracteres.
  * Cada miembro puede registrar como máximo una calificación por clase o sesión en la que cumpla los requisitos. Si intenta registrar una segunda, el sistema rechaza la operación.
* **Diseño Técnico:**
  * Frontend:
    | Elemento | Tipo de Control | Obligatorio | Validación | Opciones |
    | :--- | :--- | :--- | :--- | :--- |
    | Listado de Clases/Sesiones | Tarjetas / Grid | Sí | Muestra nombre, entrenador, fecha y botón "Calificar" (si cumple asistencia). | Lista cargada del backend. |
    | Selector de Estrellas | Componente de Puntuación (1-5) | Sí | Rango entero estricto de 1 a 5 estrellas. | Vacío (0 estrellas) |
    | Comentario | Textarea | No | Máximo 300 caracteres con contador en tiempo real. | Vacío ("") |
    | Botón Enviar Reseña | Botón de Acción | Sí | Deshabilitado si no hay estrellas o excede 300 caracteres. | Deshabilitado |
  * Backend: `POST /api/reviews`
    * Autenticación: Requerida | Autorización: `MIEMBRO`
    * Contrato de Solicitud (Body):
      ```json
      {
        "sessionId": "ses_uuid_12345",
        "rating": 5,
        "comment": "Excelente clase, muy dinámica y exigente."
      }
      ```
    * Contrato de Respuesta (`201 Created`):
      ```json
      {
        "reviewId": "rev_uuid_98765",
        "sessionId": "ses_uuid_12345",
        "rating": 5,
        "createdAt": "2026-10-29T20:00:00.000Z"
      }
      ```
    * Errores: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `409 Conflict`.

#### H17. Reporte de promedios de calificación
* **Encargado:** Alejandro Orellana
* **Como** administrador,
* **Quiero** consultar los promedios de calificación por entrenador y por clase,
* **Para** evaluar la calidad de las actividades impartidas y la satisfacción de los miembros.
* **Criterios de aceptación:**
  * El sistema presenta los resultados agrupados por entrenador y por clase, mostrando promedio con una cifra decimal y número total de reseñas.
  * El promedio de un entrenador incluye clases grupales y sesiones personales impartidas en el período seleccionado.
  * Permite filtrar por rango de fechas, clase y entrenador.
  * Si no hay reseñas, muestra el texto "Sin calificaciones" y total de cero reseñas.
  * Disponible únicamente para rol `ADMINISTRADOR`.
* **Diseño Técnico:**
  * Backend: `GET /api/reviews/analytics`
    * Parámetros: `startDate`, `endDate`, `trainerId`, `classId`.
    * Contrato de Respuesta (`200 OK`):
      ```json
      {
        "data": [
          {
            "targetType": "TRAINER",
            "targetId": "usr_trainer_uuid_1",
            "targetName": "Carlos Mendoza",
            "average": 4.8,
            "totalReviews": 25
          }
        ]
      }
      ```
    * Errores: `401 Unauthorized`, `403 Forbidden`, `400 Bad Request`.

---

### ÉPICA 9 (MÓDULO 9 NUEVO): SERVICIO CENTRALIZADO DE NOTIFICACIONES

#### H18. Servicio interno de envío de notificaciones
* **Encargado:** Jonathan Rodrigo Rivera Jiménez
* **Como** Módulo del Sistema,
* **Quiero** disponer de un endpoint centralizado de registro de notificaciones,
* **Para** emitir avisos de vencimientos, cancelaciones o cobros sin duplicar lógica de envío.
* **Criterios de Aceptación:**
  1. Recibe: `recipientId`, `title` (max 100), `message` (max 500), `sourceModule` (`MEMBRESIA`, `CLASES`, `PAGOS`, `EQUIPAMIENTO`) y `referenceId` (opcional).
  2. Persiste la notificación con estado No leída y fecha/hora actual.
  3. Valida la existencia del destinatario (`404 Not Found` si no existe).
* **Diseño Técnico Backend:**
  * Endpoint: `POST /api/notifications/send`
  * Solicitud (Body):
    ```json
    {
      "recipientId": "c39a3f28-3b32-473d-9b0d-e2d93132bb82",
      "title": "Clase Cancelada",
      "message": "La clase de Yoga del 05/11 ha sido cancelada por el entrenador.",
      "sourceModule": "CLASES",
      "referenceId": "b11a2f33-1122-4433-8899-001122334455"
    }
    ```
  * Respuesta de Éxito (`HTTP 201 Created`):
    ```json
    {
      "notificationId": "77665544-3322-1100-0011-223344556677",
      "timestamp": "2026-10-28T09:50:00Z"
    }
    ```

#### H19. Centro de notificaciones del miembro
* **Encargado:** Jonathan Rodrigo Rivera Jiménez
* **Como** Miembro,
* **Quiero** consultar mi bandeja de notificaciones personales y marcarlas como leídas,
* **Para** estar enterado de los avisos importantes emitidos por el gimnasio.
* **Criterios de Aceptación:**
  1. Muestra la lista de notificaciones ordenadas de más reciente a más antigua con paginación (10 ítems) y badge de no leídas.
  2. El usuario puede marcar individuales o todas como leídas.
  3. Restricción de acceso a notificaciones ajenas (`403 Forbidden`).
* **Diseño Técnico Backend:**
  * Endpoints:
    * `GET /api/notifications/me?page=1`
    * `PATCH /api/notifications/:id/read`
  * Modelos de Datos (ORM Prisma):
    ```prisma
    model Notification {
      id            String             @id @default(uuid())
      recipientId   String
      recipient     User               @relation(fields: [recipientId], references: [id])
      title         String
      message       String
      sourceModule  NotificationSource
      referenceId   String?
      isRead        Boolean            @default(false)
      createdAt     DateTime           @default(now())
    }

    enum NotificationSource {
      MEMBRESIA
      CLASES
      PAGOS
      EQUIPAMIENTO
    }
    ```

---

### ÉPICA 10 (MÓDULO 10): REPORTES Y ANALÍTICA ADMINISTRATIVA

#### H20. Reporte de ocupación de clases
* **Encargado:** Gerson Majano
* **Como** administrador,
* **Quiero** generar un reporte con el porcentaje de ocupación de cada clase grupal,
* **Para** tomar decisiones de reprogramación o ajuste de oferta.
* **Criterios de aceptación:**
  * Muestra porcentaje calculado como: $(\text{reservas} / \text{cupo máximo}) \times 100$ con 1 decimal.
  * Ordena de mayor a menor porcentaje, desempatando por menor cantidad de cupos reservados.
  * Si no hay datos, muestra "No hay datos de clases para el rango seleccionado".
* **Diseño Técnico:**
  * Backend: `GET /reports/occupancy?startDate=date&endDate=date`
  * Respuesta `200 OK`: `{"data": [{"className": "str", "occupancyPercentage": 85.5}]}`
  * Errores: `400 Bad Request`, `403 Forbidden`.

#### H21. Reporte de ingresos y tasa de renovación
* **Encargado:** Gerson Majano
* **Como** administrador,
* **Quiero** visualizar los ingresos totales y el porcentaje de renovación de membresías,
* **Para** evaluar la salud financiera y retención de clientes del gimnasio.
* **Criterios de aceptación:**
  * Calcula ingresos sumando cobros en estado `Pagado` en el rango de fechas.
  * Calcula tasa de renovación como: $(\text{membresías renovadas} / \text{membresías vencidas en el período}) \times 100$ con 1 decimal. Se considera renovada si el pago ocurrió dentro de los 30 días posteriores al vencimiento.
  * Si la fecha inicial es posterior a la final, bloquea y muestra error.
* **Diseño Técnico:**
  * Backend: `GET /reports/financial?startDate=date&endDate=date`
  * Respuesta `200 OK`: `{"totalRevenue": 12450.00, "renovationRate": 78.4}`
  * Errores: `400 Bad Request`, `403 Forbidden`.