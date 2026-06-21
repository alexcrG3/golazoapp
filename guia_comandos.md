# Guía de Comandos Rápidos (Slash Commands)

En el chat de desarrollo, tienes a tu disposición varios comandos rápidos (o *slash commands*) que te permiten controlar la ejecución del asistente, delegar tareas pesadas, navegar por la web o guardar reglas personalizadas. A continuación se detalla qué es, para qué sirve y cuándo utilizar cada uno de ellos.

---

## Tabla Resumen de Comandos

| Comando | Función Principal | Tipo de Tarea |
| :--- | :--- | :--- |
| **`/btw`** | Consultas rápidas y teóricas sin desviar el tema. | Dudas / Conceptos |
| **`/goal`** | Ejecución autónoma y continua hasta lograr una meta. | Automatización larga |
| **`/schedule`** | Programación de tareas recurrentes o temporizadores. | Monitoreo / Alertas |
| **`/browser`** | Búsqueda activa e interacción en la web. | Investigación / Pruebas |
| **`/grill-me`** | Entrevista interactiva para afinar requerimientos. | Planificación / Diseño |
| **`/teamwork-preview`** | Equipo de agentes trabajando en paralelo. | Megaproyectos |
| **`/learn`** | Guardar reglas permanentes en memoria a futuro. | Preferencias / Estilos |
| **`/android-cli`** | Comandos de herramientas de desarrollo Android. | Desarrollo Móvil |

---

## Detalle de cada Comando

### 1. `/btw` (By The Way / Por cierto)
> [!NOTE]
> Sirve para hacer preguntas rápidas que no requieren alterar o interrumpir el trabajo de código que el asistente está realizando en ese momento.

* **Qué es:** Un canal secundario de comunicación de bajo impacto cognitivo.
* **Para qué sirve:** Para resolver dudas teóricas, pedir explicaciones de sintaxis o consultar conceptos generales mientras el desarrollo principal sigue en marcha.
* **Cuándo utilizarlo:**
  * Cuando quieres entender cómo funciona una línea de código específica que acabamos de escribir.
  * Si quieres saber cuál es la diferencia entre dos tecnologías (ej. *Vite vs Next.js*).
* **Ejemplo de uso:** 
  ```text
  /btw ¿cuál es la diferencia entre un hook useEffect y un useLayoutEffect?
  ```

---

### 2. `/goal` (Meta / Ejecución Continua)
> [!IMPORTANT]
> Activa un modo de trabajo intensivo en el que el asistente no se detendrá a pedir confirmaciones paso a paso; resolverá de forma secuencial y autónoma todo lo necesario hasta alcanzar el objetivo.

* **Qué es:** Un iniciador de ejecución autónoma a gran escala.
* **Para qué sirve:** Para delegar tareas complejas de múltiples etapas y dejar que el asistente las complete de inicio a fin por su cuenta.
* **Cuándo utilizarlo:**
  * Si vas a dejar al asistente trabajando en segundo plano mientras duermes, almuerzas o haces otras tareas.
  * Para implementar módulos completos desde cero, escribir conjuntos extensos de pruebas unitarias o corregir de golpe muchos archivos con errores de TypeScript.
* **Ejemplo de uso:**
  ```text
  /goal Crea las pruebas unitarias para todas las funciones de predictionsStore.ts y soluciona cualquier error que encuentres.
  ```

---

### 3. `/schedule` (Programar / Temporizador)
> [!TIP]
> Úsalo para automatizar el monitoreo de tus servidores, bases de datos o despliegues sin tener que estar pendiente de ellos.

* **Qué es:** Un programador de tareas (*cron jobs*) y temporizador de alertas.
* **Para qué sirve:** Ejecuta instrucciones periódicamente (cada X minutos/horas) o establece recordatorios de una sola vez.
* **Cuándo utilizarlo:**
  * Si quieres que el asistente valide el estado de tu base de datos Supabase cada 30 minutos.
  * Para recibir un recordatorio dentro de 10 minutos para comprobar si una compilación en Vercel finalizó correctamente.
