# Bitácora de Cambios — Golazo

Historial cronológico de cambios, mejoras y actualizaciones de la quiniela **Golazo (Mundial 2026)**. Los cambios más recientes se muestran al principio.

---

### [2026-06-22 10:10] Optimización de Persistencia de Sesión y Carga de Perfil (AuthProvider)
- **Descripción:** Se solucionó el retraso en la carga inicial al iniciar sesión y el error en el que el usuario aparecía temporalmente desconectado ("flicker" de sesión).
- **Detalles:**
  * **Arquitectura de Contexto:** Refactorizamos `useAuth` convirtiéndolo en un Context Provider global (`AuthProvider`). Antes, cada componente que llamaba al hook de autenticación ejecutaba su propia suscripción a Supabase y peticiones de base de datos en paralelo (6 ejecuciones simultáneas), saturando la conexión y provocando estados inconsistentes.
  * **Lectura Síncrona del Cliente:** El estado inicial del usuario ahora se lee síncronamente de `localStorage` en el cliente durante el montaje inicial, eliminando la fracción de segundo en la que la cabecera e interfaz mostraban el estado deslogueado.
  * **Carga en Segundo Plano:** Separamos la sincronización de predicciones con Supabase (`syncPredictions`) para ejecutarse de fondo y de manera asíncrona, evitando bloquear el estado de carga (`loading`) del perfil.
