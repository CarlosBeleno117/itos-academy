const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connection = require('./db');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// =========================
// CONFIGURACIÓN DE UPLOADS
// =========================
const uploadsPath = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
}

app.use('/uploads', express.static(uploadsPath));

// =========================
// CONFIGURACIÓN DE MULTER
// =========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + '-' + file.originalname.replace(/\s+/g, '-');

    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF o videos.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
  },
});

// =========================
// CONFIGURACIÓN DE CSV
// =========================
const csvUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const esCsv =
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.toLowerCase().endsWith('.csv');

    if (esCsv) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV.'), false);
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
  },
});

/**
 * @swagger
 * tags:
 *   - name: Autenticación
 *     description: Inicio y control de sesión de usuarios
 *   - name: Perfil
 *     description: Consulta y autogestión básica del perfil del usuario autenticado
 *   - name: Dashboard
 *     description: Indicadores, filtros y visualizaciones del panel principal
 *   - name: Usuarios
 *     description: Gestión y consulta de usuarios
 *   - name: Cursos
 *     description: Gestión, consulta, asignación y desasignación de cursos
 *   - name: Avances
 *     description: Seguimiento del avance de capacitación
 *   - name: Materiales
 *     description: Consulta y carga de materiales PDF o video
 *   - name: Evaluaciones
 *     description: Consulta y presentación de evaluaciones
 *   - name: Preguntas
 *     description: Creación, edición, activación, inactivación y carga masiva de preguntas de evaluación
 * 
 */

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Iniciar sesión en la plataforma
 *     tags: [Autenticación]
 *     description: >
 *       Valida el correo y la contraseña del usuario. Si las credenciales son correctas,
 *       retorna la información básica del usuario autenticado sin exponer el password_hash.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - password
 *             properties:
 *               correo:
 *                 type: string
 *                 example: carlos@itos.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *       400:
 *         description: Correo o contraseña no enviados
 *       401:
 *         description: Credenciales inválidas o usuario inactivo
 *       500:
 *         description: Error interno al iniciar sesión
 */

/**
 * @swagger
 * /api/perfil/{id}:
 *   patch:
 *     summary: Actualizar información básica del perfil propio
 *     tags: [Perfil]
 *     description: >
 *       Permite que un usuario autenticado actualice datos básicos permitidos de su propio perfil.
 *       En esta versión solo se permite actualizar el país. El usuario no puede modificar rol,
 *       área, cargo, estado ni correo desde esta ruta.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario cuyo perfil será actualizado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pais
 *               - actualizado_por
 *             properties:
 *               pais:
 *                 type: string
 *                 example: Colombia
 *                 description: País actualizado del usuario
 *               actualizado_por:
 *                 type: integer
 *                 example: 5
 *                 description: ID del usuario que realiza la actualización. Debe coincidir con el ID del path.
 *     responses:
 *       200:
 *         description: Perfil actualizado correctamente
 *       400:
 *         description: Datos incompletos o país inválido
 *       403:
 *         description: El usuario intenta actualizar un perfil que no le pertenece
 *       404:
 *         description: Usuario no encontrado o inactivo
 *       500:
 *         description: Error interno al actualizar el perfil
 */

/**
 * @swagger
 * /api/perfil/{id}/password:
 *   patch:
 *     summary: Cambiar contraseña del usuario autenticado
 *     tags: [Perfil]
 *     description: >
 *       Permite cambiar la contraseña propia del usuario autenticado. Para realizar el cambio
 *       se valida la contraseña actual con bcrypt y se almacena la nueva contraseña cifrada.
 *       El usuario solo puede cambiar su propia contraseña.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario que cambiará su contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password_actual
 *               - password_nueva
 *               - actualizado_por
 *             properties:
 *               password_actual:
 *                 type: string
 *                 example: 123456
 *                 description: Contraseña actual del usuario
 *               password_nueva:
 *                 type: string
 *                 example: nuevaClave123
 *                 description: Nueva contraseña del usuario
 *               actualizado_por:
 *                 type: integer
 *                 example: 5
 *                 description: ID del usuario que realiza el cambio. Debe coincidir con el ID del path.
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente
 *       400:
 *         description: Datos incompletos o nueva contraseña inválida
 *       401:
 *         description: La contraseña actual no es correcta
 *       403:
 *         description: El usuario intenta cambiar una contraseña que no le pertenece
 *       404:
 *         description: Usuario no encontrado o inactivo
 *       500:
 *         description: Error interno al cambiar la contraseña
 */

/**
 * @swagger
 * /api/dashboard/resumen/{usuarioId}:
 *   get:
 *     summary: Consultar resumen del dashboard
 *     tags: [Dashboard]
 *     description: >
 *       Consulta los indicadores, gráficos y resumen de avance del dashboard.
 *       El parámetro usuarioId puede ser un ID numérico de usuario o el valor "all"
 *       para consultar una vista consolidada, según los permisos del usuario que consulta.
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           oneOf:
 *             - type: integer
 *             - type: string
 *               example: all
 *         description: ID del usuario consultado o "all" para vista consolidada
 *       - in: query
 *         name: viewerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario que está consultando el dashboard
 *       - in: query
 *         name: area
 *         required: false
 *         schema:
 *           type: string
 *           example: BPO
 *         description: Área utilizada como filtro. Puede enviarse "all" para consultar todas las áreas permitidas.
 *     responses:
 *       200:
 *         description: Resumen de indicadores y gráficos del dashboard
 *       400:
 *         description: Parámetros incompletos o área inválida
 *       403:
 *         description: Usuario sin permisos para consultar la información solicitada
 *       404:
 *         description: Usuario consultante o usuario consultado no encontrado
 *       500:
 *         description: Error interno al consultar el dashboard
 */

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Consultar usuarios registrados
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de usuarios registrada en la base de datos
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * /api/usuarios/visibles:
 *   get:
 *     summary: Consultar usuarios visibles según el rol del usuario activo
 *     tags: [Usuarios]
 *     description: >
 *       Consulta los usuarios visibles para el usuario autenticado según su rol.
 *       Super Admin y Admin pueden ver usuarios administrativos y operativos según permisos.
 *       Supervisor solo puede ver empleados de su área. Empleado solo puede ver su propio perfil,
 *       aunque normalmente no accede al módulo administrativo de usuarios desde el front-end.
 *     parameters:
 *       - in: query
 *         name: viewerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario que realiza la consulta
 *     responses:
 *       200:
 *         description: Lista de usuarios visibles para el usuario consultante
 *       400:
 *         description: No se envió el usuario consultante
 *       404:
 *         description: Usuario consultante no encontrado o inactivo
 *       500:
 *         description: Error interno al consultar usuarios visibles
 */

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - correo
 *               - password
 *               - rol
 *               - area
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: María Torres
 *               correo:
 *                 type: string
 *                 example: maria.torres@itos.com
 *               password:
 *                 type: string
 *                 example: 123456
 *               rol:
 *                 type: string
 *                 example: Empleado
 *               area:
 *                 type: string
 *                 example: Billing
 *               cargo:
 *                 type: string
 *                 example: Analista Billing
 *               pais:
 *                 type: string
 *                 example: Colombia
 *               estado:
 *                 type: string
 *                 example: Activo
 *               fecha_ingreso:
 *                 type: string
 *                 example: 2026-05-21
 *     responses:
 *       201:
 *         description: Usuario creado correctamente
 *       400:
 *         description: Datos incompletos, rol inválido, área inválida o correo duplicado
 *       500:
 *         description: Error interno al crear el usuario
 */

/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Editar un usuario existente
 *     tags: [Usuarios]
 *     description: >
 *       Permite editar información administrativa de un usuario. Super Admin puede editar todos los usuarios.
 *       Admin puede editar usuarios excepto Super Admin y no puede asignar el rol Super Admin.
 *       Supervisor solo puede editar empleados de su propia área y mantenerlos como empleados de esa área.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario que se desea editar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - correo
 *               - rol
 *               - area
 *               - estado
 *               - actualizado_por
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: María Torres
 *               correo:
 *                 type: string
 *                 example: maria.torres@itos.com
 *               rol:
 *                 type: string
 *                 example: Empleado
 *               area:
 *                 type: string
 *                 example: BPO
 *               cargo:
 *                 type: string
 *                 example: Analista de Operaciones
 *               pais:
 *                 type: string
 *                 example: Colombia
 *               estado:
 *                 type: string
 *                 example: Activo
 *               actualizado_por:
 *                 type: integer
 *                 example: 1
 *                 description: ID del usuario que realiza la edición
 *     responses:
 *       200:
 *         description: Usuario actualizado correctamente
 *       400:
 *         description: Datos incompletos, rol inválido, área inválida, estado inválido o correo duplicado
 *       403:
 *         description: Usuario sin permisos para editar
 *       404:
 *         description: Usuario editor o usuario editado no encontrado
 *       500:
 *         description: Error interno al actualizar el usuario
 */

/**
 * @swagger
 * /api/usuarios/{id}/estado:
 *   patch:
 *     summary: Activar o inactivar un usuario
 *     tags: [Usuarios]
 *     description: >
 *       Permite cambiar el estado de un usuario entre Activo e Inactivo. 
 *       Super Admin puede gestionar todos los usuarios. Admin no puede inactivar Super Admin.
 *       Supervisor solo puede activar o inactivar empleados de su propia área.
 *       No se permite que un usuario inactive su propio usuario activo.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario cuyo estado será actualizado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estado
 *               - actualizado_por
 *             properties:
 *               estado:
 *                 type: string
 *                 example: Inactivo
 *                 description: Nuevo estado del usuario. Valores permitidos: Activo o Inactivo.
 *               actualizado_por:
 *                 type: integer
 *                 example: 1
 *                 description: ID del usuario que realiza el cambio de estado
 *     responses:
 *       200:
 *         description: Estado del usuario actualizado correctamente
 *       400:
 *         description: Datos incompletos, estado inválido o intento de inactivarse a sí mismo
 *       403:
 *         description: Usuario sin permisos para cambiar el estado
 *       404:
 *         description: Usuario editor o usuario consultado no encontrado
 *       500:
 *         description: Error interno al actualizar el estado del usuario
 */

/**
 * @swagger
 * /api/cursos:
 *   get:
 *     summary: Consultar cursos visibles según el rol del usuario
 *     tags: [Cursos]
 *     description: >
 *       Consulta los cursos visibles para el usuario que realiza la petición.
 *       Super Admin y Admin pueden ver todos los cursos; Supervisor solo cursos de su área;
 *       Empleado solo cursos que tenga asignados en la tabla de avances.
 *     parameters:
 *       - in: query
 *         name: viewerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario que consulta los cursos
 *     responses:
 *       200:
 *         description: Lista de cursos visibles para el usuario consultante
 *       400:
 *         description: No se envió el usuario consultante
 *       404:
 *         description: Usuario consultante no encontrado o inactivo
 *       500:
 *         description: Error interno al consultar los cursos
 */

/**
 * @swagger
 * /api/cursos:
 *   post:
 *     summary: Crear un nuevo curso
 *     tags: [Cursos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - descripcion
 *               - area
 *               - duracion_horas
 *               - creado_por
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: Capacitación inicial de Billing
 *               descripcion:
 *                 type: string
 *                 example: Curso para conocer el proceso básico de gestión de casos Billing.
 *               area:
 *                 type: string
 *                 example: Billing
 *               duracion_horas:
 *                 type: number
 *                 example: 3
 *               responsable_id:
 *                 type: integer
 *                 example: 2
 *               estado:
 *                 type: string
 *                 example: Disponible
 *               creado_por:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Curso creado correctamente
 *       400:
 *         description: Datos inválidos o incompletos
 *       403:
 *         description: Usuario sin permisos para crear el curso
 *       404:
 *         description: Usuario creador o responsable no encontrado
 *       500:
 *         description: Error interno al crear el curso
 */

/**
 * @swagger
 * /api/cursos/{id}:
 *   get:
 *     summary: Consultar un curso por ID
 *     tags: [Cursos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del curso
 *     responses:
 *       200:
 *         description: Información del curso consultado
 *       404:
 *         description: Curso no encontrado
 *       500:
 *         description: Error interno al consultar el curso
 */

/**
 * @swagger
 * /api/cursos/{cursoId}/asignar:
 *   post:
 *     summary: Asignar un curso a un usuario
 *     tags: [Cursos]
 *     description: >
 *       Asigna un curso disponible a un usuario activo creando un registro inicial
 *       en la tabla de avances con porcentaje 0 y estado Pendiente.
 *       Super Admin y Admin pueden asignar a cualquier usuario activo.
 *       Supervisor solo puede asignar cursos de su área a empleados de su misma área.
 *     parameters:
 *       - in: path
 *         name: cursoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del curso que se desea asignar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usuario_id
 *               - asignado_por
 *             properties:
 *               usuario_id:
 *                 type: integer
 *                 example: 5
 *                 description: ID del usuario que recibirá el curso
 *               asignado_por:
 *                 type: integer
 *                 example: 1
 *                 description: ID del usuario que realiza la asignación
 *     responses:
 *       201:
 *         description: Curso asignado correctamente
 *       400:
 *         description: Datos incompletos, curso no disponible o asignación duplicada
 *       403:
 *         description: Usuario sin permisos para asignar el curso
 *       404:
 *         description: Curso, usuario asignador o usuario asignado no encontrado
 *       500:
 *         description: Error interno al asignar el curso
 */

/**
 * @swagger
 * /api/cursos/{cursoId}/asignados:
 *   get:
 *     summary: Consultar usuarios asignados a un curso
 *     tags: [Cursos]
 *     description: >
 *       Consulta los usuarios asignados a un curso, junto con su porcentaje de avance,
 *       estado, área y datos básicos. Super Admin y Admin pueden ver los asignados
 *       de cualquier curso. Supervisor solo puede ver asignaciones de cursos de su área.
 *     parameters:
 *       - in: path
 *         name: cursoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del curso consultado
 *       - in: query
 *         name: viewerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario que consulta las asignaciones
 *     responses:
 *       200:
 *         description: Lista de usuarios asignados al curso
 *       400:
 *         description: No se envió el usuario consultante
 *       403:
 *         description: Usuario sin permisos para consultar asignaciones del curso
 *       404:
 *         description: Curso o usuario consultante no encontrado
 *       500:
 *         description: Error interno al consultar usuarios asignados
 */

/**
 * @swagger
 * /api/cursos/{cursoId}/aprendizaje:
 *   get:
 *     summary: Consultar materiales de aprendizaje de un curso con progreso del usuario
 *     tags: [Cursos]
 *     description: >
 *       Consulta los materiales asociados a un curso asignado al usuario, indicando cuáles
 *       materiales ya fueron completados, el porcentaje de avance de materiales y el
 *       siguiente material pendiente. Esta ruta permite soportar la experiencia de
 *       "Empezar curso" o "Continuar curso".
 *     parameters:
 *       - in: path
 *         name: cursoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del curso consultado
 *       - in: query
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario que está tomando el curso
 *     responses:
 *       200:
 *         description: Materiales del curso consultados correctamente con su progreso
 *       400:
 *         description: No se envió el usuario que inicia el curso
 *       403:
 *         description: El curso no está asignado al usuario
 *       500:
 *         description: Error interno al consultar los materiales del curso
 */

/**
 * @swagger
 * /api/materiales/{materialId}/completar:
 *   post:
 *     summary: Marcar un material como completado
 *     tags: [Materiales]
 *     description: >
 *       Marca un material específico como completado para un usuario dentro de un curso.
 *       Si todos los materiales del curso quedan completados, actualiza el avance del curso
 *       a mínimo 50%, cambia el estado a En progreso y marca materiales_revisados como TRUE.
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del material que se marcará como completado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usuario_id
 *               - curso_id
 *             properties:
 *               usuario_id:
 *                 type: integer
 *                 example: 5
 *                 description: ID del usuario que está completando el material
 *               curso_id:
 *                 type: integer
 *                 example: 1
 *                 description: ID del curso al que pertenece el material
 *     responses:
 *       200:
 *         description: Material marcado como completado correctamente
 *       400:
 *         description: Datos incompletos
 *       403:
 *         description: El curso no está asignado al usuario
 *       404:
 *         description: El material no existe o no pertenece al curso seleccionado
 *       500:
 *         description: Error interno al guardar el progreso del material
 */

/**
 * @swagger
 * /api/materiales/{materialId}/estado:
 *   patch:
 *     summary: Activar o inactivar material de un curso
 *     tags: [Materiales]
 *     description: >
 *       Permite cambiar el estado de un material a Activo o Inactivo. Esta ruta se usa
 *       principalmente para eliminar visualmente un material del curso sin borrar
 *       físicamente el archivo del servidor. Los materiales inactivos dejan de mostrarse
 *       en el detalle del curso y en el modal de aprendizaje.
 *       Super Admin y Admin pueden cambiar el estado de cualquier material. Supervisor
 *       solo puede cambiar materiales de cursos de su propia área. Empleado no tiene permisos.
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del material que será actualizado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estado
 *               - actualizado_por
 *             properties:
 *               estado:
 *                 type: string
 *                 example: Inactivo
 *                 description: Estado del material. Valores permitidos: Activo o Inactivo.
 *               actualizado_por:
 *                 type: integer
 *                 example: 1
 *                 description: ID del usuario que actualiza el estado del material
 *     responses:
 *       200:
 *         description: Estado del material actualizado correctamente
 *       400:
 *         description: Datos incompletos o estado inválido
 *       403:
 *         description: Usuario sin permisos para actualizar el material
 *       404:
 *         description: Usuario o material no encontrado
 *       500:
 *         description: Error interno al actualizar el material
 */