* **Ejemplo de uso:**
  ```text
  /schedule cada 10 minutos verifica el estado de la última build en Vercel y avísame si falla
  ```

---

### 4. `/browser` (Navegador Web)
* **Qué es:** Un agente con acceso interactivo completo a internet.
* **Para qué sirve:** Buscar información actualizada en vivo, leer documentación oficial de frameworks, interactuar con portales o probar endpoints externos.
* **Cuándo utilizarlo:**
  * Si necesitas investigar la última versión de una API cuya documentación no está en la base de datos local.
  * Para buscar soluciones en foros de desarrolladores sobre un bug muy reciente o específico.
* **Ejemplo de uso:**
  ```text
  /browser Busca en la documentación de Supabase Auth cómo configurar el redireccionamiento para OAuth con Google
  ```

---

### 5. `/grill-me` (Entrevístame)
* **Qué es:** Un modo interactivo de refinamiento y alineación técnica.
* **Para qué sirve:** El asistente te interrogará de manera estructurada con preguntas clave sobre el diseño de software, flujos lógicos y decisiones estéticas antes de empezar a escribir código.
* **Cuándo utilizarlo:**
  * Antes de comenzar una funcionalidad grande en la que tienes dudas sobre cómo estructurarla.
  * Si deseas que el asistente te guíe a definir el alcance y los requerimientos de tu proyecto de forma óptima.
* **Ejemplo de uso:**
  ```text
  /grill-me quiero agregar un sistema de notificaciones push en tiempo real a la quiniela
  ```

---

### 6. `/teamwork-preview` (Trabajo en Equipo)
* **Qué es:** Un gestor de agentes concurrentes y especializados.
* **Para qué sirve:** Distribuye una tarea gigante entre múltiples subagentes paralelos que colaboran entre sí (como arquitectos de bases de datos, programadores frontend y analistas QA) para resolver un objetivo en común.
* **Cuándo utilizarlo:**
  * Para desarrollar grandes aplicaciones desde cero en poco tiempo.
  * Para migraciones completas de bases de datos o rediseños de interfaces a gran escala.
* **Ejemplo de uso:**
  ```text
  /teamwork-preview Diseña y programa un dashboard administrativo completo para gestionar usuarios y partidos en Golazo.
  ```

---

### 7. `/learn` (Aprender Reglas)
> [!WARNING]
> Este comando escribe reglas permanentes en tu configuración. Úsalo solo para definir directrices y hábitos que quieres que el asistente aplique rigurosamente en el futuro.

* **Qué es:** Un inyector de reglas personalizadas en la memoria persistente del asistente.
* **Para qué sirve:** Graba preferencias de estilo de código, flujos de desarrollo aprobados o correcciones de errores recurrentes para que el asistente no cometa los mismos fallos en futuras conversaciones.
* **Cuándo utilizarlo:**
  * Justo después de haber solucionado un problema complejo o haber configurado de manera especial tu entorno.
  * Si tienes un estándar de código preferido (ej. *"usa siempre Tailwind CSS"* o *"no uses punto y coma"*).
* **Ejemplo de uso:**
  ```text
  /learn En este proyecto usamos siempre camelCase para variables y snake_case para nombres de columnas en base de datos.
  ```

---

### 8. `/android-cli` (Comandos de Android)
* **Qué es:** Una interfaz de línea de comandos especializada para desarrollo Android.
* **Para qué sirve:** Ejecutar builds, manejar emuladores, desplegar APKs en dispositivos físicos y realizar diagnósticos del entorno de Android.
* **Cuándo utilizarlo:**
  * Únicamente si el proyecto actual involucra una aplicación móvil Android y necesitas compilar, lanzar el emulador o debuggear las herramientas móviles.
* **Ejemplo de uso:**
  ```text
  /android-cli build debug apk
  ```
