# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - heading "Bienvenido" [level=2] [ref=e6]
    - paragraph [ref=e7]: Ingresa tu correo para continuar
  - generic [ref=e8]:
    - generic [ref=e10]:
      - generic [ref=e11]: Correo Electrónico
      - textbox "Correo Electrónico" [ref=e12]:
        - /placeholder: tu@email.com
    - generic [ref=e13]:
      - generic [ref=e14]:
        - img [ref=e15]
        - generic [ref=e17]: Problema de Conexión
      - paragraph [ref=e18]: "No se puede conectar con el servidor: Timeout de conexión. Verifique su conexión y la configuración en .env.local"
      - generic [ref=e19]: "Sugerencia: Revise que las variables VITE_SUPABASE_URL y ANNON_KEY sean correctas en .env.local"
    - generic [ref=e20]:
      - button "Enviar enlace de acceso" [ref=e21] [cursor=pointer]
      - button "Usar contraseña" [ref=e22] [cursor=pointer]
```