/**
 * @swagger
 * /api/cursos/{cursoId}/asignar/{usuarioId}:
 *   delete:
 *     summary: Desasignar un curso a un usuario
 *     tags: [Cursos]
 *     description: >
 *       Elimina la asignación de un curso a un usuario cuando aún no ha presentado evaluación
 *       y el curso no está completado. Super Admin y Admin pueden desasignar según sus permisos.
 *       Supervisor solo puede desasignar empleados de su misma área en cursos de su área.
 *     parameters:
 *       - in: path
 *         name: cursoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del curso que se desea desasignar
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario al que se desea desasignar el curso
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eliminado_por
 *             properties:
 *               eliminado_por:
 *                 type: integer
 *                 example: 1
 *                 description: ID del usuario que realiza la desasignación
 *     responses:
 *       200:
 *         description: Curso desasignado correctamente
 *       400:
 *         description: Datos incompletos o curso con evaluación presentada/completada
 *       403:
 *         description: Usuario sin permisos para desasignar el curso
 *       404:
 *         description: Asignación o usuario no encontrado
 *       500:
 *         description: Error interno al desasignar el curso
 */

/**
 * @swagger
 * /api/cursos/{id}:
 *   put:
 *     summary: Editar un curso existente
 *     tags: [Cursos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del curso
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - descripcion
 *               - area
 *               - duracion_horas
 *               - actualizado_por
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: Capacitación actualizada de Billing
 *               descripcion:
 *                 type: string
 *                 example: Curso actualizado para reforzar el manejo de casos Billing.
 *               area:
 *                 type: string
 *                 example: Billing
 *               duracion_horas:
 *                 type: number
 *                 example: 3
 *               responsable_id:
 *                 type: integer
 *                 example: 2
 *               estado:
 *                 type: string
 *                 example: Disponible
 *               actualizado_por:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Curso actualizado correctamente
 *       400:
 *         description: Datos inválidos o incompletos
 *       403:
 *         description: Usuario sin permisos para editar el curso
 *       404:
 *         description: Curso, usuario o responsable no encontrado
 *       500:
 *         description: Error interno al actualizar el curso
 */


/**
 * @swagger
 * /api/avances/usuario/{usuarioId}:
 *   get:
 *     summary: Consultar avances de un usuario específico
 *     tags: [Avances]
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Lista de avances del usuario
 *       500:
 *         description: Error interno al consultar los avances
 */

/**
 * @swagger
 * /api/avances/materiales-revisados:
 *   post:
 *     summary: Marcar materiales como revisados
 *     tags: [Avances]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuario_id:
 *                 type: integer
 *                 example: 5
 *               curso_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Materiales marcados como revisados
 *       400:
 *         description: Datos incompletos
 *       500:
 *         description: Error interno al actualizar el avance
 */

/**
 * @swagger
 * /api/avances/visibles:
 *   get:
 *     summary: Consultar avances visibles según el rol del usuario activo
 *     tags: [Avances]
 *     description: >
 *       Consulta los avances visibles para el usuario consultante. Super Admin y Admin
 *       pueden ver todos los avances. Supervisor puede ver sus propios avances y los
 *       avances de empleados de su área. Empleado solo puede ver sus propios avances.
 *     parameters:
 *       - in: query
 *         name: viewerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario que consulta los avances
 *     responses:
 *       200:
 *         description: Lista de avances visibles para el usuario consultante
 *       400:
 *         description: No se envió el usuario consultante
 *       404:
 *         description: Usuario consultante no encontrado o inactivo
 *       500:
 *         description: Error interno al consultar los avances visibles
 */

/**
 * @swagger
 * /api/avances/{avanceId}/habilitar-reintento:
 *   patch:
 *     summary: Habilitar reintento de evaluación
 *     tags: [Avances]
 *     description: >
 *       Permite habilitar un nuevo intento de evaluación para un usuario que no aprobó
 *       la evaluación de un curso. Solo puede habilitarse cuando el avance se encuentra
 *       en estado "Evaluacion no aprobada". Super Admin y Admin pueden habilitar
 *       cualquier reintento. Supervisor solo puede habilitar reintentos de empleados
 *       de su misma área.
 *     parameters:
 *       - in: path
 *         name: avanceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del avance al cual se le habilitará el reintento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - habilitado_por
 *             properties:
 *               habilitado_por:
 *                 type: integer
 *                 example: 1
 *                 description: ID del usuario que habilita el nuevo intento
 *     responses:
 *       200:
 *         description: Reintento de evaluación habilitado correctamente
 *       400:
 *         description: Datos incompletos, reintento ya habilitado o avance no apto para reintento
 *       403:
 *         description: Usuario sin permisos para habilitar el reintento
 *       404:
 *         description: Usuario habilitador o avance no encontrado
 *       500:
 *         description: Error interno al habilitar el reintento
 */

/**
 * @swagger
 * /api/materiales/{cursoId}:
 *   get:
 *     summary: Consultar materiales de un curso
 *     tags: [Materiales]
 *     parameters:
 *       - in: path
 *         name: cursoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del curso
 *     responses:
 *       200:
 *         description: Lista de materiales asociados al curso
 *       500:
 *         description: Error interno al consultar los materiales
 */

/**
 * @swagger
 * /api/materiales/{cursoId}:
 *   post:
 *     summary: Subir un material PDF o video a un curso
 *     tags: [Materiales]
 *     parameters:
 *       - in: path
 *         name: cursoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del curso
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: Manual de capacitación
 *               descripcion:
 *                 type: string
 *                 example: Material de apoyo para el curso
 *               subido_por:
 *                 type: integer
 *                 example: 1
 *               archivo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Material cargado correctamente
 *       400:
 *         description: Datos incompletos o archivo no permitido
 *       500:
 *         description: Error interno al guardar el material
 */

/**
 * @swagger
 * /api/evaluaciones/admin/curso/{cursoId}:
 *   get:
 *     summary: Consultar evaluación de un curso para administración
 *     tags: [Evaluaciones]
 *     description: >
 *       Consulta la evaluación asociada a un curso desde una vista administrativa.
 *       Retorna la evaluación más relevante del curso, priorizando la evaluación activa,
 *       junto con sus preguntas registradas. Esta ruta solo puede ser consultada por
 *       Super Admin, Admin o Supervisor autorizado según el área del curso.
 *     parameters:
 *       - in: path
 *         name: cursoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del curso cuya evaluación será consultada
 *       - in: query
 *         name: viewerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario que consulta la evaluación
 *     responses:
 *       200:
 *         description: Evaluación administrativa consultada correctamente
 *       400:
 *         description: No se envió el usuario que consulta la evaluación
 *       403:
 *         description: Usuario sin permisos para gestionar evaluaciones de este curso
 *       404:
 *         description: Usuario gestor o curso no encontrado
 *       500:
 *         description: Error interno al consultar la evaluación del curso
 */

/**
 * @swagger
 * /api/evaluaciones/curso/{cursoId}:
 *   get:
 *     summary: Consultar evaluación activa de un curso
 *     tags: [Evaluaciones]
 *     description: >
 *       Consulta la evaluación activa de un curso junto con sus preguntas activas.
 *       Esta ruta se utiliza para presentar la evaluación al usuario final. No retorna
 *       la respuesta correcta ni preguntas inactivas.
 *     parameters:
 *       - in: path
 *         name: cursoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del curso cuya evaluación activa será consultada
 *     responses:
 *       200:
 *         description: Evaluación activa y preguntas activas del curso
 *       404:
 *         description: El curso no tiene evaluación activa
 *       500:
 *         description: Error interno al consultar la evaluación
 */

/**
 * @swagger
 * /api/evaluaciones/curso/{cursoId}:
 *   post:
 *     summary: Crear evaluación para un curso
 *     tags: [Evaluaciones]
 *     description: >
 *       Crea una evaluación básica para un curso, definiendo título, puntaje mínimo
 *       y estado. Si la nueva evaluación se crea como Activa, las demás evaluaciones
 *       del mismo curso se actualizan a Inactiva. Solo Super Admin, Admin o Supervisor
 *       autorizado pueden crear evaluaciones.
 *     parameters:
 *       - in: path
 *         name: cursoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del curso al que se asociará la evaluación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - puntaje_minimo
 *               - estado
 *               - creado_por
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: Evaluación de seguridad de la información
 *                 description: Título de la evaluación
 *               puntaje_minimo:
 *                 type: number
 *                 example: 70
 *                 description: Puntaje mínimo requerido para aprobar la evaluación
 *               estado:
 *                 type: string
 *                 example: Activa
 *                 description: Estado de la evaluación. Valores permitidos: Activa o Inactiva.
 *               creado_por:
 *                 type: integer
 *                 example: 1
 *                 description: ID del usuario que crea la evaluación
 *     responses:
 *       201:
 *         description: Evaluación creada correctamente
 *       400:
 *         description: Datos incompletos, título inválido, puntaje inválido o estado inválido
 *       403:
 *         description: Usuario sin permisos para crear evaluaciones de este curso
 *       404:
 *         description: Usuario gestor o curso no encontrado
 *       500:
 *         description: Error interno al crear la evaluación
 */

/**
 * @swagger
 * /api/evaluaciones/{evaluacionId}:
 *   put:
 *     summary: Editar evaluación existente
 *     tags: [Evaluaciones]
 *     description: >
 *       Actualiza la información básica de una evaluación existente, incluyendo título,
 *       puntaje mínimo y estado. Si la evaluación se actualiza como Activa, las demás
 *       evaluaciones del mismo curso se actualizan a Inactiva. Solo Super Admin, Admin
 *       o Supervisor autorizado pueden editar evaluaciones.
 *     parameters:
 *       - in: path
 *         name: evaluacionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la evaluación que será actualizada
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - puntaje_minimo
 *               - estado
 *               - actualizado_por
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: Evaluación actualizada de seguridad de la información
 *                 description: Nuevo título de la evaluación
 *               puntaje_minimo:
 *                 type: number
 *                 example: 80
 *                 description: Nuevo puntaje mínimo requerido para aprobar
 *               estado:
 *                 type: string
 *                 example: Activa
 *                 description: Estado de la evaluación. Valores permitidos: Activa o Inactiva.
 *               actualizado_por:
 *                 type: integer
 *                 example: 1
 *                 description: ID del usuario que actualiza la evaluación
 *     responses:
 *       200:
 *         description: Evaluación actualizada correctamente
 *       400:
 *         description: Datos incompletos, título inválido, puntaje inválido o estado inválido
 *       403:
 *         description: Usuario sin permisos para editar evaluaciones de este curso
 *       404:
 *         description: Evaluación, usuario gestor o curso no encontrado
 *       500:
 *         description: Error interno al actualizar la evaluación
 */

/**
 * @swagger
 * /api/evaluaciones/{evaluacionId}/preguntas:
 *   post:
 *     summary: Crear pregunta manualmente para una evaluación
 *     tags: [Preguntas]
 *     description: >
 *       Permite crear manualmente una pregunta asociada a una evaluación existente.
 *       Cada pregunta contiene cuatro opciones de respuesta, una respuesta correcta,
 *       estado y ponderación. La ponderación permite que unas preguntas tengan mayor
 *       peso que otras en el cálculo final del puntaje.
 *       Solo Super Admin, Admin o Supervisor autorizado pueden crear preguntas.
 *     parameters:
 *       - in: path
 *         name: evaluacionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la evaluación a la que se agregará la pregunta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - texto_pregunta
 *               - opcion_a
 *               - opcion_b
 *               - opcion_c
 *               - opcion_d
 *               - respuesta_correcta
 *               - estado
 *               - ponderacion
 *               - creado_por
 *             properties:
 *               texto_pregunta:
 *                 type: string
 *                 example: ¿Cuál es una buena práctica de seguridad de la información?
 *               opcion_a:
 *                 type: string
 *                 example: Compartir contraseñas con compañeros
 *               opcion_b:
 *                 type: string
 *                 example: Bloquear la pantalla al ausentarse
 *               opcion_c:
 *                 type: string
 *                 example: Publicar información interna
 *               opcion_d:
 *                 type: string
 *                 example: Descargar archivos desconocidos
 *               respuesta_correcta:
 *                 type: string
 *                 example: B
 *                 description: Opción correcta. Valores permitidos: A, B, C o D.
 *               estado:
 *                 type: string
 *                 example: Activa
 *                 description: Estado de la pregunta. Valores permitidos: Activa o Inactiva.
 *               ponderacion:
 *                 type: number
 *                 example: 1.5
 *                 description: Peso de la pregunta en el cálculo final. Debe ser mayor a 0 y máximo 100.
 *               creado_por:
 *                 type: integer
 *                 example: 1
 *                 description: ID del usuario que crea la pregunta
 *     responses:
 *       201:
 *         description: Pregunta creada correctamente
 *       400:
 *         description: Datos incompletos, respuesta inválida, estado inválido o ponderación inválida
 *       403:
 *         description: Usuario sin permisos para crear preguntas en esta evaluación
 *       404:
 *         description: Evaluación, usuario gestor o curso no encontrado
 *       500:
 *         description: Error interno al crear la pregunta
 */

/**
 * @swagger
 * /api/preguntas/{preguntaId}:
 *   put:
 *     summary: Editar pregunta existente
 *     tags: [Preguntas]
 *     description: >
 *       Actualiza la información completa de una pregunta existente, incluyendo texto,
 *       opciones de respuesta, respuesta correcta, estado y ponderación. Esta ruta permite
 *       mantener las preguntas de la evaluación sin necesidad de eliminarlas y crearlas
 *       nuevamente. Solo Super Admin, Admin o Supervisor autorizado pueden editar preguntas.
 *     parameters:
 *       - in: path
 *         name: preguntaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la pregunta que será actualizada
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - texto_pregunta
 *               - opcion_a
 *               - opcion_b
 *               - opcion_c
 *               - opcion_d
 *               - respuesta_correcta
 *               - estado
 *               - ponderacion
 *               - actualizado_por
 *             properties:
 *               texto_pregunta:
 *                 type: string
 *                 example: ¿Qué se debe hacer ante un correo sospechoso?
 *               opcion_a:
 *                 type: string
 *                 example: Abrir todos los enlaces
 *               opcion_b:
 *                 type: string
 *                 example: Reportarlo al área correspondiente
 *               opcion_c:
 *                 type: string
 *                 example: Reenviarlo a todos los compañeros
 *               opcion_d:
 *                 type: string
 *                 example: Descargar los archivos adjuntos
 *               respuesta_correcta:
 *                 type: string
 *                 example: B
 *                 description: Opción correcta. Valores permitidos: A, B, C o D.
 *               estado:
 *                 type: string
 *                 example: Activa
 *                 description: Estado de la pregunta. Valores permitidos: Activa o Inactiva.
 *               ponderacion:
 *                 type: number
 *                 example: 2
 *                 description: Peso de la pregunta en el cálculo final. Debe ser mayor a 0 y máximo 100.
 *               actualizado_por:
 *                 type: integer
 *                 example: 1
 *                 description: ID del usuario que actualiza la pregunta
 *     responses:
 *       200:
 *         description: Pregunta actualizada correctamente
 *       400:
 *         description: Datos incompletos, respuesta inválida, estado inválido o ponderación inválida
 *       403:
 *         description: Usuario sin permisos para editar la pregunta
 *       404:
 *         description: Pregunta, usuario gestor o curso no encontrado
 *       500:
 *         description: Error interno al actualizar la pregunta
 */

/**
 * @swagger
 * /api/preguntas/{preguntaId}/estado:
 *   patch:
 *     summary: Activar o inactivar una pregunta
 *     tags: [Preguntas]
 *     description: >
 *       Permite cambiar el estado de una pregunta entre Activa e Inactiva.
 *       Las preguntas inactivas no se muestran al usuario cuando presenta la evaluación
 *       y tampoco se tienen en cuenta para calcular el puntaje final.
 *       Solo Super Admin, Admin o Supervisor autorizado pueden cambiar el estado de preguntas.
 *     parameters:
 *       - in: path
 *         name: preguntaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la pregunta a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estado
 *               - actualizado_por
 *             properties:
 *               estado:
 *                 type: string
 *                 example: Inactiva
 *                 description: Estado de la pregunta. Valores permitidos: Activa o Inactiva.
 *               actualizado_por:
 *                 type: integer
 *                 example: 1
 *                 description: ID del usuario que actualiza el estado de la pregunta
 *     responses:
 *       200:
 *         description: Estado de la pregunta actualizado correctamente
 *       400:
 *         description: Datos incompletos o estado inválido
 *       403:
 *         description: Usuario sin permisos para actualizar la pregunta
 *       404:
 *         description: Pregunta, usuario gestor o curso no encontrado
 *       500:
 *         description: Error interno al actualizar el estado de la pregunta
 */

/**
 * @swagger
 * /api/evaluaciones/{evaluacionId}/preguntas/csv:
 *   post:
 *     summary: Cargar preguntas por archivo CSV
 *     tags: [Preguntas]
 *     description: >
 *       Permite cargar preguntas de forma masiva mediante un archivo CSV.
 *       El archivo debe contener las columnas: texto_pregunta, opcion_a, opcion_b,
 *       opcion_c, opcion_d, respuesta_correcta, estado y ponderacion.
 *       El sistema valida todo el archivo antes de insertar datos. Si existe al menos
 *       un error, no se carga ninguna pregunta y se retorna el listado de errores.
 *       Se aceptan archivos CSV separados por coma o punto y coma.
 *     parameters:
 *       - in: path
 *         name: evaluacionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la evaluación a la que se cargarán las preguntas
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - archivo
 *               - cargado_por
 *             properties:
 *               archivo:
 *                 type: string
 *                 format: binary
 *                 description: Archivo CSV con las preguntas a cargar
 *               cargado_por:
 *                 type: integer
 *                 example: 1
 *                 description: ID del usuario que carga el archivo CSV
 *     responses:
 *       201:
 *         description: Preguntas cargadas correctamente desde CSV
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Preguntas cargadas correctamente desde CSV.
 *                 totalCargadas:
 *                   type: integer
 *                   example: 5
 *       400:
 *         description: Archivo no enviado, columnas faltantes o errores de validación en el CSV
 *       403:
 *         description: Usuario sin permisos para cargar preguntas en esta evaluación
 *       404:
 *         description: Evaluación, usuario gestor o curso no encontrado
 *       500:
 *         description: Error interno al cargar las preguntas por CSV
 */

