# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - generic [ref=e5]: La conexión está tardando mucho. Verifique su red o configuración.
    - button "Cerrar notificación" [ref=e6] [cursor=pointer]:
      - img [ref=e7]
  - generic [ref=e10]:
    - generic [ref=e11]:
      - heading "Bienvenido" [level=2] [ref=e12]
      - paragraph [ref=e13]: Ingresa tus credenciales
    - generic [ref=e14]:
      - generic [ref=e15]:
        - generic [ref=e16]:
          - generic [ref=e17]: Correo Electrónico
          - textbox "Correo Electrónico" [ref=e18]:
            - /placeholder: tu@email.com
            - text: rockwell.harrison@gmail.com
        - generic [ref=e19]:
          - generic [ref=e20]: Contraseña
          - generic [ref=e21]:
            - textbox "Contraseña" [ref=e22]: "270386"
            - button "Mostrar contraseña" [ref=e23] [cursor=pointer]:
              - img [ref=e24]
      - generic [ref=e27]: "Error al iniciar sesión: Failed to fetch"
      - generic [ref=e28]:
        - generic [ref=e29]:
          - img [ref=e30]
          - generic [ref=e32]: Problema de Conexión
        - paragraph [ref=e33]: No se pudo conectar con el servidor. Verifique su internet y credenciales.
        - generic [ref=e34]: "Sugerencia: Revise que las variables VITE_SUPABASE_URL y ANNON_KEY sean correctas en .env.local"
      - generic [ref=e35]:
        - button "Iniciar Sesión" [ref=e36] [cursor=pointer]
        - button "Usar enlace mágico (sin contraseña)" [ref=e37] [cursor=pointer]
```