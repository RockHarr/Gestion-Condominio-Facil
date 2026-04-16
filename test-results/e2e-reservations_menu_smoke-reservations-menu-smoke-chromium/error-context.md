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
      - paragraph [ref=e13]: Ingresa tu correo para continuar
    - generic [ref=e14]:
      - generic [ref=e16]:
        - generic [ref=e17]: Correo Electrónico
        - textbox "Correo Electrónico" [ref=e18]:
          - /placeholder: tu@email.com
      - generic [ref=e19]:
        - button "Enviar enlace de acceso" [ref=e20] [cursor=pointer]
        - button "Usar contraseña" [ref=e21] [cursor=pointer]
```