/**
 * @swagger
 * /api/evaluaciones/{evaluacionId}/responder:
 *   post:
 *     summary: Responder una evaluación y actualizar el avance
 *     tags: [Evaluaciones]
 *     description: >
 *       Permite que un usuario responda la evaluación activa de un curso asignado.
 *       Antes de registrar el resultado, valida que el curso esté asignado al usuario,
 *       que los materiales hayan sido completados y que, en caso de una evaluación
 *       previamente no aprobada, exista un reintento habilitado por un usuario autorizado.
 *       Si el usuario aprueba, el avance queda en 100% y estado "Completado".
 *       Si no aprueba, el avance queda en 80%, estado "Evaluacion no aprobada" y el
 *       reintento queda bloqueado hasta nueva autorización.
 *     parameters:
 *       - in: path
 *         name: evaluacionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la evaluación que será respondida
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usuario_id
 *               - respuestas
 *             properties:
 *               usuario_id:
 *                 type: integer
 *                 example: 5
 *                 description: ID del usuario que presenta la evaluación
 *               respuestas:
 *                 type: array
 *                 description: Lista de respuestas seleccionadas por el usuario
 *                 items:
 *                   type: object
 *                   required:
 *                     - pregunta_id
 *                     - respuesta
 *                   properties:
 *                     pregunta_id:
 *                       type: integer
 *                       example: 1
 *                       description: ID de la pregunta respondida
 *                     respuesta:
 *                       type: string
 *                       example: B
 *                       description: Opción seleccionada por el usuario. Valores esperados A, B, C o D.
 *     responses:
 *       201:
 *         description: Evaluación presentada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Evaluación presentada correctamente.
 *                 puntaje:
 *                   type: number
 *                   example: 85
 *                 estado:
 *                   type: string
 *                   example: Aprobado
 *                 intento:
 *                   type: integer
 *                   example: 2
 *                 intentosFallidos:
 *                   type: integer
 *                   example: 1
 *                 avance:
 *                   type: number
 *                   example: 100
 *                 reintentoHabilitado:
 *                   type: boolean
 *                   example: false
 *       400:
 *         description: Datos incompletos, curso ya completado, materiales pendientes o evaluación sin preguntas
 *       403:
 *         description: Curso no asignado al usuario o reintento bloqueado por falta de autorización
 *       404:
 *         description: Evaluación no encontrada
 *       500:
 *         description: Error interno al guardar o validar la evaluación
 */

// =========================
// RUTA PRINCIPAL
// =========================
app.get('/', (req, res) => {
  res.send('API de ITOS Academy funcionando');
});

// =========================
// AUTENTICACIÓN
// =========================
app.post('/api/login', (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({
      message: 'Debe ingresar correo y contraseña.',
    });
  }

  const correoLimpio = correo.trim().toLowerCase();

  const sql = `
    SELECT 
      id,
      nombre,
      correo,
      password_hash,
      rol,
      area,
      cargo,
      pais,
      estado
    FROM usuarios
    WHERE LOWER(correo) = ?
    LIMIT 1
  `;

  connection.query(sql, [correoLimpio], async (err, results) => {
    if (err) {
      console.log('Error consultando usuario para login:', err);
      return res.status(500).json({
        message: 'Error interno al iniciar sesión.',
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        message: 'Correo o contraseña incorrectos.',
      });
    }

    const usuario = results[0];

    if (usuario.estado !== 'Activo') {
      return res.status(401).json({
        message: 'El usuario se encuentra inactivo.',
      });
    }

    try {
      const passwordValida = await bcrypt.compare(
        password,
        usuario.password_hash
      );

      if (!passwordValida) {
        return res.status(401).json({
          message: 'Correo o contraseña incorrectos.',
        });
      }

      res.json({
        message: 'Inicio de sesión exitoso.',
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          rol: usuario.rol,
          area: usuario.area,
          cargo: usuario.cargo,
          pais: usuario.pais,
          estado: usuario.estado,
        },
      });
    } catch (error) {
      console.log('Error validando contraseña:', error);

      res.status(500).json({
        message: 'Error interno al validar la contraseña.',
      });
    }
  });
});

const dbQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

async function validarPermisoGestionEvaluacion(cursoId, gestorId) {
  const gestores = await dbQuery(
    `
    SELECT id, rol, area
    FROM usuarios
    WHERE id = ? AND estado = 'Activo'
    `,
    [gestorId]
  );

  if (gestores.length === 0) {
    throw {
      status: 404,
      message: 'El usuario gestor no existe o está inactivo.',
    };
  }

  const gestor = gestores[0];

  if (gestor.rol === 'Empleado') {
    throw {
      status: 403,
      message: 'Un empleado no tiene permisos para gestionar evaluaciones.',
    };
  }

  const cursos = await dbQuery(
    `
    SELECT id, titulo, area
    FROM cursos
    WHERE id = ?
    `,
    [cursoId]
  );

  if (cursos.length === 0) {
    throw {
      status: 404,
      message: 'El curso no existe.',
    };
  }

  const curso = cursos[0];

  if (gestor.rol === 'Supervisor' && gestor.area !== curso.area) {
    throw {
      status: 403,
      message:
        'El supervisor solo puede gestionar evaluaciones de cursos de su propia área.',
    };
  }

  return {
    gestor,
    curso,
  };
}

function parseCsvLine(linea, separador = ',') {
  const valores = [];
  let valorActual = '';
  let dentroComillas = false;

  for (let i = 0; i < linea.length; i++) {
    const caracter = linea[i];
    const siguienteCaracter = linea[i + 1];

    if (caracter === '"' && dentroComillas && siguienteCaracter === '"') {
      valorActual += '"';
      i++;
    } else if (caracter === '"') {
      dentroComillas = !dentroComillas;
    } else if (caracter === separador && !dentroComillas) {
      valores.push(valorActual.trim());
      valorActual = '';
    } else {
      valorActual += caracter;
    }
  }

  valores.push(valorActual.trim());

  return valores.map((valor) => valor.replace(/^"|"$/g, '').trim());
}

function detectarSeparadorCsv(lineaEncabezado) {
  const cantidadComas = (lineaEncabezado.match(/,/g) || []).length;
  const cantidadPuntoComa = (lineaEncabezado.match(/;/g) || []).length;

  return cantidadPuntoComa > cantidadComas ? ';' : ',';
}

function parseCsvPreguntas(buffer) {
  const contenido = buffer.toString('utf8').replace(/^\uFEFF/, '');

  const lineas = contenido
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter((linea) => linea.length > 0);

  if (lineas.length < 2) {
    throw {
      status: 400,
      message: 'El archivo CSV debe contener encabezados y al menos una pregunta.',
    };
  }

  const separador = detectarSeparadorCsv(lineas[0]);

  const encabezados = parseCsvLine(lineas[0], separador).map((h) =>
    h.toLowerCase().trim()
  );

  const columnasRequeridas = [
    'texto_pregunta',
    'opcion_a',
    'opcion_b',
    'opcion_c',
    'opcion_d',
    'respuesta_correcta',
  ];

  const faltantes = columnasRequeridas.filter(
    (columna) => !encabezados.includes(columna)
  );

  if (faltantes.length > 0) {
    throw {
      status: 400,
      message: `Faltan columnas obligatorias en el CSV: ${faltantes.join(', ')}.`,
    };
  }

  return lineas.slice(1).map((linea, index) => {
    const valores = parseCsvLine(linea, separador);
    const fila = {};

    encabezados.forEach((encabezado, i) => {
      fila[encabezado] = valores[i] || '';
    });

    fila.numero_fila = index + 2;

    return fila;
  });
}

app.patch('/api/perfil/:id/password', (req, res) => {
  const { id } = req.params;
  const { password_actual, password_nueva, actualizado_por } = req.body;

  if (!actualizado_por) {
    return res.status(400).json({
      message: 'Debe enviar el usuario que actualiza la contraseña.',
    });
  }

  if (Number(id) !== Number(actualizado_por)) {
    return res.status(403).json({
      message: 'Solo puedes cambiar tu propia contraseña.',
    });
  }

  if (!password_actual || !password_nueva) {
    return res.status(400).json({
      message: 'Debe ingresar la contraseña actual y la nueva contraseña.',
    });
  }

  if (password_nueva.length < 6 || password_nueva.length > 50) {
    return res.status(400).json({
      message: 'La nueva contraseña debe tener entre 6 y 50 caracteres.',
    });
  }

  const sqlUsuario = `
    SELECT id, password_hash, estado
    FROM usuarios
    WHERE id = ?
  `;

  connection.query(sqlUsuario, [id], async (err, usuarios) => {
    if (err) {
      console.log('Error consultando usuario para cambio de contraseña:', err);
      return res.status(500).json({
        message: 'Error interno al consultar el usuario.',
      });
    }

    if (usuarios.length === 0 || usuarios[0].estado !== 'Activo') {
      return res.status(404).json({
        message: 'Usuario no encontrado o inactivo.',
      });
    }

    const usuario = usuarios[0];

    try {
      const passwordValida = await bcrypt.compare(
        password_actual,
        usuario.password_hash
      );

      if (!passwordValida) {
        return res.status(401).json({
          message: 'La contraseña actual no es correcta.',
        });
      }

      const nuevoHash = await bcrypt.hash(password_nueva, 10);

      const sqlUpdate = `
        UPDATE usuarios
        SET password_hash = ?
        WHERE id = ?
      `;

      connection.query(sqlUpdate, [nuevoHash, id], (err) => {
        if (err) {
          console.log('Error actualizando contraseña:', err);
          return res.status(500).json({
            message: 'Error interno al actualizar la contraseña.',
          });
        }

        res.json({
          message: 'Contraseña actualizada correctamente.',
        });
      });
    } catch (error) {
      console.log('Error procesando cambio de contraseña:', error);

      res.status(500).json({
        message: 'Error interno al procesar la contraseña.',
      });
    }
  });
});

// =========================
// MI PERFIL
// =========================
app.patch('/api/perfil/:id', (req, res) => {
  const { id } = req.params;
  const { pais, actualizado_por } = req.body;

  if (!actualizado_por) {
    return res.status(400).json({
      message: 'Debe enviar el usuario que actualiza el perfil.',
    });
  }

  if (Number(id) !== Number(actualizado_por)) {
    return res.status(403).json({
      message: 'Solo puedes actualizar tu propio perfil.',
    });
  }

  const paisLimpio = pais ? pais.trim() : '';

  if (!paisLimpio || paisLimpio.length < 2 || paisLimpio.length > 80) {
    return res.status(400).json({
      message: 'El país debe tener entre 2 y 80 caracteres.',
    });
  }

  const sqlUpdate = `
    UPDATE usuarios
    SET pais = ?
    WHERE id = ? AND estado = 'Activo'
  `;

  connection.query(sqlUpdate, [paisLimpio, id], (err, result) => {
    if (err) {
      console.log('Error actualizando perfil:', err);
      return res.status(500).json({
        message: 'Error interno al actualizar el perfil.',
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Usuario no encontrado o inactivo.',
      });
    }

    const sqlUsuario = `
      SELECT id, nombre, correo, rol, area, cargo, pais, estado
      FROM usuarios
      WHERE id = ?
    `;

    connection.query(sqlUsuario, [id], (err, usuarios) => {
      if (err) {
        console.log('Error consultando perfil actualizado:', err);
        return res.status(500).json({
          message: 'El perfil se actualizó, pero no fue posible consultarlo.',
        });
      }

      res.json({
        message: 'Perfil actualizado correctamente.',
        usuario: usuarios[0],
      });
    });
  });
});

// =========================
// USUARIOS
// =========================
app.get('/api/usuarios', (req, res) => {
  const sql =
    'SELECT id, nombre, correo, rol, area, cargo, pais, estado FROM usuarios';

  connection.query(sql, (err, results) => {
    if (err) {
      console.log('Error consultando usuarios:', err);
      return res.status(500).json({
        message: 'Error interno del servidor',
      });
    }

    res.json(results);
  });
});

// Consultar usuarios visibles según el rol del usuario activo
app.get('/api/usuarios/visibles', (req, res) => {
  const { viewerId } = req.query;

  if (!viewerId) {
    return res.status(400).json({
      message: 'Debe enviar el usuario que está consultando.',
    });
  }

  const sqlViewer = `
    SELECT id, rol, area
    FROM usuarios
    WHERE id = ? AND estado = 'Activo'
  `;

  connection.query(sqlViewer, [viewerId], (err, viewers) => {
    if (err) {
      console.log('Error validando usuario consultante:', err);
      return res.status(500).json({
        message: 'Error interno al validar el usuario consultante.',
      });
    }

    if (viewers.length === 0) {
      return res.status(404).json({
        message: 'El usuario consultante no existe o está inactivo.',
      });
    }

    const viewer = viewers[0];

    let sql = `
      SELECT 
        id,
        nombre,
        correo,
        rol,
        area,
        cargo,
        pais,
        estado,
        fecha_ingreso
      FROM usuarios
      WHERE 1 = 1
    `;

    const params = [];

    if (viewer.rol === 'Supervisor') {
      sql += `
        AND rol = 'Empleado'
        AND area = ?
      `;
      params.push(viewer.area);
    }

    if (viewer.rol === 'Empleado') {
      sql += `
        AND id = ?
      `;
      params.push(viewer.id);
    }

    sql += `
      ORDER BY nombre ASC
    `;

    connection.query(sql, params, (err, results) => {
      if (err) {
        console.log('Error consultando usuarios visibles:', err);
        return res.status(500).json({
          message: 'Error interno al consultar usuarios visibles.',
        });
      }

      res.json(results);
    });
  });
});

// Crear un nuevo usuario
app.post('/api/usuarios', async (req, res) => {
  const {
    nombre,
    correo,
    password,
    rol,
    area,
    cargo,
    pais,
    estado,
    fecha_ingreso,
  } = req.body;

  if (!nombre || !correo || !password || !rol || !area) {
    return res.status(400).json({
      message: 'Nombre, correo, contraseña, rol y área son obligatorios.',
    });
  }

  const rolesPermitidos = ['Super Admin', 'Admin', 'Supervisor', 'Empleado'];
  const areasPermitidas = [
    'IT',
    'RRHH',
    'BPO',
    'Billing',
    'PEO',
    'Implementacion',
  ];

  if (!rolesPermitidos.includes(rol)) {
    return res.status(400).json({
      message: 'El rol enviado no es válido.',
    });
  }

  if (!areasPermitidas.includes(area)) {
    return res.status(400).json({
      message: 'El área enviada no es válida.',
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO usuarios
      (nombre, correo, password_hash, rol, area, cargo, pais, estado, fecha_ingreso)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      nombre,
      correo,
      passwordHash,
      rol,
      area,
      cargo || null,
      pais || 'Colombia',
      estado || 'Activo',
      fecha_ingreso || null,
    ];

    connection.query(sql, values, (err, result) => {
      if (err) {
        console.log('Error creando usuario:', err);

        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({
            message: 'Ya existe un usuario registrado con ese correo.',
          });
        }

        return res.status(500).json({
          message: 'Error interno al crear el usuario.',
        });
      }

      res.status(201).json({
        message: 'Usuario creado correctamente.',
        usuarioId: result.insertId,
      });
    });
  } catch (error) {
    console.log('Error cifrando contraseña:', error);

    res.status(500).json({
      message: 'Error interno al procesar la contraseña.',
    });
  }
});

// Activar o inactivar usuario
app.patch('/api/usuarios/:id/estado', (req, res) => {
  const { id } = req.params;
  const { estado, actualizado_por } = req.body;

  if (!estado || !actualizado_por) {
    return res.status(400).json({
      message: 'Debe enviar estado y usuario que realiza la actualización.',
    });
  }

  const estadosPermitidos = ['Activo', 'Inactivo'];

  if (!estadosPermitidos.includes(estado)) {
    return res.status(400).json({
      message: 'El estado enviado no es válido.',
    });
  }

  if (Number(id) === Number(actualizado_por) && estado === 'Inactivo') {
    return res.status(400).json({
      message: 'No puedes inactivar tu propio usuario activo.',
    });
  }

  const sqlEditor = `
    SELECT id, rol, area
    FROM usuarios
    WHERE id = ? AND estado = 'Activo'
  `;

  connection.query(sqlEditor, [actualizado_por], (err, editores) => {
    if (err) {
      console.log('Error validando editor:', err);
      return res.status(500).json({
        message: 'Error interno al validar el usuario editor.',
      });
    }

    if (editores.length === 0) {
      return res.status(404).json({
        message: 'El usuario editor no existe o está inactivo.',
      });
    }

    const editor = editores[0];

    const sqlUsuario = `
      SELECT id, rol, area
      FROM usuarios
      WHERE id = ?
    `;

    connection.query(sqlUsuario, [id], (err, usuarios) => {
      if (err) {
        console.log('Error consultando usuario:', err);
        return res.status(500).json({
          message: 'Error interno al consultar el usuario.',
        });
      }

      if (usuarios.length === 0) {
        return res.status(404).json({
          message: 'El usuario no existe.',
        });
      }

      const usuario = usuarios[0];

      if (editor.rol === 'Empleado') {
        return res.status(403).json({
          message: 'Un empleado no tiene permisos para cambiar estados.',
        });
      }

      if (editor.rol === 'Supervisor') {
        if (usuario.rol !== 'Empleado' || usuario.area !== editor.area) {
          return res.status(403).json({
            message:
              'El supervisor solo puede activar o inactivar empleados de su área.',
          });
        }
      }

      if (editor.rol === 'Admin' && usuario.rol === 'Super Admin') {
        return res.status(403).json({
          message: 'Un administrador no puede inactivar un Super Admin.',
        });
      }

      const sqlUpdate = `
        UPDATE usuarios
        SET estado = ?
        WHERE id = ?
      `;

      connection.query(sqlUpdate, [estado, id], (err) => {
        if (err) {
          console.log('Error actualizando estado:', err);
          return res.status(500).json({
            message: 'Error interno al actualizar el estado del usuario.',
          });
        }

        res.json({
          message:
            estado === 'Activo'
              ? 'Usuario activado correctamente.'
              : 'Usuario inactivado correctamente.',
        });
      });
    });
  });
});

