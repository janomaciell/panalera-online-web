# Pañalera Online — Guía de desarrollo

## Estructura
```
panalera/
├── frontend/   → React + Vite (deploy en Vercel)
└── backend/    → Django REST Framework (deploy en Render)
```

---

## 🚀 Setup Frontend

```bash
cd frontend
cp .env.example .env          # configurar VITE_API_URL y VITE_MP_PUBLIC_KEY
npm install
npm run dev                   # http://localhost:5173
```

---

## 🐍 Setup Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # completar todas las variables

# Base de datos local (SQLite para desarrollo)
python manage.py migrate
python manage.py createsuperuser

# Generar ciclos de envío para los próximos 3 meses
python manage.py generate_cycles --months 3

# Cargar zonas de envío iniciales
python manage.py loaddata shipping/fixtures/initial_zones.json

python manage.py runserver    # http://localhost:8000
```

---

## 🔑 Variables de entorno

### Frontend (.env)
| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | URL del backend (ej: `http://localhost:8000/api`) |
| `VITE_MP_PUBLIC_KEY` | Public key de MercadoPago |

### Backend (.env)
| Variable | Descripción |
|----------|-------------|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | `True` en desarrollo, `False` en producción |
| `DATABASE_URL` | URL de PostgreSQL Supabase |
| `EMAIL_HOST_USER` | Email Gmail para enviar notificaciones |
| `EMAIL_HOST_PASSWORD` | App password de Gmail |
| `MP_ACCESS_TOKEN` | Access token de MercadoPago |
| `FRONTEND_URL` | URL del frontend (para emails y redirecciones) |

---

## 📦 API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Registro de usuario |
| POST | `/api/auth/login/` | Login → tokens JWT |
| POST | `/api/auth/refresh/` | Refresh token |
| GET | `/api/auth/me/` | Perfil del usuario |
| GET | `/api/products/` | Listado de productos activos |
| GET | `/api/products/<slug>/` | Detalle de producto |
| POST | `/api/orders/` | Crear pedido + preferencia MP |
| GET | `/api/orders/me/` | Mis pedidos |
| POST | `/api/orders/webhook/` | Webhook MercadoPago |
| GET | `/api/shipping/zones/` | Zonas de envío activas |
| POST | `/api/shipping/calculate/` | Calcular precio de envío |
| GET | `/api/shipping/next-cycle/` | Próximo ciclo de envío |
| GET | `/api/dashboard/orders/` | Todos los pedidos (staff) |
| PATCH | `/api/dashboard/orders/<id>/status/` | Cambiar estado + email auto |
| GET/POST | `/api/dashboard/products/` | CRUD productos (staff) |
| GET/POST | `/api/dashboard/shipping-zones/` | CRUD zonas (staff) |
| GET | `/api/dashboard/stats/` | KPIs del dashboard |

---

## 📅 Sistema de ciclos de envío

Los envíos salen el **1° y el 15** de cada mes.
El cierre de pedidos es el **día anterior** a cada envío.

```bash
# Generar ciclos manualmente (o via cron en Render)
python manage.py generate_cycles --months 3
```

**Flujo de estados de un pedido:**
```
pending → preparing → shipping → in_transit → delivered
                         ↓              ↓
                    📧 email       📧 email
                 "Sale hoy"     "Entregado"
```

---

## 📧 Emails automáticos

| Disparador | Asunto |
|-----------|--------|
| Pago aprobado (webhook) | ✨ Tu pedido fue confirmado |
| Pago aprobado (webhook) | 📦 Tu pedido llegará el [fecha] |
| Estado → `shipping` | 🚚 Hoy sale tu pedido rumbo a la costa |
| Estado → `delivered` | ❤️ Tu pedido fue entregado |

---

## 🚢 Deploy

### Vercel (frontend)
```bash
cd frontend
npx vercel --prod
# Configurar env vars en el dashboard de Vercel
```

### Render (backend)
1. Conectar repositorio en render.com
2. Configurar variables de entorno
3. El `render.yaml` ya tiene el buildCommand con migrate + generate_cycles

### Supabase
1. Crear proyecto en supabase.com
2. Ir a Settings → Database → Connection string (Session Pooler, puerto 5432)
3. Pegar en `DATABASE_URL` del backend
