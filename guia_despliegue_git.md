# Guía de Git, GitHub y Despliegue en Vercel

Esta guía detalla los pasos para trabajar con Git, guardar tus cambios en GitHub y desplegar tu aplicación en Vercel de manera profesional y automática.

---

## 1. Configuración de Git y GitHub (Paso a Paso)

Si vas a clonar el proyecto por primera vez o asociarlo a un nuevo repositorio de GitHub, sigue estos pasos:

### Configurar tu identidad en Git
Abre tu terminal en la raíz del proyecto y define tu nombre y correo (solo es necesario hacerlo una vez):
```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu-correo@ejemplo.com"
```

### Inicializar el Repositorio Local
Si el proyecto aún no tiene Git inicializado:
```bash
git init
```

### Vincular con GitHub
1. Entra a [GitHub](https://github.com) y crea un nuevo repositorio (vacío, sin README ni .gitignore).
2. Copia la URL de tu repositorio (se ve como `https://github.com/usuario/nombre-repo.git`).
3. Asocia tu carpeta local con el repositorio remoto:
   ```bash
   git remote add origin https://github.com/tu-usuario/tu-repositorio.git
   ```
4. Define la rama principal como `main`:
   ```bash
   git branch -M main
   ```

---

## 2. Flujo de Trabajo Diario (Commit y Push)

Cada vez que realices cambios en el código y quieras guardarlos en GitHub, debes seguir este flujo de 3 comandos:

### Paso A: Revisar cambios (`git status`)
Muestra qué archivos has modificado o creado:
```bash
git status
```

### Paso B: Preparar archivos (`git add`)
Elige los archivos que quieres incluir en el próximo guardado.
* Para agregar **todos** los archivos modificados:
  ```bash
  git add .
  ```
* Para agregar archivos **específicos** (recomendado):
  ```bash
  git add src/routes/index.tsx src/hooks/useAuth.ts
  ```

### Paso C: Confirmar cambios (`git commit`)
Crea un punto de guardado con un mensaje descriptivo de lo que hiciste:
```bash
git commit -m "fix: solucionar race condition y parpadeos visuales en el inicio"
```

### Paso D: Subir a GitHub (`git push`)
Envía tus commits guardados localmente al servidor de GitHub:
```bash
git push -u origin main
```
*(El `-u origin main` solo es necesario la primera vez; de ahí en adelante puedes usar simplemente `git push`)*.

---

## 3. Subir y Desplegar la Aplicación en Vercel

Vercel se conecta directamente con tu repositorio de GitHub para compilar y publicar la app automáticamente cada vez que haces un `git push`.

### Paso 1: Crear cuenta e iniciar sesión
1. Entra a [Vercel](https://vercel.com).
2. Inicia sesión seleccionando **Continue with GitHub** (esto vinculará tus cuentas automáticamente).

### Paso 2: Importar el proyecto
1. En el panel de Vercel, haz clic en **Add New...** y selecciona **Project**.
2. Aparecerá una lista con tus repositorios de GitHub. Busca el repositorio de la quiniela (`golazoapp` o similar) y haz clic en **Import**.

### Paso 3: Configurar el proyecto
En la pantalla de configuración de Vercel, realiza los siguientes ajustes:
* **Framework Preset:** Selecciona **Vite** (o déjalo en *Other* si detecta automáticamente la configuración del proyecto).
* **Root Directory:** Déjalo como `./` (la raíz).
* **Build and Development Settings:** Déjalos por defecto.

### Paso 4: Agregar Variables de Entorno (¡Crítico!)
Para que la aplicación se conecte correctamente a la base de datos de Supabase y las APIs, debes copiar las variables de tu archivo local `.env` a la sección **Environment Variables** en Vercel:

Agrega las siguientes claves con sus respectivos valores:
1. `VITE_SUPABASE_URL` (Tu URL de Supabase)
2. `VITE_SUPABASE_ANON_KEY` (Tu clave anónima pública de Supabase)
3. `VITE_API_FOOTBALL_KEY` (Tu clave de la API de Football si la usas en producción)
4. `VITE_API_FOOTBALL_URL` (URL base de la API, ej. `https://v3.football.api-sports.io`)

*Haz clic en **Add** por cada variable para guardarla.*

### Paso 5: Desplegar (`Deploy`)
Haz clic en el botón **Deploy**. Vercel compilará la aplicación y en 1-2 minutos te entregará una URL pública (ej. `https://tu-proyecto.vercel.app`) donde tu quiniela estará activa y funcional.

---

## 4. Despliegues Automáticos Continuos

Una vez configurado Vercel, **no necesitas volver a la web de Vercel para subir cambios**. El flujo es 100% automático:

1. **Modificas el Código** localmente.
2. Haces **git commit** de los cambios.
3. Haces **git push** para enviarlos a GitHub.
4. **Vercel detecta el push** en la rama `main` y compila y actualiza tu web de forma inmediata.