// Editar usuario
app.put('/api/usuarios/:id', (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    correo,
    rol,
    area,
    cargo,
    pais,
    estado,
    actualizado_por,
  } = req.body;

  if (!actualizado_por) {
    return res.status(400).json({
      message: 'Debe enviar el usuario que realiza la actualización.',
    });
  }

  if (!nombre || !correo || !rol || !area || !estado) {
    return res.status(400).json({
      message: 'Nombre, correo, rol, área y estado son obligatorios.',
    });
  }

  const rolesPermitidos = ['Super Admin', 'Admin', 'Supervisor', 'Empleado'];
  const areasPermitidas = [
    'IT',
    'RRHH',
    'BPO',
    'Billing',
    'PEO',
    'Implementacion',
  ];
  const estadosPermitidos = ['Activo', 'Inactivo'];

  if (!rolesPermitidos.includes(rol)) {
    return res.status(400).json({
      message: 'El rol enviado no es válido.',
    });
  }

  if (!areasPermitidas.includes(area)) {
    return res.status(400).json({
      message: 'El área enviada no es válida.',
    });
  }

  if (!estadosPermitidos.includes(estado)) {
    return res.status(400).json({
      message: 'El estado enviado no es válido.',
    });
  }

  const sqlEditor = `
    SELECT id, rol, area
    FROM usuarios
    WHERE id = ? AND estado = 'Activo'
  `;

  connection.query(sqlEditor, [actualizado_por], (err, editores) => {
    if (err) {
      console.log('Error validando editor:', err);
      return res.status(500).json({
        message: 'Error interno al validar el usuario editor.',
      });
    }

    if (editores.length === 0) {
      return res.status(404).json({
        message: 'El usuario editor no existe o está inactivo.',
      });
    }

    const editor = editores[0];

    const sqlUsuarioActual = `
      SELECT id, rol, area
      FROM usuarios
      WHERE id = ?
    `;

    connection.query(sqlUsuarioActual, [id], (err, usuarios) => {
      if (err) {
        console.log('Error consultando usuario:', err);
        return res.status(500).json({
          message: 'Error interno al consultar el usuario.',
        });
      }

      if (usuarios.length === 0) {
        return res.status(404).json({
          message: 'El usuario a editar no existe.',
        });
      }

      const usuarioActual = usuarios[0];

      if (editor.rol === 'Empleado') {
        return res.status(403).json({
          message: 'Un empleado no tiene permisos para editar usuarios.',
        });
      }

      if (editor.rol === 'Supervisor') {
        const puedeEditar =
          usuarioActual.rol === 'Empleado' &&
          usuarioActual.area === editor.area &&
          rol === 'Empleado' &&
          area === editor.area;

        if (!puedeEditar) {
          return res.status(403).json({
            message:
              'El supervisor solo puede editar empleados de su propia área.',
          });
        }
      }

      if (editor.rol === 'Admin') {
        if (usuarioActual.rol === 'Super Admin' || rol === 'Super Admin') {
          return res.status(403).json({
            message:
              'Un administrador no puede editar usuarios Super Admin ni asignar ese rol.',
          });
        }
      }

      const sqlUpdate = `
        UPDATE usuarios
        SET 
          nombre = ?,
          correo = ?,
          rol = ?,
          area = ?,
          cargo = ?,
          pais = ?,
          estado = ?
        WHERE id = ?
      `;

      const values = [
        nombre.trim(),
        correo.trim(),
        rol,
        area,
        cargo || null,
        pais || 'Colombia',
        estado,
        id,
      ];

      connection.query(sqlUpdate, values, (err) => {
        if (err) {
          console.log('Error actualizando usuario:', err);

          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
              message: 'Ya existe un usuario registrado con ese correo.',
            });
          }

          return res.status(500).json({
            message: 'Error interno al actualizar el usuario.',
          });
        }

        res.json({
          message: 'Usuario actualizado correctamente.',
        });
      });
    });
  });
});

// =========================
// CURSOS
// =========================
app.get('/api/cursos', (req, res) => {
  const { viewerId } = req.query;

  if (!viewerId) {
    return res.status(400).json({
      message: 'Debe enviar el usuario que está consultando los cursos.',
    });
  }

  const sqlUsuario = `
    SELECT id, rol, area
    FROM usuarios
    WHERE id = ? AND estado = 'Activo'
  `;

  connection.query(sqlUsuario, [viewerId], (err, usuarios) => {
    if (err) {
      console.log('Error validando usuario:', err);
      return res.status(500).json({
        message: 'Error interno al validar el usuario.',
      });
    }

    if (usuarios.length === 0) {
      return res.status(404).json({
        message: 'El usuario que consulta no existe o está inactivo.',
      });
    }

    const usuario = usuarios[0];

    let sql = `
      SELECT 
        cursos.id,
        cursos.titulo,
        cursos.descripcion,
        cursos.area,
        cursos.duracion_horas,
        cursos.responsable_id,
        cursos.estado,
        responsable.nombre AS responsable,
        avances.id AS avance_id,
        avances.porcentaje AS porcentaje_avance,
        avances.estado AS estado_avance,
        avances.materiales_revisados,
        avances.evaluacion_presentada,
        avances.reintento_habilitado,

        (
          SELECT COUNT(*)
          FROM resultados_evaluacion re
          INNER JOIN evaluaciones ev ON re.evaluacion_id = ev.id
          WHERE re.usuario_id = ?
          AND ev.curso_id = cursos.id
          AND re.estado = 'No aprobado'
        ) AS intentos_fallidos_evaluacion,

        (
          SELECT COUNT(*)
          FROM materiales m5
          WHERE m5.curso_id = cursos.id
        ) AS total_materiales,

        (
          SELECT COUNT(*)
          FROM progreso_materiales pm5
          WHERE pm5.curso_id = cursos.id
          AND pm5.usuario_id = ?
          AND pm5.completado = TRUE
        ) AS materiales_completados_usuario,

        (
          SELECT COUNT(*)
          FROM avances a2
          WHERE a2.curso_id = cursos.id
        ) AS total_asignados,

        (
          SELECT COUNT(*)
          FROM avances a3
          WHERE a3.curso_id = cursos.id
          AND a3.estado = 'Completado'
        ) AS total_completados,

        (
          SELECT COUNT(*)
          FROM avances a4
          WHERE a4.curso_id = cursos.id
          AND a4.estado <> 'Completado'
        ) AS total_pendientes

      FROM cursos
      LEFT JOIN usuarios AS responsable 
        ON cursos.responsable_id = responsable.id
      LEFT JOIN avances
        ON cursos.id = avances.curso_id
        AND avances.usuario_id = ?
    `;

    const params = [usuario.id, usuario.id, usuario.id];

    sql += `
      WHERE 1 = 1
    `;

    if (usuario.rol === 'Supervisor') {
      sql += `
        AND cursos.area = ?
      `;
      params.push(usuario.area);
    }

    if (usuario.rol === 'Empleado') {
      sql += `
        AND avances.usuario_id IS NOT NULL
      `;
    }

    sql += `
      ORDER BY cursos.id ASC
    `;

    connection.query(sql, params, (err, results) => {
      if (err) {
        console.log('Error consultando cursos:', err);
        return res.status(500).json({
          message: 'Error interno al consultar los cursos.',
        });
      }

      res.json(results);
    });
  });
});

// Crear un nuevo curso
app.post('/api/cursos', (req, res) => {
  let {
    titulo,
    descripcion,
    area,
    duracion_horas,
    responsable_id,
    estado,
    creado_por,
  } = req.body;

  // Limpieza básica
  titulo = titulo ? titulo.trim() : '';
  descripcion = descripcion ? descripcion.trim() : '';
  estado = estado || 'Disponible';

  const areasPermitidas = [
    'IT',
    'RRHH',
    'BPO',
    'Billing',
    'PEO',
    'Implementacion',
  ];

  const estadosPermitidos = ['Disponible', 'Inactivo'];

  const tituloRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s.,:;()/-]+$/;

  if (!titulo || !descripcion || !area || !duracion_horas || !creado_por) {
    return res.status(400).json({
      message:
        'Título, descripción, área, duración y usuario creador son obligatorios.',
    });
  }

  if (titulo.length < 5 || titulo.length > 150) {
    return res.status(400).json({
      message: 'El título debe tener entre 5 y 150 caracteres.',
    });
  }

  if (!tituloRegex.test(titulo)) {
    return res.status(400).json({
      message:
        'El título contiene caracteres no permitidos. Use solo letras, números y signos básicos.',
    });
  }

  if (descripcion.length < 15 || descripcion.length > 1000) {
    return res.status(400).json({
      message: 'La descripción debe tener entre 15 y 1000 caracteres.',
    });
  }

  if (!areasPermitidas.includes(area)) {
    return res.status(400).json({
      message: 'El área seleccionada no es válida.',
    });
  }

  if (!estadosPermitidos.includes(estado)) {
    return res.status(400).json({
      message: 'El estado seleccionado no es válido.',
    });
  }

  const duracion = Number(duracion_horas);

  if (Number.isNaN(duracion) || duracion < 0.5 || duracion > 40) {
    return res.status(400).json({
      message: 'La duración debe ser un número entre 0.5 y 40 horas.',
    });
  }

  const sqlUsuario = `
    SELECT id, rol, area
    FROM usuarios
    WHERE id = ? AND estado = 'Activo'
  `;

  connection.query(sqlUsuario, [creado_por], (err, usuarios) => {
    if (err) {
      console.log('Error validando usuario creador:', err);
      return res.status(500).json({
        message: 'Error interno al validar el usuario creador.',
      });
    }

    if (usuarios.length === 0) {
      return res.status(404).json({
        message: 'El usuario creador no existe o está inactivo.',
      });
    }

    const usuarioCreador = usuarios[0];

    if (usuarioCreador.rol === 'Empleado') {
      return res.status(403).json({
        message: 'Un empleado no tiene permisos para crear cursos.',
      });
    }

    if (
      usuarioCreador.rol === 'Supervisor' &&
      usuarioCreador.area !== area
    ) {
      return res.status(403).json({
        message:
          'El supervisor solo puede crear cursos de su propia área.',
      });
    }

    const insertarCurso = () => {
      const sqlInsert = `
        INSERT INTO cursos
        (titulo, descripcion, area, duracion_horas, responsable_id, estado)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const values = [
        titulo,
        descripcion,
        area,
        duracion,
        responsable_id || null,
        estado,
      ];

      connection.query(sqlInsert, values, (err, result) => {
        if (err) {
          console.log('Error creando curso:', err);
          return res.status(500).json({
            message: 'Error interno al crear el curso.',
          });
        }

        res.status(201).json({
          message: 'Curso creado correctamente.',
          cursoId: result.insertId,
        });
      });
    };

    if (!responsable_id) {
      insertarCurso();
      return;
    }

    const sqlResponsable = `
      SELECT id, rol, area
      FROM usuarios
      WHERE id = ? AND estado = 'Activo'
    `;

    connection.query(sqlResponsable, [responsable_id], (err, responsables) => {
      if (err) {
        console.log('Error validando responsable:', err);
        return res.status(500).json({
          message: 'Error interno al validar el responsable.',
        });
      }

      if (responsables.length === 0) {
        return res.status(404).json({
          message: 'El responsable seleccionado no existe o está inactivo.',
        });
      }

      const responsable = responsables[0];

      const rolesResponsablePermitidos = ['Super Admin', 'Admin', 'Supervisor'];

      if (!rolesResponsablePermitidos.includes(responsable.rol)) {
        return res.status(400).json({
          message: 'El responsable del curso debe ser Super Admin, Admin o Supervisor.',
        });
      }

      const esResponsableSuperAdmin = responsable.rol === 'Super Admin';
      const esResponsableAdmin = responsable.rol === 'Admin';
      const esResponsableSupervisor = responsable.rol === 'Supervisor';

      if (!esResponsableSuperAdmin && !esResponsableAdmin && !esResponsableSupervisor) {
        return res.status(400).json({
          message: 'El responsable del curso debe ser Super Admin, Admin o Supervisor.',
        });
      }

      if (esResponsableSupervisor && responsable.area !== area) {
        return res.status(400).json({
          message: 'El supervisor responsable debe pertenecer a la misma área del curso.',
        });
      }

      insertarCurso();
    });
  });
});

app.get('/api/cursos/:id', (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      cursos.id,
      cursos.titulo,
      cursos.descripcion,
      cursos.area,
      cursos.duracion_horas,
      cursos.responsable_id,
      cursos.estado,
      usuarios.nombre AS responsable
    FROM cursos
    LEFT JOIN usuarios ON cursos.responsable_id = usuarios.id
    WHERE cursos.id = ?
  `;

  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.log('Error consultando curso:', err);
      return res.status(500).json({
        message: 'Error interno al consultar el curso',
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: 'Curso no encontrado',
      });
    }

    res.json(results[0]);
  });
});

// Editar un curso existente
app.put('/api/cursos/:id', (req, res) => {
  const { id } = req.params;

  let {
    titulo,
    descripcion,
    area,
    duracion_horas,
    responsable_id,
    estado,
    actualizado_por,
  } = req.body;

  titulo = titulo ? titulo.trim() : '';
  descripcion = descripcion ? descripcion.trim() : '';
  estado = estado || 'Disponible';

  const areasPermitidas = [
    'IT',
    'RRHH',
    'BPO',
    'Billing',
    'PEO',
    'Implementacion',
  ];

  const estadosPermitidos = ['Disponible', 'Inactivo'];

  const tituloRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s.,:;()/-]+$/;

  if (!titulo || !descripcion || !area || !duracion_horas || !actualizado_por) {
    return res.status(400).json({
      message:
        'Título, descripción, área, duración y usuario actualizador son obligatorios.',
    });
  }

  if (titulo.length < 5 || titulo.length > 150) {
    return res.status(400).json({
      message: 'El título debe tener entre 5 y 150 caracteres.',
    });
  }

  if (!tituloRegex.test(titulo)) {
    return res.status(400).json({
      message:
        'El título contiene caracteres no permitidos. Use solo letras, números y signos básicos.',
    });
  }

  if (descripcion.length < 15 || descripcion.length > 1000) {
    return res.status(400).json({
      message: 'La descripción debe tener entre 15 y 1000 caracteres.',
    });
  }

  if (!areasPermitidas.includes(area)) {
    return res.status(400).json({
      message: 'El área seleccionada no es válida.',
    });
  }

  if (!estadosPermitidos.includes(estado)) {
    return res.status(400).json({
      message: 'El estado seleccionado no es válido.',
    });
  }

  const duracion = Number(duracion_horas);

  if (Number.isNaN(duracion) || duracion < 0.5 || duracion > 40) {
    return res.status(400).json({
      message: 'La duración debe ser un número entre 0.5 y 40 horas.',
    });
  }

  const sqlCurso = `
    SELECT id, area
    FROM cursos
    WHERE id = ?
  `;

  connection.query(sqlCurso, [id], (err, cursos) => {
    if (err) {
      console.log('Error consultando curso:', err);
      return res.status(500).json({
        message: 'Error interno al consultar el curso.',
      });
    }

    if (cursos.length === 0) {
      return res.status(404).json({
        message: 'El curso no existe.',
      });
    }

    const sqlUsuario = `
      SELECT id, rol, area
      FROM usuarios
      WHERE id = ? AND estado = 'Activo'
    `;

    connection.query(sqlUsuario, [actualizado_por], (err, usuarios) => {
      if (err) {
        console.log('Error validando usuario:', err);
        return res.status(500).json({
          message: 'Error interno al validar el usuario.',
        });
      }

      if (usuarios.length === 0) {
        return res.status(404).json({
          message: 'El usuario que actualiza no existe o está inactivo.',
        });
      }

      const usuarioActualizador = usuarios[0];

      if (usuarioActualizador.rol === 'Empleado') {
        return res.status(403).json({
          message: 'Un empleado no tiene permisos para editar cursos.',
        });
      }

      const esSuperAdmin = usuarioActualizador.rol === 'Super Admin';
      const esAdmin = usuarioActualizador.rol === 'Admin';
      const esSupervisor = usuarioActualizador.rol === 'Supervisor';

      if (!esSuperAdmin && !esAdmin && !esSupervisor) {
        return res.status(403).json({
          message: 'Este usuario no tiene permisos para editar cursos.',
        });
      }

      if (esSupervisor && usuarioActualizador.area !== cursos[0].area) {
        return res.status(403).json({
          message: 'El supervisor solo puede editar cursos de su propia área.',
        });
      }

      if (esSupervisor && area !== usuarioActualizador.area) {
        return res.status(403).json({
          message: 'El supervisor no puede cambiar el curso a un área diferente.',
        });
      }

      const actualizarCurso = () => {
        const sqlUpdate = `
          UPDATE cursos
          SET 
            titulo = ?,
            descripcion = ?,
            area = ?,
            duracion_horas = ?,
            responsable_id = ?,
            estado = ?
          WHERE id = ?
        `;

        const values = [
          titulo,
          descripcion,
          area,
          duracion,
          responsable_id || null,
          estado,
          id,
        ];

        connection.query(sqlUpdate, values, (err) => {
          if (err) {
            console.log('Error actualizando curso:', err);
            return res.status(500).json({
              message: 'Error interno al actualizar el curso.',
            });
          }

          res.json({
            message: 'Curso actualizado correctamente.',
          });
        });
      };

      if (!responsable_id) {
        actualizarCurso();
        return;
      }

      const sqlResponsable = `
        SELECT id, rol, area
        FROM usuarios
        WHERE id = ? AND estado = 'Activo'
      `;

      connection.query(sqlResponsable, [responsable_id], (err, responsables) => {
        if (err) {
          console.log('Error validando responsable:', err);
          return res.status(500).json({
            message: 'Error interno al validar el responsable.',
          });
        }

        if (responsables.length === 0) {
          return res.status(404).json({
            message: 'El responsable seleccionado no existe o está inactivo.',
          });
        }

        const responsable = responsables[0];

        const rolesResponsablePermitidos = [
          'Super Admin',
          'Admin',
          'Supervisor',
        ];

        if (!rolesResponsablePermitidos.includes(responsable.rol)) {
          return res.status(400).json({
            message:
              'El responsable del curso debe ser Super Admin, Admin o Supervisor.',
          });
        }

        const esResponsableSuperAdmin = responsable.rol === 'Super Admin';
        const esResponsableAdmin = responsable.rol === 'Admin';
        const esResponsableSupervisor = responsable.rol === 'Supervisor';

        if (!esResponsableSuperAdmin && !esResponsableAdmin && !esResponsableSupervisor) {
          return res.status(400).json({
            message: 'El responsable del curso debe ser Super Admin, Admin o Supervisor.',
          });
        }

        if (esResponsableSupervisor && responsable.area !== area) {
          return res.status(400).json({
            message: 'El supervisor responsable debe pertenecer a la misma área del curso.',
          });
        }

        actualizarCurso();
      });
    });
  });
});

