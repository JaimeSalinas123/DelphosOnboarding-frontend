# 🚀 Delphos Onboarding

Presentando **Delphos Onboarding**: una plataforma web integral e inteligente diseñada para revolucionar la incorporación y capacitación de nuevo personal. Reemplaza los manuales estáticos y la capacitación desorganizada mediante una experiencia inmersiva que combina entornos 3D, evaluaciones dinámicas y asistencia por Inteligencia Artificial.

El sistema está dividido en dos grandes mundos: un **Portal Público** interactivo para que los nuevos integrantes aprendan a su propio ritmo, y un **Panel Privado (Dashboard)** para que los administradores y el equipo de Capital Humano gestionen usuarios, métricas de rendimiento, encuestas de satisfacción y auditen la seguridad de la plataforma.

---

## 🌐 Demo en Vivo

¡Explora la plataforma tú mismo! Puedes acceder a la versión desplegada y crear una cuenta para probar la experiencia de onboarding:

👉 **[Visitar Delphos Onboarding en Vercel](https://delphos-app-rho.vercel.app/)**

---

## 🏗️ Arquitectura y Desarrollo

El proyecto utiliza una arquitectura separada (Cliente/Servidor) altamente tipada y escalable, dividiendo responsabilidades entre un frontend moderno y un backend robusto.

* **Interfaz de Usuario (Frontend):** Construido con **Next.js (App Router)** y **React**, estilizado con **Tailwind CSS** para un diseño responsivo "Mobile-First". Incorpora visualizaciones 3D avanzadas optimizadas para web mediante **React Three Fiber (WebGL)** y animaciones fluidas con **Framer Motion**.
* **Núcleo del Sistema (Backend):** Desarrollado en **Node.js** con **Express** y **TypeScript**. La lógica está modularizada por controladores y rutas (`usuarios`, `estudio`, `chatbot`, `auditoria`), protegida por middlewares de autenticación y autorización (RBAC) y limitadores de peticiones (Rate Limiting).
* **Persistencia y Autenticación:** Delegada a **Supabase** (PostgreSQL). Supabase Auth gestiona de forma segura el registro, inicio de sesión y emisión de JWT, mientras la base de datos relacional almacena el progreso, usuarios y auditorías.
* **Inteligencia Artificial:** Integración nativa con la API de **Google Gemini**, permitiendo que un chatbot institucional responda preguntas en tiempo real basado exclusivamente en la documentación inyectada por los administradores.

---

## 🌟 Módulos Destacados

* **Ecosistema 3D (Círculo Virtuoso):** Un lienzo interactivo en 3D optimizado para alto rendimiento (Lazy Loading, Instancing) donde el usuario explora los pilares de la empresa.
* **Módulos de Estudio y Gamificación:** Cuestionarios, Flashcards y Verdadero/Falso con guardado de progreso automático y desbloqueo de insignias (medallas) al completar hitos.
* **Asistente IA Institucional:** Chatbot integrado entrenado con base de conocimiento dinámica. Los administradores pueden alimentar a la IA con archivos TXT para mantenerla actualizada.
* **Encuestas de Satisfacción:** Formularios dinámicos con distintos tipos de respuesta (escala o texto libre) bloqueados mediante códigos de acceso generados por Capital Humano.
* **Panel Administrativo (Dashboard):** Visualización de métricas en tiempo real con **Recharts** (gráficos de pastel y barras), y exportación de reportes avanzados y complejos a Excel utilizando **ExcelJS**.
* **Seguridad y Auditoría:** Sistema de trazabilidad completo que registra cada acción administrativa, permitiendo a los administradores "Rehacer" (restaurar) acciones destructivas previas.

---

## ⚙️ Stack Tecnológico

<p align="left">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=ts,nextjs,react,nodejs,express,supabase,postgres,tailwind" alt="Tech Stack Delphos Onboarding" />
  </a>
</p>

* **Frontend:** Next.js, React, TypeScript, Tailwind CSS, Framer Motion, React Three Fiber.
* **Backend:** Node.js, Express, TypeScript.
* **Base de Datos & Auth:** Supabase (PostgreSQL).
* **IA & Librerías:** Google Gemini API, ExcelJS, Recharts, Zustand (Gestión de estado global).

---

> **Nota del Desarrollador:** Este proyecto fue estructurado para demostrar capacidades avanzadas de integración *Full-Stack*: desde el manejo de gráficos en 3D para la web y la integración de Inteligencia Artificial Generativa, hasta la implementación de un robusto modelo de Control de Acceso Basado en Roles (RBAC) en el backend.
>
> A nivel de rendimiento y UX, el sistema hace uso intensivo de *Lazy Loading*, optimización de memoria (Instancing de geometrías 3D) y un diseño estrictamente responsivo que adapta vistas complejas (como tablas de datos masivas) en tarjetas apilables para dispositivos móviles.
