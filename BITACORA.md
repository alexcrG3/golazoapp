# Bitácora de Cambios — Golazo

Historial cronológico de cambios, mejoras y actualizaciones de la quiniela **Golazo (Mundial 2026)**. Los cambios más recientes se muestran al principio.

---
### [2026-06-26 17:45] Restricción de Cambio de Selección Favorita en Perfil
- **Descripción:** Se deshabilitó la posibilidad de cambiar la selección favorita una vez que ya ha sido guardada en el perfil del usuario.
- **Detalles:**
  * **Bloqueo del Selector (`profile.tsx`):** Se añadió la propiedad `disabled={!!profile?.country_code}` al selector de país en el modal de edición de perfil. Esto evita cambios accidentales o intencionados tras el registro.
  * **Indicación en Interfaz (`profile.tsx`):** Se actualizó dinámicamente el texto explicativo del modal para indicar explícitamente: *"Actualiza tu nombre o usuario. La selección favorita ya no se puede cambiar"* en caso de que ya cuente con una selección guardada.
- **Archivos modificados:**
  * [profile.tsx](file:///d:/AntigravitDev/golazo-main/src/routes/profile.tsx)

### [2026-06-24 01:50] Desglose de Puntos por Partido en Ranking e Historial de Pronósticos
- **Descripción:** Se implementó una vista detallada que muestra a los usuarios qué partidos y cuántos puntos ha obtenido cada participante en el Ranking, y se añadió un filtro rápido en el historial de pronósticos.
- **Detalles:**
  * **Pestaña "Con Puntos" en Pronósticos (`my-predictions.tsx`):** Se añadió una nueva pestaña y filtro `"Con Puntos"` en la sección de mis pronósticos para aislar rápidamente aquellos partidos finalizados donde el usuario obtuvo algún punto (`pts > 0`). Se adaptó la fila de pestañas a un formato scrollable horizontalmente para evitar desbordes visuales en pantallas pequeñas.
  * **Lista de Puntos por Partido en Modal de Ranking (`ranking.tsx`):** Dentro del modal flotante de detalle de usuario, se agregó la sección *"Puntos por Partido"*. Esta lista organiza primero los partidos finalizados que otorgaron puntos al usuario (ordenados de más recientes a más antiguos) y luego coloca debajo los partidos sin puntos (también en orden descendente por fecha), mostrando la predicción, resultado real e insignias de puntos.
  * **Pasarela de Datos en Ranking (`leaderboard.ts`):** Se extendió el tipo `LeaderboardEntry` con la propiedad `predictions` y se poblaron dichos datos en los listados dinámicos mockeados y consultas reales a Supabase Auth para habilitar el desglose detallado en el cliente.
- **Archivos modificados:**
  * [leaderboard.ts](file:///d:/AntigravitDev/golazo-main/src/data/leaderboard.ts)
  * [ranking.tsx](file:///d:/AntigravitDev/golazo-main/src/routes/ranking.tsx)
  * [my-predictions.tsx](file:///d:/AntigravitDev/golazo-main/src/routes/my-predictions.tsx)

### [2026-06-24 01:30] Corrección de Spinners Infinitos y Sesiones Suspendidas en PWA
- **Descripción:** Se solucionó el problema por el cual la app se quedaba cargando indefinidamente al perder conexión o expirar la sesión, y se mejoró la persistencia de la sesión en PWAs.
- **Detalles:**
  * **Caché Local de Perfil (`useAuth.ts`):** Para evitar que el App Bar y los selectores muestren los esqueletos grises de carga (skeleton loaders) durante la carga inicial o al estar desconectado, ahora el perfil del usuario se guarda localmente en `localStorage` (`sb-profile`) al obtenerse exitosamente. En el arranque de la app, el perfil se lee y renderiza de inmediato en 0 milisegundos a partir de la memoria caché.
  * **Timeout en Consulta de Perfil (`useAuth.ts`):** Supabase no cuenta con un tiempo límite por defecto para consultas colgadas. Agregamos un `Promise.race` con un timeout de 5 segundos al obtener el perfil de base de datos. Si la consulta tarda más por mala conexión, falla rápido y desactiva el estado de carga (`loading`), evitando que la app se quede "pensando" indefinidamente en pantallas de carga.
  * **Control de Spinner Infinito al Expirar Sesión (`useAuth.ts`):** En el detector de cambios de sesión de Supabase (`onAuthStateChange`), el estado `loading` se quedaba colgado en `true` si el token expiraba o el refresco fallaba y el evento no era explícitamente `"SIGNED_OUT"`. Cambiamos el condicional para forzar `setLoading(false)` ante cualquier evento que resulte en un usuario nulo, deteniendo los spinners "Cargando perfil..." y "Cargando clasificación..." de inmediato.
  * **Prevención de Spinners Infinitos por Offline (`router.tsx`):** Por defecto, React Query pausa indefinidamente las peticiones en estado "loading" si detecta que el dispositivo está offline, manteniendo el spinner de carga para siempre en pantallas como Clasificación. Configurando `networkMode: "always"` a nivel global en el `QueryClient`, obligamos a las consultas a fallar inmediatamente en lugar de colgarse, permitiendo renderizar datos en caché u offline.
  * **Mantenimiento y Refresco Activo de Sesión (`useAuth.ts`):** Agregamos escuchadores de eventos para enfoque de ventana (`focus`) y cambios de visibilidad (`visibilitychange`). Cuando la PWA/pestaña se reabre tras estar suspendida o en segundo plano, la app valida y refresca automáticamente los tokens de Supabase, evitando cierres de sesión por inactividad.
- **Archivos modificados:**
  * [useAuth.ts](file:///d:/AntigravitDev/golazo-main/src/hooks/useAuth.ts)
  * [router.tsx](file:///d:/AntigravitDev/golazo-main/src/router.tsx)


### [2026-06-22 23:33] Corrección de Bandera de Campeón, Caché de Avatar y Traducción de Errores de Autenticación
- **Descripción:** Se resolvieron los bugs visuales del indicador de posición, el retraso del caché al subir foto de perfil, y se amigabilizó el error de límite de correos.
- **Detalles:**
  * **Bandera de Campeón en Ranking del Top Bar (`index.tsx`):** Se corrigió un error tipográfico donde se utilizaba la variable inexistente `localChampion` en lugar de `localChampionCode`. Esto causaba que la bandera junto al puesto de clasificación (ej. `#3`) siempre recayera en la del país de origen del perfil en lugar de la del campeón predicho.
  * **Busto de Caché de CDN al Subir Avatar (`profile.tsx`):** 
    - Ahora, al subir una nueva foto de perfil, se genera un nombre de archivo único utilizando la marca de tiempo (`avatar_[timestamp].ext`), lo que obliga a la CDN (Cloudflare/Supabase Storage) y al navegador a recargar la nueva imagen de inmediato en lugar de servir la antigua cacheada.
    - Se agregó una subrutina para listar y eliminar los archivos de avatar previos del usuario en el storage antes de subir la nueva foto, evitando acumular archivos innecesarios.
  * **Traducción y Control de Errores en Auth (`profile.tsx`):**
    - Se implementó un formateador de errores `getAuthErrorMessage` para interceptar mensajes técnicos en inglés de Supabase Auth.
    - El error `"Email rate limit exceeded"` (provocado por el límite de Supabase de 1 correo por minuto) ahora se muestra en español amigable: *"Has realizado demasiadas solicitudes seguidas. Por seguridad, por favor espera 1 minuto antes de volver a intentarlo."*
    - Se tradujo también el error de credenciales incorrectas.
- **Archivos modificados:**
  * [index.tsx](file:///d:/AntigravitDev/golazo-main/src/routes/index.tsx)
  * [profile.tsx](file:///d:/AntigravitDev/golazo-main/src/routes/profile.tsx)


### [2026-06-22 10:28] Persistencia de Sesión Híbrida (Cookies + LocalStorage) y Estilos de Autocompletado
- **Descripción:** Se solucionó el problema de pérdida de sesión al cerrar la app/PWA y la visibilidad del botón de revelar contraseña.
- **Detalles:**
  * **Persistencia Híbrida (`supabase.ts`):** Implementamos un adaptador de almacenamiento híbrido (`hybridStorage`) para el cliente de Supabase. Escribe la sesión tanto en `localStorage` como en `document.cookie` (con vigencia de 365 días). Esto soluciona de raíz la pérdida de sesión en entornos de PWA en iOS/Android o navegadores que limpian el almacenamiento local al cerrar pestañas, recuperando la sesión desde las cookies persistentes.
  * **Visibilidad del Ojo de Contraseña (`styles.css`):**
    - Se ocultaron por CSS los botones de revelación de contraseña nativos del navegador (Edge `::-ms-reveal` y Webkit autocompletado), que colisionaban visualmente con el icono del ojo de la interfaz.
    - Se sobrescribieron los estilos de autocompletado de los navegadores (Webkit Autofill), manteniendo el fondo oscuro de la quiniela (`oklch(0.14 0.02 250)`) y el color de texto blanco. Esto previene que el navegador pinte el input de color azul/celeste brillante, permitiendo ver con claridad el botón de ojo de Lucide (`text-white/70`).
- **Archivos modificados:**
  * [supabase.ts](file:///d:/AntigravitDev/golazo-main/src/lib/supabase.ts)
  * [styles.css](file:///d:/AntigravitDev/golazo-main/src/styles.css)


### [2026-06-22 10:15] Filtro de Países Clasificados al Mundial 2026 en Selectores
- **Descripción:** Se filtraron los listados de selecciones para mostrar únicamente los 48 equipos oficialmente clasificados al Mundial 2026.
- **Detalles:**
  * **Selección Favorita al Registrarse:** Se reemplazó el listado global de 82 países por las 48 selecciones clasificadas (obtenidas desde la estructura oficial de grupos), eliminando la confusión de poder elegir países no participantes.
  * **Predicción de Campeón del Mundo:** Se aplicó el mismo filtro de 48 selecciones en el buscador y selector de campeón mundial (`champion.tsx`), alineando el formulario con el subtítulo indicativo de la pantalla.
- **Archivos modificados:**
  * [profile.tsx](file:///d:/AntigravitDev/golazo-main/src/routes/profile.tsx)
  * [champion.tsx](file:///d:/AntigravitDev/golazo-main/src/routes/champion.tsx)


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