// Consultar usuarios asignados a un curso
app.get('/api/cursos/:cursoId/asignados', (req, res) => {
  const { cursoId } = req.params;
  const { viewerId } = req.query;

  if (!viewerId) {
    return res.status(400).json({
      message: 'Debe enviar el usuario que consulta la asignación.',
    });
  }

  const sqlViewer = `
    SELECT id, rol, area
    FROM usuarios
    WHERE id = ? AND estado = 'Activo'
  `;

  connection.query(sqlViewer, [viewerId], (err, viewers) => {
    if (err) {
      console.log('Error validando usuario:', err);
      return res.status(500).json({
        message: 'Error interno al validar el usuario.',
      });
    }

    if (viewers.length === 0) {
      return res.status(404).json({
        message: 'El usuario que consulta no existe o está inactivo.',
      });
    }

    const viewer = viewers[0];

    const sqlCurso = `
      SELECT id, area
      FROM cursos
      WHERE id = ?
    `;

    connection.query(sqlCurso, [cursoId], (err, cursos) => {
      if (err) {
        console.log('Error consultando curso:', err);
        return res.status(500).json({
          message: 'Error interno al consultar el curso.',
        });
      }

      if (cursos.length === 0) {
        return res.status(404).json({
          message: 'El curso no existe.',
        });
      }

      const curso = cursos[0];

      if (
        viewer.rol === 'Empleado' ||
        (viewer.rol === 'Supervisor' && viewer.area !== curso.area)
      ) {
        return res.status(403).json({
          message: 'No tienes permisos para consultar las asignaciones de este curso.',
        });
      }

      let sqlAsignados = `
        SELECT 
          a.id AS avance_id,
          a.usuario_id,
          u.nombre,
          u.correo,
          u.rol,
          u.area,
          u.cargo,
          a.porcentaje,
          a.estado,
          a.materiales_revisados,
          a.evaluacion_presentada,
          a.reintento_habilitado,
          a.fecha_habilitacion_reintento,
          a.fecha_actualizacion,

          (
            SELECT COUNT(*)
            FROM resultados_evaluacion re
            INNER JOIN evaluaciones ev ON re.evaluacion_id = ev.id
            WHERE re.usuario_id = u.id
            AND ev.curso_id = a.curso_id
            AND re.estado = 'No aprobado'
          ) AS intentos_fallidos_evaluacion
        FROM avances a
        INNER JOIN usuarios u ON a.usuario_id = u.id
        WHERE a.curso_id = ?
      `;

      const params = [cursoId];

      if (viewer.rol === 'Supervisor') {
        sqlAsignados += `
          AND (
            u.id = ?
            OR (u.rol = 'Empleado' AND u.area = ?)
          )
        `;
        params.push(viewer.id, viewer.area);
      }

      sqlAsignados += `
        ORDER BY u.nombre ASC
      `;

      connection.query(sqlAsignados, params, (err, asignados) => {
        if (err) {
          console.log('Error consultando asignados:', err);
          return res.status(500).json({
            message: 'Error interno al consultar usuarios asignados.',
          });
        }

        res.json(asignados);
      });
    });
  });
});

// Desasignar un curso a un usuario
app.delete('/api/cursos/:cursoId/asignar/:usuarioId', (req, res) => {
  const { cursoId, usuarioId } = req.params;
  const { eliminado_por } = req.body;

  if (!eliminado_por) {
    return res.status(400).json({
      message: 'Debe enviar el usuario que realiza la desasignación.',
    });
  }

  const sqlEliminador = `
    SELECT id, rol, area
    FROM usuarios
    WHERE id = ? AND estado = 'Activo'
  `;

  connection.query(sqlEliminador, [eliminado_por], (err, eliminadores) => {
    if (err) {
      console.log('Error validando usuario:', err);
      return res.status(500).json({
        message: 'Error interno al validar el usuario.',
      });
    }

    if (eliminadores.length === 0) {
      return res.status(404).json({
        message: 'El usuario que desasigna no existe o está inactivo.',
      });
    }

    const eliminador = eliminadores[0];

    if (eliminador.rol === 'Empleado') {
      return res.status(403).json({
        message: 'Un empleado no tiene permisos para desasignar cursos.',
      });
    }

    const sqlDatos = `
      SELECT 
        c.id AS curso_id,
        c.area AS curso_area,
        u.id AS usuario_id,
        u.rol AS usuario_rol,
        u.area AS usuario_area,
        a.estado,
        a.evaluacion_presentada
      FROM avances a
      INNER JOIN cursos c ON a.curso_id = c.id
      INNER JOIN usuarios u ON a.usuario_id = u.id
      WHERE a.curso_id = ?
      AND a.usuario_id = ?
    `;

    connection.query(sqlDatos, [cursoId, usuarioId], (err, registros) => {
      if (err) {
        console.log('Error consultando asignación:', err);
        return res.status(500).json({
          message: 'Error interno al consultar la asignación.',
        });
      }

      if (registros.length === 0) {
        return res.status(404).json({
          message: 'La asignación no existe.',
        });
      }

      const registro = registros[0];

      if (
        eliminador.rol === 'Supervisor' &&
        (
          registro.curso_area !== eliminador.area ||
          registro.usuario_rol !== 'Empleado' ||
          registro.usuario_area !== eliminador.area
        )
      ) {
        return res.status(403).json({
          message: 'El supervisor solo puede desasignar empleados de su propia área.',
        });
      }

      if (registro.evaluacion_presentada || registro.estado === 'Completado') {
        return res.status(400).json({
          message: 'No se puede desasignar un curso con evaluación presentada o completada.',
        });
      }

      const sqlDelete = `
        DELETE FROM avances
        WHERE curso_id = ?
        AND usuario_id = ?
      `;

      connection.query(sqlDelete, [cursoId, usuarioId], (err) => {
        if (err) {
          console.log('Error desasignando curso:', err);
          return res.status(500).json({
            message: 'Error interno al desasignar el curso.',
          });
        }

        res.json({
          message: 'Curso desasignado correctamente.',
        });
      });
    });
  });
});

// Asignar un curso a un usuario
app.post('/api/cursos/:cursoId/asignar', (req, res) => {
  const { cursoId } = req.params;
  const { usuario_id, asignado_por } = req.body;

  if (!usuario_id || !asignado_por) {
    return res.status(400).json({
      message: 'Debe enviar el usuario asignado y el usuario que realiza la asignación.',
    });
  }

  const sqlAsignador = `
    SELECT id, rol, area
    FROM usuarios
    WHERE id = ? AND estado = 'Activo'
  `;

  connection.query(sqlAsignador, [asignado_por], (err, asignadores) => {
    if (err) {
      console.log('Error validando usuario asignador:', err);
      return res.status(500).json({
        message: 'Error interno al validar el usuario que asigna.',
      });
    }

    if (asignadores.length === 0) {
      return res.status(404).json({
        message: 'El usuario que asigna no existe o está inactivo.',
      });
    }

    const asignador = asignadores[0];

    const puedeAsignar =
      asignador.rol === 'Super Admin' ||
      asignador.rol === 'Admin' ||
      asignador.rol === 'Supervisor';

    if (!puedeAsignar) {
      return res.status(403).json({
        message: 'Este usuario no tiene permisos para asignar cursos.',
      });
    }

    const sqlCurso = `
      SELECT id, titulo, area, estado
      FROM cursos
      WHERE id = ?
    `;

    connection.query(sqlCurso, [cursoId], (err, cursos) => {
      if (err) {
        console.log('Error consultando curso:', err);
        return res.status(500).json({
          message: 'Error interno al consultar el curso.',
        });
      }

      if (cursos.length === 0) {
        return res.status(404).json({
          message: 'El curso no existe.',
        });
      }

      const curso = cursos[0];

      if (curso.estado !== 'Disponible') {
        return res.status(400).json({
          message: 'Solo se pueden asignar cursos disponibles.',
        });
      }

      if (asignador.rol === 'Supervisor' && curso.area !== asignador.area) {
        return res.status(403).json({
          message: 'El supervisor solo puede asignar cursos de su propia área.',
        });
      }

      const sqlUsuarioAsignado = `
        SELECT id, nombre, rol, area, estado
        FROM usuarios
        WHERE id = ? AND estado = 'Activo'
      `;

      connection.query(sqlUsuarioAsignado, [usuario_id], (err, usuarios) => {
        if (err) {
          console.log('Error validando usuario asignado:', err);
          return res.status(500).json({
            message: 'Error interno al validar el usuario asignado.',
          });
        }

        if (usuarios.length === 0) {
          return res.status(404).json({
            message: 'El usuario asignado no existe o está inactivo.',
          });
        }

        const usuarioAsignado = usuarios[0];

        if (
          asignador.rol === 'Supervisor' &&
          (
            usuarioAsignado.rol !== 'Empleado' ||
            usuarioAsignado.area !== asignador.area
          )
        ) {
          return res.status(403).json({
            message: 'El supervisor solo puede asignar cursos a empleados de su propia área.',
          });
        }

        const sqlExiste = `
          SELECT id
          FROM avances
          WHERE usuario_id = ? AND curso_id = ?
        `;

        connection.query(sqlExiste, [usuario_id, cursoId], (err, existentes) => {
          if (err) {
            console.log('Error validando asignación existente:', err);
            return res.status(500).json({
              message: 'Error interno al validar la asignación.',
            });
          }

          if (existentes.length > 0) {
            return res.status(400).json({
              message: 'Este curso ya se encuentra asignado al usuario seleccionado.',
            });
          }

          const sqlInsert = `
            INSERT INTO avances
            (usuario_id, curso_id, porcentaje, estado, materiales_revisados, evaluacion_presentada)
            VALUES (?, ?, 0, 'Pendiente', FALSE, FALSE)
          `;

          connection.query(sqlInsert, [usuario_id, cursoId], (err, result) => {
            if (err) {
              console.log('Error asignando curso:', err);
              return res.status(500).json({
                message: 'Error interno al asignar el curso.',
              });
            }

            res.status(201).json({
              message: 'Curso asignado correctamente.',
              asignacionId: result.insertId,
            });
          });
        });
      });
    });
  });
});

// =========================
// AVANCES
// =========================
app.get('/api/avances/usuario/:usuarioId', (req, res) => {
  const { usuarioId } = req.params;

  const sql = `
    SELECT 
      avances.id,
      avances.usuario_id,
      avances.curso_id,
      avances.porcentaje,
      avances.estado,
      avances.materiales_revisados,
      avances.evaluacion_presentada,
      avances.fecha_actualizacion,
      cursos.titulo AS curso,
      cursos.area,
      cursos.duracion_horas
    FROM avances
    INNER JOIN cursos ON avances.curso_id = cursos.id
    WHERE avances.usuario_id = ?
    ORDER BY cursos.titulo ASC
  `;

  connection.query(sql, [usuarioId], (err, results) => {
    if (err) {
      console.log('Error consultando avances:', err);
      return res.status(500).json({
        message: 'Error interno al consultar los avances',
      });
    }

    res.json(results);
  });
});

// Consultar avances visibles según el rol del usuario activo
app.get('/api/avances/visibles', (req, res) => {
  const { viewerId } = req.query;

  if (!viewerId) {
    return res.status(400).json({
      message: 'Debe enviar el usuario que está consultando los avances.',
    });
  }

  const sqlViewer = `
    SELECT id, nombre, rol, area
    FROM usuarios
    WHERE id = ? AND estado = 'Activo'
  `;

  connection.query(sqlViewer, [viewerId], (err, viewers) => {
    if (err) {
      console.log('Error validando usuario consultante:', err);
      return res.status(500).json({
        message: 'Error interno al validar el usuario consultante.',
      });
    }

    if (viewers.length === 0) {
      return res.status(404).json({
        message: 'El usuario consultante no existe o está inactivo.',
      });
    }

    const viewer = viewers[0];

    let sql = `
      SELECT 
        a.id,
        a.usuario_id,
        u.nombre AS usuario,
        u.correo,
        u.rol AS usuario_rol,
        u.area AS usuario_area,
        u.cargo AS usuario_cargo,
        a.curso_id,
        c.titulo AS curso,
        c.area AS curso_area,
        c.duracion_horas,
        a.porcentaje,
        a.estado,
        a.materiales_revisados,
        a.evaluacion_presentada,
        a.fecha_actualizacion
      FROM avances a
      INNER JOIN usuarios u ON a.usuario_id = u.id
      INNER JOIN cursos c ON a.curso_id = c.id
      WHERE u.estado = 'Activo'
    `;

    const params = [];

    if (viewer.rol === 'Empleado') {
      sql += `
        AND a.usuario_id = ?
      `;
      params.push(viewer.id);
    }

    if (viewer.rol === 'Supervisor') {
      sql += `
        AND (
          u.id = ?
          OR (u.rol = 'Empleado' AND u.area = ?)
        )
      `;
      params.push(viewer.id, viewer.area);
    }

    sql += `
      ORDER BY u.nombre ASC, c.titulo ASC
    `;

    connection.query(sql, params, (err, results) => {
      if (err) {
        console.log('Error consultando avances visibles:', err);
        return res.status(500).json({
          message: 'Error interno al consultar los avances visibles.',
        });
      }

      res.json(results);
    });
  });
});

