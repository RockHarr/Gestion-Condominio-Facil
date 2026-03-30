# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - heading "Bienvenido" [level=2] [ref=e6]
    - paragraph [ref=e7]: Ingresa tus credenciales
  - generic [ref=e8]:
    - generic [ref=e9]:
      - generic [ref=e10]:
        - generic [ref=e11]: Correo Electrónico
        - textbox "Correo Electrónico" [ref=e12]:
          - /placeholder: tu@email.com
          - text: resident@example.com
      - generic [ref=e13]:
        - generic [ref=e14]: Contraseña
        - generic [ref=e15]:
          - textbox "Contraseña" [ref=e16]: dummy_password_resident
          - button "Mostrar contraseña" [ref=e17] [cursor=pointer]:
            - img [ref=e18]
    - generic [ref=e21]: "Error al iniciar sesión: Failed to fetch"
    - generic [ref=e22]:
      - generic [ref=e23]:
        - img [ref=e24]
        - generic [ref=e26]: Problema de Conexión
      - paragraph [ref=e27]: No se pudo conectar con el servidor. Verifique su internet y credenciales.
      - generic [ref=e28]: "Sugerencia: Revise que las variables VITE_SUPABASE_URL y ANNON_KEY sean correctas en .env.local"
    - generic [ref=e29]:
      - button "Iniciar Sesión" [ref=e30] [cursor=pointer]
      - button "Usar enlace mágico (sin contraseña)" [ref=e31] [cursor=pointer]
```