- **Archivos modificados:**
  * [useAuth.ts](file:///d:/AntigravitDev/golazo-main/src/hooks/useAuth.ts)
  * [__root.tsx](file:///d:/AntigravitDev/golazo-main/src/routes/__root.tsx)


### [2026-06-20 22:15] Enlaces Interactivos de Transmisiones en Vivo
- **Descripción:** Se transformaron los indicadores de partidos activos ("En Vivo" / "En Juego") en enlaces web interactivos.
- **Detalles:**
  * Al hacer clic en la etiqueta "En Vivo 📺" (en las tarjetas de partido) o "En Juego 📺" (en el historial de pronósticos), se abre una pestaña con una búsqueda optimizada de Google: `ver [Equipo A] vs [Equipo B] en vivo online gratis`.
  * Google localiza geográficamente los resultados de manera automática, permitiendo a los usuarios ver canales oficiales y plataformas de streaming libre disponibles para su ubicación actual.
- **Archivos modificados:**
  * [MatchCard.tsx](file:///d:/AntigravitDev/golazo-main/src/components/MatchCard.tsx)
  * [my-predictions.tsx](file:///d:/AntigravitDev/golazo-main/src/routes/my-predictions.tsx)

### [2026-06-20 22:00] Menú Desplegable de Perfil en App Bar y Cierre de Sesión Unificado
- **Descripción:** Se diseñó e integró un menú desplegable contextual interactivo para las acciones de cuenta y sesión del usuario.
- **Detalles:**
  * Creación del nuevo componente `<ProfileDropdown />` con estética *glassmorphism*, sombras y animaciones suaves de entrada.
  * Muestra foto o bandera del usuario logueado en la esquina superior derecha del App Bar en todas las pantallas principales (Inicio, Partidos, Ranking y Perfil).
  * Al hacer clic, despliega un menú flotante con el nombre, usuario, enlaces rápidos a *"Mi Perfil"* y *"Reglamento"*, y un botón de *"Cerrar Sesión"* en color rojo.
  * Se asignó la propiedad `relative z-20` a las cabeceras principales para asegurar que el menú se muestre sobre cualquier elemento de la interfaz.
- **Archivos modificados/creados:**
  * [ProfileDropdown.tsx](file:///d:/AntigravitDev/golazo-main/src/components/ProfileDropdown.tsx) [NUEVO]
  * [index.tsx](file:///d:/AntigravitDev/golazo-main/src/routes/index.tsx)
  * [matches.tsx](file:///d:/AntigravitDev/golazo-main/src/routes/matches.tsx)
  * [ranking.tsx](file:///d:/AntigravitDev/golazo-main/src/routes/ranking.tsx)
  * [profile.tsx](file:///d:/AntigravitDev/golazo-main/src/routes/profile.tsx)

### [2026-06-20 21:50] Ordenamiento Cronológico en Historial de Pronósticos
- **Descripción:** Se cambió la orientación del orden de partidos en la sección de "Mis Pronósticos".
- **Detalles:**
  * Los encuentros con predicciones ahora se ordenan de manera **cronológica ascendente** (los partidos más antiguos primero y de ahí para abajo).
  * Aplica consistentemente a las tres pestañas de historial: *Todos*, *Finalizados* y *Pendientes*.
- **Archivos modificados:**
  * [my-predictions.tsx](file:///d:/AntigravitDev/golazo-main/src/routes/my-predictions.tsx)

### [2026-06-20 18:30] Visualización de Predicción en Cuenta Regresiva ("Próximo Pitazo")
- **Descripción:** Mejora en el widget del siguiente partido del dashboard principal.
- **Detalles:**
  * Si el usuario ya guardó un pronóstico para el próximo partido, la tarjeta muestra su marcador pronosticado (`Tu pronóstico: X - Y`) y un botón para *"Modificar"*, en lugar del botón genérico *"Predecir ahora"*.
- **Archivos modificados:**
  * [index.tsx](file:///d:/AntigravitDev/golazo-main/src/routes/index.tsx)

### [2026-06-20 18:00] Autocompletado de Campeón por Selección Favorita
- **Descripción:** Respaldo automático de predicción de campeón.
- **Detalles:**
  * Si el usuario no ha seleccionado explícitamente a su campeón en la quiniela, el sistema toma automáticamente su país favorito del perfil (`country_code`) como su predicción de campeón.
- **Archivos modificados:**
  * [index.tsx](file:///d:/AntigravitDev/golazo-main/src/routes/index.tsx)
  * [ranking.tsx](file:///d:/AntigravitDev/golazo-main/src/routes/ranking.tsx)
  * [champion.tsx](file:///d:/AntigravitDev/golazo-main/src/routes/champion.tsx)
  * [leaderboard.ts](file:///d:/AntigravitDev/golazo-main/src/data/leaderboard.ts)

### [2026-06-20 17:15] Desglose de Puntos y Modal de Usuario en Ranking
- **Descripción:** Detalle transparente del puntaje de los competidores.
- **Detalles:**
  * Modal premium con *glassmorphism* que se abre al hacer clic sobre cualquier usuario en la tabla de posiciones.
  * Muestra el desglose exacto de puntos obtenidos (partidos con marcador exacto, ganador correcto y predicción de campeón mundial).
  * Muestra el estado de logros y premios (logro de participación *"Primer Gol"* y racha récord de *"Hat-Trick"*).
- **Archivos modificados:**
  * [ranking.tsx](file:///d:/AntigravitDev/golazo-main/src/routes/ranking.tsx)
  * [leaderboard.ts](file:///d:/AntigravitDev/golazo-main/src/data/leaderboard.ts)

### [2026-06-20 16:30] Posiciones Completas en Tabla de Clasificación
- **Descripción:** Visualización de todos los competidores en el Ranking.
- **Detalles:**
  * Se modificó la lista de posiciones para incluir a la totalidad de los pronosticadores de la quiniela (del 1° al último) de forma secuencial abajo del podio visual, en lugar de saltarse a los 3 primeros.
- **Archivos modificados:**
  * [ranking.tsx](file:///d:/AntigravitDev/golazo-main/src/routes/ranking.tsx)

### [2026-06-20 15:45] Persistencia de Sesión y Fix de SSR
- **Descripción:** Corrección de cierre de sesión no deseado al recargar la aplicación.
- **Detalles:**
  * Se solucionó un problema de hidratación de Supabase Auth en SSR que emitía un evento falso de `SIGNED_OUT` al recargar, el cual borraba el estado local y desconectaba al usuario.
  * Se añadió un control de inicialización (`initializedRef`) en el hook de sesión para ignorar eventos transitorios de logout al hidratar.
- **Archivos modificados:**
  * [useAuth.ts](file:///d:/AntigravitDev/golazo-main/src/hooks/useAuth.ts)