// Habilitar reintento de evaluación para un avance no aprobado
app.patch('/api/avances/:avanceId/habilitar-reintento', (req, res) => {
  const { avanceId } = req.params;
  const { habilitado_por } = req.body;

  if (!habilitado_por) {
    return res.status(400).json({
      message: 'Debe enviar el usuario que habilita el reintento.',
    });
  }

  const sqlHabilitador = `
    SELECT id, rol, area
    FROM usuarios
    WHERE id = ? AND estado = 'Activo'
  `;

  connection.query(sqlHabilitador, [habilitado_por], (err, habilitadores) => {
    if (err) {
      console.log('Error validando usuario habilitador:', err);
      return res.status(500).json({
        message: 'Error interno al validar el usuario habilitador.',
      });
    }

    if (habilitadores.length === 0) {
      return res.status(404).json({
        message: 'El usuario que habilita no existe o está inactivo.',
      });
    }

    const habilitador = habilitadores[0];

    if (habilitador.rol === 'Empleado') {
      return res.status(403).json({
        message: 'Un empleado no tiene permisos para habilitar reintentos.',
      });
    }

    const sqlAvance = `
      SELECT 
        a.id,
        a.usuario_id,
        a.curso_id,
        a.estado,
        a.porcentaje,
        a.reintento_habilitado,
        u.rol AS usuario_rol,
        u.area AS usuario_area,
        c.area AS curso_area,
        c.titulo AS curso
      FROM avances a
      INNER JOIN usuarios u ON a.usuario_id = u.id
      INNER JOIN cursos c ON a.curso_id = c.id
      WHERE a.id = ?
    `;

    connection.query(sqlAvance, [avanceId], (err, avances) => {
      if (err) {
        console.log('Error consultando avance:', err);
        return res.status(500).json({
          message: 'Error interno al consultar el avance.',
        });
      }

      if (avances.length === 0) {
        return res.status(404).json({
          message: 'El avance no existe.',
        });
      }

      const avance = avances[0];

      if (avance.estado !== 'Evaluacion no aprobada') {
        return res.status(400).json({
          message:
            'Solo se puede habilitar reintento para evaluaciones no aprobadas.',
        });
      }

      if (avance.reintento_habilitado) {
        return res.status(400).json({
          message: 'El reintento ya se encuentra habilitado.',
        });
      }

      if (habilitador.rol === 'Supervisor') {
        const puedeHabilitar =
          avance.usuario_rol === 'Empleado' &&
          avance.usuario_area === habilitador.area &&
          avance.curso_area === habilitador.area;

        if (!puedeHabilitar) {
          return res.status(403).json({
            message:
              'El supervisor solo puede habilitar reintentos de empleados de su propia área.',
          });
        }
      }

      const sqlUpdate = `
        UPDATE avances
        SET
          reintento_habilitado = TRUE,
          reintento_habilitado_por = ?,
          fecha_habilitacion_reintento = NOW(),
          fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      connection.query(sqlUpdate, [habilitado_por, avanceId], (err) => {
        if (err) {
          console.log('Error habilitando reintento:', err);
          return res.status(500).json({
            message: 'Error interno al habilitar el reintento.',
          });
        }

        res.json({
          message: 'Reintento de evaluación habilitado correctamente.',
          avanceId: Number(avanceId),
          curso: avance.curso,
        });
      });
    });
  });
});

// =========================
// MATERIALES
// =========================

// Consultar materiales de aprendizaje de un curso con progreso del usuario
app.get('/api/cursos/:cursoId/aprendizaje', (req, res) => {
  const { cursoId } = req.params;
  const { usuarioId } = req.query;

  if (!usuarioId) {
    return res.status(400).json({
      message: 'Debe enviar el usuario que está iniciando el curso.',
    });
  }

  const sqlAvance = `
    SELECT 
      a.id,
      a.usuario_id,
      a.curso_id,
      a.porcentaje,
      a.estado,
      a.materiales_revisados,
      a.evaluacion_presentada,
      c.titulo AS curso,
      c.descripcion,
      c.area,
      c.duracion_horas
    FROM avances a
    INNER JOIN cursos c ON a.curso_id = c.id
    WHERE a.usuario_id = ?
    AND a.curso_id = ?
  `;

  connection.query(sqlAvance, [usuarioId, cursoId], (err, avances) => {
    if (err) {
      console.log('Error consultando avance del curso:', err);
      return res.status(500).json({
        message: 'Error interno al consultar el avance del curso.',
      });
    }

    if (avances.length === 0) {
      return res.status(403).json({
        message: 'Este curso no está asignado al usuario.',
      });
    }

    const avance = avances[0];

    const sqlMateriales = `
      SELECT 
        m.id,
        m.curso_id,
        m.titulo,
        m.descripcion,
        m.tipo,
        m.nombre_archivo,
        m.ruta_archivo,
        m.mime_type,
        m.tamano_bytes,
        m.fecha_subida,
        COALESCE(pm.completado, FALSE) AS completado,
        pm.fecha_completado
      FROM materiales m
      LEFT JOIN progreso_materiales pm
        ON m.id = pm.material_id
        AND pm.usuario_id = ?
      WHERE m.curso_id = ?
      AND m.estado = 'Activo'

      ORDER BY m.fecha_subida ASC, m.id ASC
    `;

    connection.query(sqlMateriales, [usuarioId, cursoId], (err, materiales) => {
      if (err) {
        console.log('Error consultando materiales de aprendizaje:', err);
        return res.status(500).json({
          message: 'Error interno al consultar los materiales del curso.',
        });
      }

      const totalMateriales = materiales.length;
      const materialesCompletados = materiales.filter(
        (material) => Boolean(material.completado)
      ).length;

      const porcentajeMateriales =
        totalMateriales === 0
          ? 0
          : Math.round((materialesCompletados / totalMateriales) * 100);

      const siguientePendienteIndex = materiales.findIndex(
        (material) => !material.completado
      );

      res.json({
        avance,
        materiales,
        resumen: {
          totalMateriales,
          materialesCompletados,
          porcentajeMateriales,
          siguientePendienteIndex:
            siguientePendienteIndex === -1 ? null : siguientePendienteIndex,
          todosCompletados:
            totalMateriales > 0 && materialesCompletados === totalMateriales,
        },
      });
    });
  });
});

app.get('/api/materiales/:cursoId', (req, res) => {
  const { cursoId } = req.params;

  const sql = `
  SELECT 
    materiales.id,
    materiales.curso_id,
    materiales.titulo,
    materiales.descripcion,
    materiales.tipo,
    materiales.nombre_archivo,
    materiales.ruta_archivo,
    materiales.mime_type,
    materiales.tamano_bytes,
    materiales.fecha_subida,
    materiales.estado,
    usuarios.nombre AS subido_por_nombre
    FROM materiales
    LEFT JOIN usuarios ON materiales.subido_por = usuarios.id
    WHERE materiales.curso_id = ?
    AND materiales.estado = 'Activo'
    ORDER BY materiales.fecha_subida DESC
  `;

  connection.query(sql, [cursoId], (err, results) => {
    if (err) {
      console.log('Error consultando materiales:', err);
      return res.status(500).json({
        message: 'Error interno al consultar los materiales',
      });
    }

    res.json(results);
  });
});

// Activar o inactivar material de un curso
app.patch('/api/materiales/:materialId/estado', (req, res) => {
  const { materialId } = req.params;
  const { estado, actualizado_por } = req.body;

  if (!estado || !actualizado_por) {
    return res.status(400).json({
      message: 'Debe enviar estado y usuario que actualiza el material.',
    });
  }

  const estadosPermitidos = ['Activo', 'Inactivo'];

  if (!estadosPermitidos.includes(estado)) {
    return res.status(400).json({
      message: 'El estado enviado no es válido.',
    });
  }

  const sqlEditor = `
    SELECT id, rol, area
    FROM usuarios
    WHERE id = ? AND estado = 'Activo'
  `;

  connection.query(sqlEditor, [actualizado_por], (err, editores) => {
    if (err) {
      console.log('Error validando editor de material:', err);
      return res.status(500).json({
        message: 'Error interno al validar el usuario.',
      });
    }

    if (editores.length === 0) {
      return res.status(404).json({
        message: 'El usuario que actualiza no existe o está inactivo.',
      });
    }

    const editor = editores[0];

    if (editor.rol === 'Empleado') {
      return res.status(403).json({
        message: 'Un empleado no tiene permisos para eliminar materiales.',
      });
    }

    const sqlMaterial = `
      SELECT 
        m.id,
        m.curso_id,
        m.titulo,
        m.estado,
        c.area AS curso_area
      FROM materiales m
      INNER JOIN cursos c ON m.curso_id = c.id
      WHERE m.id = ?
    `;

    connection.query(sqlMaterial, [materialId], (err, materiales) => {
      if (err) {
        console.log('Error consultando material:', err);
        return res.status(500).json({
          message: 'Error interno al consultar el material.',
        });
      }

      if (materiales.length === 0) {
        return res.status(404).json({
          message: 'El material no existe.',
        });
      }

      const material = materiales[0];

      if (
        editor.rol === 'Supervisor' &&
        editor.area !== material.curso_area
      ) {
        return res.status(403).json({
          message:
            'El supervisor solo puede eliminar materiales de cursos de su propia área.',
        });
      }

      const sqlUpdate = `
        UPDATE materiales
        SET estado = ?
        WHERE id = ?
      `;

      connection.query(sqlUpdate, [estado, materialId], (err) => {
        if (err) {
          console.log('Error actualizando estado del material:', err);
          return res.status(500).json({
            message: 'Error interno al actualizar el material.',
          });
        }

        res.json({
          message:
            estado === 'Inactivo'
              ? 'Material eliminado correctamente.'
              : 'Material activado correctamente.',
        });
      });
    });
  });
});

// Marcar un material como completado dentro del aprendizaje del curso
app.post('/api/materiales/:materialId/completar', (req, res) => {
  const { materialId } = req.params;
  const { usuario_id, curso_id } = req.body;

  if (!usuario_id || !curso_id) {
    return res.status(400).json({
      message: 'Debe enviar usuario y curso para completar el material.',
    });
  }

  const sqlValidarAsignacion = `
    SELECT id, porcentaje, estado
    FROM avances
    WHERE usuario_id = ?
    AND curso_id = ?
  `;

  connection.query(
    sqlValidarAsignacion,
    [usuario_id, curso_id],
    (err, avances) => {
      if (err) {
        console.log('Error validando asignación del curso:', err);
        return res.status(500).json({
          message: 'Error interno al validar la asignación del curso.',
        });
      }

      if (avances.length === 0) {
        return res.status(403).json({
          message: 'Este curso no está asignado al usuario.',
        });
      }

      const sqlMaterial = `
        SELECT id, curso_id
        FROM materiales
        WHERE id = ?
        AND curso_id = ?
        AND estado = 'Activo'
      `;

      connection.query(sqlMaterial, [materialId, curso_id], (err, materiales) => {
        if (err) {
          console.log('Error validando material:', err);
          return res.status(500).json({
            message: 'Error interno al validar el material.',
          });
        }

        if (materiales.length === 0) {
          return res.status(404).json({
            message: 'El material no existe o no pertenece al curso seleccionado.',
          });
        }

        const sqlInsertProgreso = `
          INSERT INTO progreso_materiales
          (usuario_id, curso_id, material_id, completado, fecha_completado)
          VALUES (?, ?, ?, TRUE, NOW())
          ON DUPLICATE KEY UPDATE
            completado = TRUE,
            fecha_completado = NOW()
        `;

        connection.query(
          sqlInsertProgreso,
          [usuario_id, curso_id, materialId],
          (err) => {
            if (err) {
              console.log('Error guardando progreso del material:', err);
              return res.status(500).json({
                message: 'Error interno al guardar el progreso del material.',
              });
            }

            const sqlConteo = `
              SELECT 
                (SELECT COUNT(*) FROM materiales WHERE curso_id = ? AND estado = 'Activo') AS total_materiales,
                (
                  SELECT COUNT(*)
                  FROM progreso_materiales
                  WHERE usuario_id = ?
                  AND curso_id = ?
                  AND completado = TRUE
                ) AS materiales_completados
            `;

            connection.query(
              sqlConteo,
              [curso_id, usuario_id, curso_id],
              (err, conteos) => {
                if (err) {
                  console.log('Error calculando progreso de materiales:', err);
                  return res.status(500).json({
                    message:
                      'El material se completó, pero no fue posible recalcular el avance.',
                  });
                }

                const totalMateriales = conteos[0].total_materiales;
                const materialesCompletados = conteos[0].materiales_completados;

                const todosCompletados =
                  totalMateriales > 0 &&
                  Number(totalMateriales) === Number(materialesCompletados);

                if (!todosCompletados) {
                  return res.json({
                    message: 'Material marcado como completado.',
                    totalMateriales,
                    materialesCompletados,
                    todosCompletados: false,
                  });
                }

                const sqlActualizarAvance = `
                  UPDATE avances
                  SET
                    porcentaje = IF(porcentaje < 50, 50, porcentaje),
                    estado = IF(porcentaje < 50, 'En progreso', estado),
                    materiales_revisados = TRUE,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                  WHERE usuario_id = ?
                  AND curso_id = ?
                `;

                connection.query(
                  sqlActualizarAvance,
                  [usuario_id, curso_id],
                  (err) => {
                    if (err) {
                      console.log('Error actualizando avance del curso:', err);
                      return res.status(500).json({
                        message:
                          'El material se completó, pero no se pudo actualizar el avance.',
                      });
                    }

                    res.json({
                      message:
                        'Material completado. Todos los materiales del curso fueron revisados.',
                      totalMateriales,
                      materialesCompletados,
                      todosCompletados: true,
                      avance: 50,
                    });
                  }
                );
              }
            );
          }
        );
      });
    }
  );
});

app.post('/api/materiales/:cursoId', upload.single('archivo'), (req, res) => {
  const { cursoId } = req.params;
  const { titulo, descripcion, subido_por } = req.body;

  if (!req.file) {
    return res.status(400).json({
      message: 'Debe seleccionar un archivo PDF o video.',
    });
  }

  if (!titulo || !subido_por) {
    return res.status(400).json({
      message: 'El título y el usuario que sube el archivo son obligatorios.',
    });
  }

  let tipo = 'OTRO';

  if (req.file.mimetype === 'application/pdf') {
    tipo = 'PDF';
  }

  if (req.file.mimetype.startsWith('video/')) {
    tipo = 'VIDEO';
  }

  const sql = `
    INSERT INTO materiales
    (curso_id, titulo, descripcion, tipo, nombre_archivo, ruta_archivo, mime_type, tamano_bytes, subido_por)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    cursoId,
    titulo,
    descripcion || '',
    tipo,
    req.file.filename,
    `/uploads/${req.file.filename}`,
    req.file.mimetype,
    req.file.size,
    subido_por,
  ];

  connection.query(sql, values, (err, result) => {
    if (err) {
      console.log('Error guardando material:', err);
      return res.status(500).json({
        message: 'Error interno al guardar el material.',
      });
    }

    res.status(201).json({
      message: 'Material cargado correctamente.',
      materialId: result.insertId,
    });
  });
});

// =========================
// EVALUACIONES
// =========================

// Crear pregunta manualmente para una evaluación
app.post('/api/evaluaciones/:evaluacionId/preguntas', async (req, res) => {
  const { evaluacionId } = req.params;

  let {
    texto_pregunta,
    opcion_a,
    opcion_b,
    opcion_c,
    opcion_d,
    respuesta_correcta,
    estado,
    ponderacion,
    creado_por,
  } = req.body;

  if (!creado_por) {
    return res.status(400).json({
      message: 'Debe enviar el usuario que crea la pregunta.',
    });
  }

  texto_pregunta = texto_pregunta ? texto_pregunta.trim() : '';
  opcion_a = opcion_a ? opcion_a.trim() : '';
  opcion_b = opcion_b ? opcion_b.trim() : '';
  opcion_c = opcion_c ? opcion_c.trim() : '';
  opcion_d = opcion_d ? opcion_d.trim() : '';
  respuesta_correcta = respuesta_correcta ? respuesta_correcta.trim().toUpperCase() : '';
  estado = estado || 'Activa';

  const peso = ponderacion ? Number(ponderacion) : 1;

  const respuestasPermitidas = ['A', 'B', 'C', 'D'];
  const estadosPermitidos = ['Activa', 'Inactiva'];

  if (
    !texto_pregunta ||
    !opcion_a ||
    !opcion_b ||
    !opcion_c ||
    !opcion_d ||
    !respuesta_correcta
  ) {
    return res.status(400).json({
      message: 'La pregunta, las cuatro opciones y la respuesta correcta son obligatorias.',
    });
  }

  if (texto_pregunta.length < 10 || texto_pregunta.length > 1000) {
    return res.status(400).json({
      message: 'La pregunta debe tener entre 10 y 1000 caracteres.',
    });
  }

  if (!respuestasPermitidas.includes(respuesta_correcta)) {
    return res.status(400).json({
      message: 'La respuesta correcta debe ser A, B, C o D.',
    });
  }

  if (!estadosPermitidos.includes(estado)) {
    return res.status(400).json({
      message: 'El estado enviado no es válido.',
    });
  }

  if (Number.isNaN(peso) || peso <= 0 || peso > 100) {
    return res.status(400).json({
      message: 'La ponderación debe ser un número mayor a 0 y máximo 100.',
    });
  }

  try {
    const evaluaciones = await dbQuery(
      `
      SELECT id, curso_id
      FROM evaluaciones
      WHERE id = ?
      `,
      [evaluacionId]
    );

    if (evaluaciones.length === 0) {
      return res.status(404).json({
        message: 'La evaluación no existe.',
      });
    }

    const evaluacion = evaluaciones[0];

    await validarPermisoGestionEvaluacion(evaluacion.curso_id, creado_por);

    const result = await dbQuery(
      `
      INSERT INTO preguntas
      (
        evaluacion_id,
        texto_pregunta,
        opcion_a,
        opcion_b,
        opcion_c,
        opcion_d,
        respuesta_correcta,
        estado,
        ponderacion
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        evaluacionId,
        texto_pregunta,
        opcion_a,
        opcion_b,
        opcion_c,
        opcion_d,
        respuesta_correcta,
        estado,
        peso,
      ]
    );

    res.status(201).json({
      message: 'Pregunta creada correctamente.',
      preguntaId: result.insertId,
    });
  } catch (error) {
    console.log('Error creando pregunta:', error);

    res.status(error.status || 500).json({
      message: error.message || 'Error interno al crear la pregunta.',
    });
  }
});

// Cargar preguntas por CSV
app.post(
  '/api/evaluaciones/:evaluacionId/preguntas/csv',
  csvUpload.single('archivo'),
  async (req, res) => {
    const { evaluacionId } = req.params;
    const { cargado_por } = req.body;

    if (!cargado_por) {
      return res.status(400).json({
        message: 'Debe enviar el usuario que carga las preguntas.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'Debe seleccionar un archivo CSV.',
      });
    }

    try {
      const evaluaciones = await dbQuery(
        `
        SELECT id, curso_id
        FROM evaluaciones
        WHERE id = ?
        `,
        [evaluacionId]
      );

      if (evaluaciones.length === 0) {
        return res.status(404).json({
          message: 'La evaluación no existe.',
        });
      }

      const evaluacion = evaluaciones[0];

      await validarPermisoGestionEvaluacion(evaluacion.curso_id, cargado_por);

      const filas = parseCsvPreguntas(req.file.buffer);

      const respuestasPermitidas = ['A', 'B', 'C', 'D'];
      const estadosPermitidos = ['Activa', 'Inactiva'];

      const errores = [];
      const preguntasValidas = [];

      filas.forEach((fila) => {
        const textoPregunta = fila.texto_pregunta?.trim() || '';
        const opcionA = fila.opcion_a?.trim() || '';
        const opcionB = fila.opcion_b?.trim() || '';
        const opcionC = fila.opcion_c?.trim() || '';
        const opcionD = fila.opcion_d?.trim() || '';
        const respuestaCorrecta = fila.respuesta_correcta
          ? fila.respuesta_correcta.trim().toUpperCase()
          : '';

        const estado = fila.estado?.trim() || 'Activa';
        const ponderacion = fila.ponderacion ? Number(fila.ponderacion) : 1;

        if (
          !textoPregunta ||
          !opcionA ||
          !opcionB ||
          !opcionC ||
          !opcionD ||
          !respuestaCorrecta
        ) {
          errores.push(
            `Fila ${fila.numero_fila}: faltan datos obligatorios.`
          );
        }

        if (textoPregunta && (textoPregunta.length < 10 || textoPregunta.length > 1000)) {
          errores.push(
            `Fila ${fila.numero_fila}: la pregunta debe tener entre 10 y 1000 caracteres.`
          );
        }

        if (respuestaCorrecta && !respuestasPermitidas.includes(respuestaCorrecta)) {
          errores.push(
            `Fila ${fila.numero_fila}: la respuesta correcta debe ser A, B, C o D.`
          );
        }

        if (!estadosPermitidos.includes(estado)) {
          errores.push(
            `Fila ${fila.numero_fila}: el estado debe ser Activa o Inactiva.`
          );
        }

        if (Number.isNaN(ponderacion) || ponderacion <= 0 || ponderacion > 100) {
          errores.push(
            `Fila ${fila.numero_fila}: la ponderación debe ser mayor a 0 y máximo 100.`
          );
        }

        preguntasValidas.push([
          evaluacionId,
          textoPregunta,
          opcionA,
          opcionB,
          opcionC,
          opcionD,
          respuestaCorrecta,
          estado,
          ponderacion,
        ]);
      });

      if (errores.length > 0) {
        return res.status(400).json({
          message: 'El archivo contiene errores. No se cargaron preguntas.',
          errores,
        });
      }

      if (preguntasValidas.length === 0) {
        return res.status(400).json({
          message: 'No se encontraron preguntas válidas para cargar.',
        });
      }

      await dbQuery(
        `
        INSERT INTO preguntas
        (
          evaluacion_id,
          texto_pregunta,
          opcion_a,
          opcion_b,
          opcion_c,
          opcion_d,
          respuesta_correcta,
          estado,
          ponderacion
        )
        VALUES ?
        `,
        [preguntasValidas]
      );

      res.status(201).json({
        message: 'Preguntas cargadas correctamente desde CSV.',
        totalCargadas: preguntasValidas.length,
      });
    } catch (error) {
      console.log('Error cargando preguntas por CSV:', error);

      res.status(error.status || 500).json({
        message:
          error.message || 'Error interno al cargar las preguntas por CSV.',
      });
    }
  }
);

// Editar pregunta existente
app.put('/api/preguntas/:preguntaId', async (req, res) => {
  const { preguntaId } = req.params;

  let {
    texto_pregunta,
    opcion_a,
    opcion_b,
    opcion_c,
    opcion_d,
    respuesta_correcta,
    estado,
    ponderacion,
    actualizado_por,
  } = req.body;

  if (!actualizado_por) {
    return res.status(400).json({
      message: 'Debe enviar el usuario que actualiza la pregunta.',
    });
  }

  texto_pregunta = texto_pregunta ? texto_pregunta.trim() : '';
  opcion_a = opcion_a ? opcion_a.trim() : '';
  opcion_b = opcion_b ? opcion_b.trim() : '';
  opcion_c = opcion_c ? opcion_c.trim() : '';
  opcion_d = opcion_d ? opcion_d.trim() : '';
  respuesta_correcta = respuesta_correcta ? respuesta_correcta.trim().toUpperCase() : '';
  estado = estado || 'Activa';

  const peso = ponderacion ? Number(ponderacion) : 1;
  const respuestasPermitidas = ['A', 'B', 'C', 'D'];
  const estadosPermitidos = ['Activa', 'Inactiva'];

  if (
    !texto_pregunta ||
    !opcion_a ||
    !opcion_b ||
    !opcion_c ||
    !opcion_d ||
    !respuesta_correcta
  ) {
    return res.status(400).json({
      message: 'La pregunta, las cuatro opciones y la respuesta correcta son obligatorias.',
    });
  }

  if (texto_pregunta.length < 10 || texto_pregunta.length > 1000) {
    return res.status(400).json({
      message: 'La pregunta debe tener entre 10 y 1000 caracteres.',
    });
  }

  if (!respuestasPermitidas.includes(respuesta_correcta)) {
    return res.status(400).json({
      message: 'La respuesta correcta debe ser A, B, C o D.',
    });
  }

  if (!estadosPermitidos.includes(estado)) {
    return res.status(400).json({
      message: 'El estado enviado no es válido.',
    });
  }

  if (Number.isNaN(peso) || peso <= 0 || peso > 100) {
    return res.status(400).json({
      message: 'La ponderación debe ser un número mayor a 0 y máximo 100.',
    });
  }

  try {
    const preguntas = await dbQuery(
      `
      SELECT 
        p.id,
        p.evaluacion_id,
        e.curso_id
      FROM preguntas p
      INNER JOIN evaluaciones e ON p.evaluacion_id = e.id
      WHERE p.id = ?
      `,
      [preguntaId]
    );

    if (preguntas.length === 0) {
      return res.status(404).json({
        message: 'La pregunta no existe.',
      });
    }

    const pregunta = preguntas[0];

    await validarPermisoGestionEvaluacion(pregunta.curso_id, actualizado_por);

    await dbQuery(
      `
      UPDATE preguntas
      SET
        texto_pregunta = ?,
        opcion_a = ?,
        opcion_b = ?,
        opcion_c = ?,
        opcion_d = ?,
        respuesta_correcta = ?,
        estado = ?,
        ponderacion = ?
      WHERE id = ?
      `,
      [
        texto_pregunta,
        opcion_a,
        opcion_b,
        opcion_c,
        opcion_d,
        respuesta_correcta,
        estado,
        peso,
        preguntaId,
      ]
    );

    res.json({
      message: 'Pregunta actualizada correctamente.',
    });
  } catch (error) {
    console.log('Error actualizando pregunta:', error);

    res.status(error.status || 500).json({
      message: error.message || 'Error interno al actualizar la pregunta.',
    });
  }
});

// Activar o inactivar pregunta
app.patch('/api/preguntas/:preguntaId/estado', async (req, res) => {
  const { preguntaId } = req.params;
  const { estado, actualizado_por } = req.body;

  if (!estado || !actualizado_por) {
    return res.status(400).json({
      message: 'Debe enviar estado y usuario que actualiza la pregunta.',
    });
  }

  const estadosPermitidos = ['Activa', 'Inactiva'];

  if (!estadosPermitidos.includes(estado)) {
    return res.status(400).json({
      message: 'El estado enviado no es válido.',
    });
  }

  try {
    const preguntas = await dbQuery(
      `
      SELECT 
        p.id,
        p.evaluacion_id,
        e.curso_id
      FROM preguntas p
      INNER JOIN evaluaciones e ON p.evaluacion_id = e.id
      WHERE p.id = ?
      `,
      [preguntaId]
    );

    if (preguntas.length === 0) {
      return res.status(404).json({
        message: 'La pregunta no existe.',
      });
    }

    const pregunta = preguntas[0];

    await validarPermisoGestionEvaluacion(pregunta.curso_id, actualizado_por);

    await dbQuery(
      `
      UPDATE preguntas
      SET estado = ?
      WHERE id = ?
      `,
      [estado, preguntaId]
    );

    res.json({
      message:
        estado === 'Activa'
          ? 'Pregunta activada correctamente.'
          : 'Pregunta inactivada correctamente.',
    });
  } catch (error) {
    console.log('Error actualizando estado de pregunta:', error);

    res.status(error.status || 500).json({
      message:
        error.message || 'Error interno al actualizar el estado de la pregunta.',
    });
  }
});

// Consultar evaluación de un curso para administración
app.get('/api/evaluaciones/admin/curso/:cursoId', async (req, res) => {
  const { cursoId } = req.params;
  const { viewerId } = req.query;

  if (!viewerId) {
    return res.status(400).json({
      message: 'Debe enviar el usuario que consulta la evaluación.',
    });
  }

  try {
    await validarPermisoGestionEvaluacion(cursoId, viewerId);

    const evaluaciones = await dbQuery(
      `
      SELECT 
        id,
        curso_id,
        titulo,
        puntaje_minimo,
        estado
      FROM evaluaciones
      WHERE curso_id = ?
      ORDER BY 
        CASE WHEN estado = 'Activa' THEN 0 ELSE 1 END,
        id DESC
      LIMIT 1
      `,
      [cursoId]
    );

    if (evaluaciones.length === 0) {
      return res.json({
        evaluacion: null,
        preguntas: [],
      });
    }

    const evaluacion = evaluaciones[0];

    const preguntas = await dbQuery(
      `
      SELECT 
        id,
        evaluacion_id,
        texto_pregunta,
        opcion_a,
        opcion_b,
        opcion_c,
        opcion_d,
        respuesta_correcta,
        estado,
        ponderacion
      FROM preguntas
      WHERE evaluacion_id = ?
      ORDER BY id ASC
      `,
      [evaluacion.id]
    );

    res.json({
      evaluacion,
      preguntas,
    });
  } catch (error) {
    console.log('Error consultando evaluación administrativa:', error);

    res.status(error.status || 500).json({
      message:
        error.message || 'Error interno al consultar la evaluación del curso.',
    });
  }
});

// Crear evaluación para un curso
app.post('/api/evaluaciones/curso/:cursoId', async (req, res) => {
  const { cursoId } = req.params;
  let { titulo, puntaje_minimo, estado, creado_por } = req.body;

  if (!creado_por) {
    return res.status(400).json({
      message: 'Debe enviar el usuario que crea la evaluación.',
    });
  }

  titulo = titulo ? titulo.trim() : '';
  estado = estado || 'Activa';

  const estadosPermitidos = ['Activa', 'Inactiva'];

  if (!titulo || !puntaje_minimo || !estado) {
    return res.status(400).json({
      message: 'Título, puntaje mínimo y estado son obligatorios.',
    });
  }

  if (titulo.length < 5 || titulo.length > 150) {
    return res.status(400).json({
      message: 'El título debe tener entre 5 y 150 caracteres.',
    });
  }

  const puntaje = Number(puntaje_minimo);

  if (Number.isNaN(puntaje) || puntaje < 1 || puntaje > 100) {
    return res.status(400).json({
      message: 'El puntaje mínimo debe ser un número entre 1 y 100.',
    });
  }

  if (!estadosPermitidos.includes(estado)) {
    return res.status(400).json({
      message: 'El estado enviado no es válido.',
    });
  }

  try {
    await validarPermisoGestionEvaluacion(cursoId, creado_por);

    if (estado === 'Activa') {
      await dbQuery(
        `
        UPDATE evaluaciones
        SET estado = 'Inactiva'
        WHERE curso_id = ?
        `,
        [cursoId]
      );
    }

    const result = await dbQuery(
      `
      INSERT INTO evaluaciones
      (curso_id, titulo, puntaje_minimo, estado)
      VALUES (?, ?, ?, ?)
      `,
      [cursoId, titulo, puntaje, estado]
    );

    res.status(201).json({
      message: 'Evaluación creada correctamente.',
      evaluacionId: result.insertId,
    });
  } catch (error) {
    console.log('Error creando evaluación:', error);

    res.status(error.status || 500).json({
      message: error.message || 'Error interno al crear la evaluación.',
    });
  }
});

// Editar evaluación existente
app.put('/api/evaluaciones/:evaluacionId', async (req, res) => {
  const { evaluacionId } = req.params;
  let { titulo, puntaje_minimo, estado, actualizado_por } = req.body;

  if (!actualizado_por) {
    return res.status(400).json({
      message: 'Debe enviar el usuario que actualiza la evaluación.',
    });
  }

  titulo = titulo ? titulo.trim() : '';
  estado = estado || 'Activa';

  const estadosPermitidos = ['Activa', 'Inactiva'];

  if (!titulo || !puntaje_minimo || !estado) {
    return res.status(400).json({
      message: 'Título, puntaje mínimo y estado son obligatorios.',
    });
  }

  if (titulo.length < 5 || titulo.length > 150) {
    return res.status(400).json({
      message: 'El título debe tener entre 5 y 150 caracteres.',
    });
  }

  const puntaje = Number(puntaje_minimo);

  if (Number.isNaN(puntaje) || puntaje < 1 || puntaje > 100) {
    return res.status(400).json({
      message: 'El puntaje mínimo debe ser un número entre 1 y 100.',
    });
  }

  if (!estadosPermitidos.includes(estado)) {
    return res.status(400).json({
      message: 'El estado enviado no es válido.',
    });
  }

  try {
    const evaluaciones = await dbQuery(
      `
      SELECT id, curso_id
      FROM evaluaciones
      WHERE id = ?
      `,
      [evaluacionId]
    );

    if (evaluaciones.length === 0) {
      return res.status(404).json({
        message: 'La evaluación no existe.',
      });
    }

    const evaluacionActual = evaluaciones[0];

    await validarPermisoGestionEvaluacion(
      evaluacionActual.curso_id,
      actualizado_por
    );

    if (estado === 'Activa') {
      await dbQuery(
        `
        UPDATE evaluaciones
        SET estado = 'Inactiva'
        WHERE curso_id = ?
        AND id <> ?
        `,
        [evaluacionActual.curso_id, evaluacionId]
      );
    }

    await dbQuery(
      `
      UPDATE evaluaciones
      SET 
        titulo = ?,
        puntaje_minimo = ?,
        estado = ?
      WHERE id = ?
      `,
      [titulo, puntaje, estado, evaluacionId]
    );

    res.json({
      message: 'Evaluación actualizada correctamente.',
    });
  } catch (error) {
    console.log('Error actualizando evaluación:', error);

    res.status(error.status || 500).json({
      message: error.message || 'Error interno al actualizar la evaluación.',
    });
  }
});

// Consultar evaluación y preguntas de un curso
app.get('/api/evaluaciones/curso/:cursoId', (req, res) => {
  const { cursoId } = req.params;

  const sqlEvaluacion = `
    SELECT 
      id,
      curso_id,
      titulo,
      puntaje_minimo,
      estado
    FROM evaluaciones
    WHERE curso_id = ? AND estado = 'Activa'
  `;

  connection.query(sqlEvaluacion, [cursoId], (err, evaluaciones) => {
    if (err) {
      console.log('Error consultando evaluación:', err);
      return res.status(500).json({
        message: 'Error interno al consultar la evaluación',
      });
    }

    if (evaluaciones.length === 0) {
      return res.status(404).json({
        message: 'Este curso no tiene evaluación activa.',
      });
    }

    const evaluacion = evaluaciones[0];

    const sqlPreguntas = `
      SELECT 
        id,
        evaluacion_id,
        texto_pregunta,
        opcion_a,
        opcion_b,
        opcion_c,
        opcion_d
      FROM preguntas
      WHERE evaluacion_id = ?
      AND estado = 'Activa'
      ORDER BY id ASC
    `;

    connection.query(sqlPreguntas, [evaluacion.id], (err, preguntas) => {
      if (err) {
        console.log('Error consultando preguntas:', err);
        return res.status(500).json({
          message: 'Error interno al consultar las preguntas',
        });
      }

      res.json({
        evaluacion,
        preguntas,
      });
    });
  });
});

// Responder evaluación
app.post('/api/evaluaciones/:evaluacionId/responder', (req, res) => {
  const { evaluacionId } = req.params;
  const { usuario_id, respuestas } = req.body;

  if (!usuario_id || !Array.isArray(respuestas) || respuestas.length === 0) {
    return res.status(400).json({
      message: 'Debe enviar el usuario y las respuestas de la evaluación.',
    });
  }

  const sqlEvaluacion = `
    SELECT 
      id,
      curso_id,
      puntaje_minimo
    FROM evaluaciones
    WHERE id = ?
  `;

  connection.query(sqlEvaluacion, [evaluacionId], (err, evaluaciones) => {
    if (err) {
      console.log('Error consultando evaluación:', err);
      return res.status(500).json({
        message: 'Error interno al consultar la evaluación.',
      });
    }

    if (evaluaciones.length === 0) {
      return res.status(404).json({
        message: 'Evaluación no encontrada.',
      });
    }

    const evaluacion = evaluaciones[0];

    const sqlAvance = `
      SELECT
        id,
        porcentaje,
        estado,
        materiales_revisados,
        evaluacion_presentada,
        reintento_habilitado
      FROM avances
      WHERE usuario_id = ?
      AND curso_id = ?
    `;

    connection.query(
      sqlAvance,
      [usuario_id, evaluacion.curso_id],
      (err, avances) => {
        if (err) {
          console.log('Error validando avance antes de evaluación:', err);
          return res.status(500).json({
            message: 'Error interno al validar el avance del curso.',
          });
        }

        if (avances.length === 0) {
          return res.status(403).json({
            message: 'Este curso no está asignado al usuario.',
          });
        }

        const avanceActual = avances[0];

        if (
          avanceActual.estado === 'Completado' ||
          Number(avanceActual.porcentaje) === 100
        ) {
          return res.status(400).json({
            message: 'Este curso ya se encuentra completado.',
          });
        }

        if (!avanceActual.materiales_revisados) {
          return res.status(400).json({
            message:
              'Debe completar todos los materiales antes de presentar la evaluación.',
          });
        }

        if (
          avanceActual.estado === 'Evaluacion no aprobada' &&
          !avanceActual.reintento_habilitado
        ) {
          return res.status(403).json({
            message:
              'La evaluación no fue aprobada. Debes esperar a que un supervisor o administrador habilite un nuevo intento.',
          });
        }

        const sqlPreguntas = `
          SELECT 
            id,
            respuesta_correcta,
            ponderacion
          FROM preguntas
          WHERE evaluacion_id = ?
          AND estado = 'Activa'
        `;

        connection.query(sqlPreguntas, [evaluacionId], (err, preguntas) => {
          if (err) {
            console.log('Error consultando respuestas correctas:', err);
            return res.status(500).json({
              message: 'Error interno al validar la evaluación.',
            });
          }

          if (preguntas.length === 0) {
            return res.status(400).json({
              message: 'La evaluación no tiene preguntas registradas.',
            });
          }

          let puntajeObtenido = 0;
          let puntajeTotal = 0;

          preguntas.forEach((pregunta) => {
            const pesoPregunta = Number(pregunta.ponderacion || 1);
            puntajeTotal += pesoPregunta;

            const respuestaUsuario = respuestas.find(
              (r) => Number(r.pregunta_id) === Number(pregunta.id)
            );

            if (
              respuestaUsuario &&
              respuestaUsuario.respuesta === pregunta.respuesta_correcta
            ) {
              puntajeObtenido += pesoPregunta;
            }
          });

          const puntaje =
            puntajeTotal === 0 ? 0 : (puntajeObtenido / puntajeTotal) * 100;
          const estadoResultado =
            puntaje >= evaluacion.puntaje_minimo ? 'Aprobado' : 'No aprobado';

          const sqlIntento = `
            SELECT 
              COUNT(*) AS total,
              SUM(CASE WHEN estado = 'No aprobado' THEN 1 ELSE 0 END) AS fallidos
            FROM resultados_evaluacion
            WHERE usuario_id = ? AND evaluacion_id = ?
          `;

          connection.query(
            sqlIntento,
            [usuario_id, evaluacionId],
            (err, intentos) => {
              if (err) {
                console.log('Error consultando intentos:', err);
                return res.status(500).json({
                  message: 'Error interno al consultar intentos.',
                });
              }

              const totalIntentosPrevios = Number(intentos[0].total || 0);
              const fallidosPrevios = Number(intentos[0].fallidos || 0);

              const intento = totalIntentosPrevios + 1;
              const intentosFallidos =
                estadoResultado === 'No aprobado'
                  ? fallidosPrevios + 1
                  : fallidosPrevios;

              const sqlResultado = `
                INSERT INTO resultados_evaluacion
                (usuario_id, evaluacion_id, puntaje, estado, intento)
                VALUES (?, ?, ?, ?, ?)
              `;

              connection.query(
                sqlResultado,
                [usuario_id, evaluacionId, puntaje, estadoResultado, intento],
                (err) => {
                  if (err) {
                    console.log('Error guardando resultado:', err);
                    return res.status(500).json({
                      message: 'Error interno al guardar el resultado.',
                    });
                  }

                  let nuevoPorcentaje = 80;
                  let nuevoEstado = 'Evaluacion no aprobada';

                  if (estadoResultado === 'Aprobado') {
                    nuevoPorcentaje = 100;
                    nuevoEstado = 'Completado';
                  }

                  const sqlActualizarAvance = `
                    UPDATE avances
                    SET 
                      porcentaje = CASE
                        WHEN porcentaje = 100 THEN 100
                        ELSE ?
                      END,
                      estado = CASE
                        WHEN porcentaje = 100 THEN 'Completado'
                        ELSE ?
                      END,
                      evaluacion_presentada = TRUE,
                      materiales_revisados = TRUE,
                      reintento_habilitado = FALSE,
                      reintento_habilitado_por = NULL,
                      fecha_habilitacion_reintento = NULL,
                      fecha_actualizacion = CURRENT_TIMESTAMP
                    WHERE usuario_id = ? AND curso_id = ?
                  `;

                  connection.query(
                    sqlActualizarAvance,
                    [
                      nuevoPorcentaje,
                      nuevoEstado,
                      usuario_id,
                      evaluacion.curso_id,
                    ],
                    (err) => {
                      if (err) {
                        console.log('Error actualizando avance:', err);
                        return res.status(500).json({
                          message:
                            'La evaluación se guardó, pero no se pudo actualizar el avance.',
                        });
                      }

                      res.status(201).json({
                        message: 'Evaluación presentada correctamente.',
                        puntaje: Number(puntaje.toFixed(2)),
                        estado: estadoResultado,
                        intento,
                        intentosFallidos,
                        avance: nuevoPorcentaje,
                        reintentoHabilitado: false,
                      });
                    }
                  );
                }
              );
            }
          );
        });
      }
    );
  });
});

// =========================
// MARCAR MATERIALES COMO REVISADOS
// =========================
app.post('/api/avances/materiales-revisados', (req, res) => {
  const { usuario_id, curso_id } = req.body;

  if (!usuario_id || !curso_id) {
    return res.status(400).json({
      message: 'Debe enviar el usuario y el curso.',
    });
  }

  const sql = `
    INSERT INTO avances
    (usuario_id, curso_id, porcentaje, estado, materiales_revisados, evaluacion_presentada)
    VALUES (?, ?, 50, 'En progreso', TRUE, FALSE)
    ON DUPLICATE KEY UPDATE
      porcentaje = IF(porcentaje < 50, 50, porcentaje),
      estado = IF(porcentaje < 50, 'En progreso', estado),
      materiales_revisados = TRUE,
      fecha_actualizacion = CURRENT_TIMESTAMP
  `;

  connection.query(sql, [usuario_id, curso_id], (err) => {
    if (err) {
      console.log('Error actualizando materiales revisados:', err);
      return res.status(500).json({
        message: 'Error interno al actualizar el avance.',
      });
    }

    res.json({
      message: 'Materiales marcados como revisados.',
      avance: 50,
    });
  });
});

// =========================
// MANEJO DE ERRORES DE MULTER
// =========================
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      message: 'Error al cargar el archivo.',
      detail: err.message,
    });
  }

  if (err) {
    return res.status(400).json({
      message: err.message || 'Error inesperado.',
    });
  }

  next();
});

// =========================
// DASHBOARD
// =========================
app.get('/api/dashboard/resumen/:usuarioId', async (req, res) => {
  const { usuarioId } = req.params;
  const { viewerId, area } = req.query;
  const consultaTodos = usuarioId === 'all';

  if (!viewerId) {
    return res.status(400).json({
      message: 'Debe enviar el usuario que está consultando el dashboard.',
    });
  }

  try {
    const viewerRows = await dbQuery(
      `
      SELECT id, nombre, rol, area
      FROM usuarios
      WHERE id = ? AND estado = 'Activo'
      `,
      [viewerId]
    );

    if (viewerRows.length === 0) {
      return res.status(404).json({
        message: 'El usuario que consulta no existe o está inactivo.',
      });
    }

    const viewer = viewerRows[0];

    let target = null;

    if (!consultaTodos) {
      const targetRows = await dbQuery(
        `
        SELECT id, nombre, rol, area
        FROM usuarios
        WHERE id = ? AND estado = 'Activo'
        `,
        [usuarioId]
      );

      if (targetRows.length === 0) {
        return res.status(404).json({
          message: 'El usuario consultado no existe o está inactivo.',
        });
      }

      target = targetRows[0];
    }


    const esSuperAdmin = viewer.rol === 'Super Admin';
    const esAdmin = viewer.rol === 'Admin';
    const esSupervisor = viewer.rol === 'Supervisor';
    const esEmpleado = viewer.rol === 'Empleado';

    const areasPermitidas = [
      'IT',
      'RRHH',
      'BPO',
      'Billing',
      'PEO',
      'Implementacion',
    ];

    let areaFiltro = area && area !== 'all' ? area : null;

    if (areaFiltro && !areasPermitidas.includes(areaFiltro)) {
      return res.status(400).json({
        message: 'El área enviada para el filtro no es válida.',
      });
    }

    if (esSupervisor) {
      areaFiltro = viewer.area;
    }

    if (esEmpleado) {
      areaFiltro = null;
    }

    // Validación de acceso al usuario consultado
    if (consultaTodos && esEmpleado) {
      return res.status(403).json({
        message: 'Un empleado no puede consultar información consolidada.',
      });
    }

    if (!consultaTodos && esEmpleado && Number(viewer.id) !== Number(target.id)) {
      return res.status(403).json({
        message: 'Un empleado solo puede consultar su propio avance.',
      });
    }

    if (!consultaTodos && esSupervisor) {
      const consultaPropia = Number(viewer.id) === Number(target.id);
      const consultaEmpleadoDeSuArea =
        target.rol === 'Empleado' && target.area === viewer.area;

      if (!consultaPropia && !consultaEmpleadoDeSuArea) {
        return res.status(403).json({
          message:
            'El supervisor solo puede consultar su información y la de empleados de su área.',
        });
      }
    }


    let totalUsuarios;
    let totalCursos;
    let totalMateriales;
    let totalEvaluaciones;
    let usuariosPorRol;
    let cursosPorArea;
    let tendenciaMensualCompletados;
    
  if (esSuperAdmin || esAdmin) {
    const usuarioAreaFiltro = areaFiltro ? 'AND area = ?' : '';
    const cursoAreaWhere = areaFiltro ? 'WHERE area = ?' : '';
    const cursoAreaAnd = areaFiltro ? 'AND c.area = ?' : '';

    const paramsArea = areaFiltro ? [areaFiltro] : [];

    totalUsuarios = await dbQuery(
      `
      SELECT COUNT(*) AS total
      FROM usuarios
      WHERE estado = 'Activo'
      ${usuarioAreaFiltro}
      `,
      paramsArea
    );

    totalCursos = await dbQuery(
      `
      SELECT COUNT(*) AS total
      FROM cursos
      ${cursoAreaWhere}
      `,
      paramsArea
    );

    totalMateriales = await dbQuery(
      `
      SELECT COUNT(*) AS total
      FROM materiales m
      INNER JOIN cursos c ON m.curso_id = c.id
      WHERE 1 = 1
      ${cursoAreaAnd}
      `,
      paramsArea
    );

    totalEvaluaciones = await dbQuery(
      `
      SELECT COUNT(*) AS total
      FROM evaluaciones e
      INNER JOIN cursos c ON e.curso_id = c.id
      WHERE e.estado = 'Activa'
      ${cursoAreaAnd}
      `,
      paramsArea
    );

    usuariosPorRol = await dbQuery(
      `
      SELECT rol, COUNT(*) AS total
      FROM usuarios
      WHERE estado = 'Activo'
      ${usuarioAreaFiltro}
      GROUP BY rol
      ORDER BY rol
      `,
      paramsArea
    );

    cursosPorArea = await dbQuery(
      `
      SELECT area, COUNT(*) AS total
      FROM cursos
      ${cursoAreaWhere}
      GROUP BY area
      ORDER BY area
      `,
      paramsArea
    );

    tendenciaMensualCompletados = await dbQuery(
      `
      SELECT 
        DATE_FORMAT(r.fecha_presentacion, '%Y-%m') AS mes,
        COUNT(DISTINCT r.usuario_id) AS usuarios_completaron
      FROM resultados_evaluacion r
      INNER JOIN evaluaciones e ON r.evaluacion_id = e.id
      INNER JOIN cursos c ON e.curso_id = c.id
      WHERE r.estado = 'Aprobado'
      ${cursoAreaAnd}
      GROUP BY DATE_FORMAT(r.fecha_presentacion, '%Y-%m')
      ORDER BY mes ASC
      `,
      paramsArea
    );
  } else if (esSupervisor) {
      totalUsuarios = await dbQuery(
        `
        SELECT COUNT(*) AS total
        FROM usuarios
        WHERE estado = 'Activo'
        AND (
          id = ?
          OR (rol = 'Empleado' AND area = ?)
        )
        `,
        [viewer.id, viewer.area]
      );

      totalCursos = await dbQuery(
        `
        SELECT COUNT(*) AS total
        FROM cursos
        WHERE area = ?
        `,
        [viewer.area]
      );

      totalMateriales = await dbQuery(
        `
        SELECT COUNT(*) AS total
        FROM materiales m
        INNER JOIN cursos c ON m.curso_id = c.id
        WHERE c.area = ?
        `,
        [viewer.area]
      );

      totalEvaluaciones = await dbQuery(
        `
        SELECT COUNT(*) AS total
        FROM evaluaciones e
        INNER JOIN cursos c ON e.curso_id = c.id
        WHERE e.estado = 'Activa'
        AND c.area = ?
        `,
        [viewer.area]
      );

      usuariosPorRol = await dbQuery(
        `
        SELECT rol, COUNT(*) AS total
        FROM usuarios
        WHERE estado = 'Activo'
        AND (
          id = ?
          OR (rol = 'Empleado' AND area = ?)
        )
        GROUP BY rol
        ORDER BY rol
        `,
        [viewer.id, viewer.area]
      );

      cursosPorArea = await dbQuery(
        `
        SELECT area, COUNT(*) AS total
        FROM cursos
        WHERE area = ?
        GROUP BY area
        ORDER BY area
        `,
        [viewer.area]
      );

      tendenciaMensualCompletados = await dbQuery(
        `
        SELECT 
          DATE_FORMAT(r.fecha_presentacion, '%Y-%m') AS mes,
          COUNT(DISTINCT r.usuario_id) AS usuarios_completaron
        FROM resultados_evaluacion r
        INNER JOIN evaluaciones e ON r.evaluacion_id = e.id
        INNER JOIN cursos c ON e.curso_id = c.id
        INNER JOIN usuarios u ON r.usuario_id = u.id
        WHERE r.estado = 'Aprobado'
        AND c.area = ?
        AND (
          u.id = ?
          OR (u.rol = 'Empleado' AND u.area = ?)
        )
        GROUP BY DATE_FORMAT(r.fecha_presentacion, '%Y-%m')
        ORDER BY mes ASC
        `,
        [viewer.area, viewer.id, viewer.area]
      );
    } else {
      totalUsuarios = [{ total: 1 }];

      totalCursos = await dbQuery(
        `
        SELECT COUNT(*) AS total
        FROM avances
        WHERE usuario_id = ?
        `,
        [viewer.id]
      );

      totalMateriales = await dbQuery(
        `
        SELECT COUNT(*) AS total
        FROM materiales m
        INNER JOIN cursos c ON m.curso_id = c.id
        INNER JOIN avances a ON c.id = a.curso_id
        WHERE a.usuario_id = ?
        `,
        [viewer.id]
      );

      totalEvaluaciones = await dbQuery(
        `
        SELECT COUNT(*) AS total
        FROM evaluaciones e
        INNER JOIN avances a ON e.curso_id = a.curso_id
        WHERE a.usuario_id = ?
        AND e.estado = 'Activa'
        `,
        [viewer.id]
      );

      usuariosPorRol = [
        {
          rol: viewer.rol,
          total: 1,
        },
      ];

      cursosPorArea = await dbQuery(
        `
        SELECT c.area, COUNT(*) AS total
        FROM avances a
        INNER JOIN cursos c ON a.curso_id = c.id
        WHERE a.usuario_id = ?
        GROUP BY c.area
        ORDER BY c.area
        `,
        [viewer.id]
      );

      tendenciaMensualCompletados = await dbQuery(
        `
        SELECT 
          DATE_FORMAT(r.fecha_presentacion, '%Y-%m') AS mes,
          COUNT(DISTINCT r.usuario_id) AS usuarios_completaron
        FROM resultados_evaluacion r
        INNER JOIN evaluaciones e ON r.evaluacion_id = e.id
        WHERE r.estado = 'Aprobado'
        AND r.usuario_id = ?
        GROUP BY DATE_FORMAT(r.fecha_presentacion, '%Y-%m')
        ORDER BY mes ASC
        `,
        [viewer.id]
      );
    }

      let avancesUsuarioPorEstado;
      let avanceUsuarioPorCurso;
      let resumenUsuario;

      if (consultaTodos) {
        let filtrosPermitidos = [];
        let paramsPermitidos = [];

        if (esSupervisor) {
          filtrosPermitidos.push(`
            (
              u.id = ?
              OR (u.rol = 'Empleado' AND u.area = ?)
            )
          `);

          filtrosPermitidos.push('c.area = ?');

          paramsPermitidos.push(viewer.id, viewer.area, viewer.area);
        }

        if ((esSuperAdmin || esAdmin) && areaFiltro) {
          filtrosPermitidos.push('u.area = ?');
          filtrosPermitidos.push('c.area = ?');

          paramsPermitidos.push(areaFiltro, areaFiltro);
        }

        const whereExtra =
          filtrosPermitidos.length > 0
            ? `AND ${filtrosPermitidos.join(' AND ')}`
            : '';

        avancesUsuarioPorEstado = await dbQuery(
          `
          SELECT a.estado, COUNT(*) AS total
          FROM avances a
          INNER JOIN usuarios u ON a.usuario_id = u.id
          INNER JOIN cursos c ON a.curso_id = c.id
          WHERE u.estado = 'Activo'
          ${whereExtra}
          GROUP BY a.estado
          ORDER BY a.estado
          `,
          paramsPermitidos
        );

        avanceUsuarioPorCurso = await dbQuery(
          `
          SELECT 
            c.titulo AS curso,
            ROUND(AVG(a.porcentaje), 2) AS porcentaje,
            CASE
              WHEN ROUND(AVG(a.porcentaje), 2) = 100 THEN 'Completado'
              WHEN ROUND(AVG(a.porcentaje), 2) >= 80 THEN 'Evaluacion no aprobada'
              WHEN ROUND(AVG(a.porcentaje), 2) >= 50 THEN 'En progreso'
              ELSE 'Pendiente'
            END AS estado
          FROM avances a
          INNER JOIN cursos c ON a.curso_id = c.id
          INNER JOIN usuarios u ON a.usuario_id = u.id
          WHERE u.estado = 'Activo'
          ${whereExtra}
          GROUP BY c.id, c.titulo
          ORDER BY c.titulo ASC
          `,
          paramsPermitidos
        );

        resumenUsuario = await dbQuery(
          `
          SELECT 
            COUNT(*) AS cursos_asignados,
            COALESCE(ROUND(AVG(a.porcentaje), 2), 0) AS promedio_avance
          FROM avances a
          INNER JOIN usuarios u ON a.usuario_id = u.id
          INNER JOIN cursos c ON a.curso_id = c.id
          WHERE u.estado = 'Activo'
          ${whereExtra}
          `,
          paramsPermitidos
        );
      } else {
        let filtroCursoArea = '';
        let paramsDetalle = [target.id];

        if (areaFiltro) {
          filtroCursoArea = 'AND c.area = ?';
          paramsDetalle.push(areaFiltro);
        }

        avancesUsuarioPorEstado = await dbQuery(
          `
          SELECT a.estado, COUNT(*) AS total
          FROM avances a
          INNER JOIN cursos c ON a.curso_id = c.id
          WHERE a.usuario_id = ?
          ${filtroCursoArea}
          GROUP BY a.estado
          ORDER BY a.estado
          `,
          paramsDetalle
        );

        avanceUsuarioPorCurso = await dbQuery(
          `
          SELECT c.titulo AS curso, a.porcentaje, a.estado
          FROM avances a
          INNER JOIN cursos c ON a.curso_id = c.id
          WHERE a.usuario_id = ?
          ${filtroCursoArea}
          ORDER BY c.titulo ASC
          `,
          paramsDetalle
        );

        resumenUsuario = await dbQuery(
          `
          SELECT 
            COUNT(*) AS cursos_asignados,
            COALESCE(ROUND(AVG(a.porcentaje), 2), 0) AS promedio_avance
          FROM avances a
          INNER JOIN cursos c ON a.curso_id = c.id
          WHERE a.usuario_id = ?
          ${filtroCursoArea}
          `,
          paramsDetalle
        );
      }

    res.json({
      kpis: {
        totalUsuarios: totalUsuarios[0].total,
        totalCursos: totalCursos[0].total,
        totalMateriales: totalMateriales[0].total,
        totalEvaluaciones: totalEvaluaciones[0].total,
        cursosAsignadosUsuario: resumenUsuario[0].cursos_asignados,
        promedioAvanceUsuario: Number(resumenUsuario[0].promedio_avance),
      },
      usuariosPorRol,
      cursosPorArea,
      avancesUsuarioPorEstado,
      avanceUsuarioPorCurso,
      tendenciaMensualCompletados,
    });
  } catch (error) {
    console.log('Error consultando dashboard:', error);

    res.status(500).json({
      message: 'Error interno al consultar la información del dashboard.',
    });
  }
});

// =========================
// LEVANTAR SERVIDOR
// =========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

