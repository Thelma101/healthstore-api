# PharmaStore API Documentation

**Base URL:** `https://pharmastore-api.onrender.com/api/v1`

---

## 🔑 Render Environment Variables (REQUIRED)

Copy **all** of these into your Render dashboard → Environment tab:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | *(your MongoDB Atlas connection string from .env)* |
| `JWT_SECRET` | *(your 128-char secret from .env)* |
| `JWT_EXPIRE` | `1d` |
| `JWT_COOKIE_EXPIRE` | `86400000` |
| `CLIENT_URL` | `https://pharmastore-api.onrender.com/api/v1/auth` |
| `SENDGRID_API_KEY` | *(your SendGrid API key from .env)* |
| `SENDGRID_VERIFIED_SENDER` | *(your verified sender email from .env)* |
| `CLOUDINARY_CLOUD_NAME` | *(your Cloudinary cloud name from .env)* |
| `CLOUDINARY_API_KEY` | *(your Cloudinary API key from .env)* |
| `CLOUDINARY_API_SECRET` | *(your Cloudinary API secret from .env)* |

---

## 🔐 Authentication

All protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

---

## 📋 API Endpoints & JSON Payloads

### Health Check

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-13T12:00:00.000Z"
}
```

---

### 1. AUTH ROUTES (`/api/v1/auth`)

#### Register

```
POST /api/v1/auth/register
Content-Type: application/json
```

```json
{
  "firstName": "Thelma",
  "lastName": "Akpata",
  "email": "thelma@example.com",
  "password": "StrongPass1!",
  "passwordConfirm": "StrongPass1!",
  "phone": "+2348012345678",
  "address": {
    "street": "123 Lagos Street",
    "city": "Lagos",
    "state": "Lagos",
    "country": "Nigeria"
  }
}
```

> **Password rules:** Min 8 chars, must contain uppercase, lowercase, number, and special character (!@#$%^&*)

#### Login

```
POST /api/v1/auth/login
Content-Type: application/json
```

```json
{
  "email": "thelma@example.com",
  "password": "StrongPass1!"
}
```

#### Forgot Password

```
POST /api/v1/auth/forgot-password
Content-Type: application/json
```

```json
{
  "email": "thelma@example.com"
}
```

#### Reset Password

```
POST /api/v1/auth/reset-password/:token
Content-Type: application/json
```

```json
{
  "password": "NewStrongPass1!"
}
```

#### Verify Email

```
GET /api/v1/auth/verify-email/:token
```

#### Verify Reset Token (renders HTML form)

```
GET /api/v1/auth/reset-password/:token
```

#### Logout 🔒

```
POST /api/v1/auth/logout
Authorization: Bearer <token>
```

#### Update Password 🔒

```
PATCH /api/v1/auth/update-password
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "currentPassword": "StrongPass1!",
  "newPassword": "NewerPass2@"
}
```

---

### 2. DRUG ROUTES (`/api/v1/drugs`)

#### Get All Drugs (Public)

```
GET /api/v1/drugs
GET /api/v1/drugs?page=1&limit=10&sort=-price
GET /api/v1/drugs?price[gte]=500&price[lte]=5000
GET /api/v1/drugs?fields=name,price,category
```

#### Search Drugs (Public)

```
GET /api/v1/drugs/search?q=paracetamol
```

#### Get Drugs by Category (Public)

```
GET /api/v1/drugs/category/antibiotics
```

#### Get Single Drug (Public)

```
GET /api/v1/drugs/:id
```

#### Create Drug 🔒 (Admin/Pharmacist)

```
POST /api/v1/drugs
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "name": "Amoxicillin 500mg",
  "description": "Broad-spectrum antibiotic used to treat various bacterial infections",
  "category": "antibiotics",
  "price": 2500,
  "quantity": 100,
  "dosage": "500mg, 3 times daily",
  "manufacturer": "GSK Nigeria",
  "expiryDate": "2027-12-31",
  "prescriptionRequired": true,
  "sideEffects": ["Nausea", "Diarrhea", "Rash"],
  "images": [
    {
      "url": "https://example.com/amoxicillin.jpg",
      "caption": "Amoxicillin 500mg pack",
      "isPrimary": true
    }
  ]
}
```

#### Update Drug 🔒 (Admin/Pharmacist)

```
PATCH /api/v1/drugs/:id
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "price": 3000,
  "quantity": 150
}
```

#### Delete Drug 🔒 (Admin/Pharmacist)

```
DELETE /api/v1/drugs/:id
Authorization: Bearer <token>
```

#### Upload Drug Images 🔒 (Admin/Pharmacist)

```
POST /api/v1/drugs/:id/images/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Form field: `images` (up to 5 files)

#### Add Drug Image URLs 🔒 (Admin/Pharmacist)

```
POST /api/v1/drugs/:id/images
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "images": [
    {
      "url": "https://example.com/drug-image.jpg",
      "caption": "Front of package",
      "isPrimary": true
    }
  ]
}
```

#### Check Low Stock 🔒

```
GET /api/v1/drugs/inventory/low-stock
Authorization: Bearer <token>
```

#### Check Expired Drugs 🔒

```
GET /api/v1/drugs/inventory/expired
Authorization: Bearer <token>
```

---

### 3. CATEGORY ROUTES (`/api/v1/categories`)

#### Get All Categories (Public)

```
GET /api/v1/categories
```

#### Get Category Stats (Public)

```
GET /api/v1/categories/stats
```

#### Get Single Category (Public)

```
GET /api/v1/categories/:id
```

#### Create Category 🔒 (Admin)

```
POST /api/v1/categories
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "name": "Antibiotics",
  "description": "Drugs used to treat bacterial infections",
  "parentCategory": null,
  "image": "https://example.com/antibiotics.jpg"
}
```

#### Update Category 🔒 (Admin)

```
PATCH /api/v1/categories/:id
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "name": "Antibiotics & Antimicrobials",
  "description": "Updated description"
}
```

#### Delete Category 🔒 (Admin)

```
DELETE /api/v1/categories/:id
Authorization: Bearer <token>
```

---

### 4. CART ROUTES (`/api/v1/cart`) 🔒 All Protected

#### Get Cart

```
GET /api/v1/cart
Authorization: Bearer <token>
```

#### Get Cart Summary

```
GET /api/v1/cart/summary
Authorization: Bearer <token>
```

#### Add Item to Cart

```
POST /api/v1/cart/items
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "drugId": "64a1b2c3d4e5f6a7b8c9d0e1",
  "quantity": 2
}
```

#### Update Cart Item Quantity

```
PATCH /api/v1/cart/items/:cartItemId
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "quantity": 3
}
```

#### Remove Item from Cart

```
DELETE /api/v1/cart/items/:cartItemId
Authorization: Bearer <token>
```

#### Clear Cart

```
DELETE /api/v1/cart/clear
Authorization: Bearer <token>
```

---

### 5. ORDER ROUTES (`/api/v1/orders`) 🔒 All Protected

#### Place Order (from cart)

```
POST /api/v1/orders
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "shippingAddress": {
    "street": "123 Lagos Street",
    "city": "Lagos",
    "state": "Lagos",
    "country": "Nigeria",
    "postalCode": "100001"
  },
  "paymentMethod": "card",
  "notes": "Please deliver before 5pm"
}
```

> `paymentMethod` options: `"card"`, `"bank_transfer"`, `"cash_on_delivery"`

#### Get My Orders

```
GET /api/v1/orders
GET /api/v1/orders?status=pending&page=1&limit=10
```

#### Get Order Details

```
GET /api/v1/orders/:orderId
Authorization: Bearer <token>
```

#### Cancel Order

```
PATCH /api/v1/orders/:orderId/cancel
Authorization: Bearer <token>
```

#### Get All Orders 🔒 (Admin)

```
GET /api/v1/orders/admin/all
Authorization: Bearer <token>
```

#### Update Order Status 🔒 (Admin)

```
PATCH /api/v1/orders/admin/:orderId/status
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "status": "approved"
}
```

> Status options: `"pending"`, `"approved"`, `"rejected"`, `"completed"`, `"cancelled"`

---

### 6. PRESCRIPTION ROUTES (`/api/v1/prescriptions`) 🔒 All Protected

#### Upload Prescription

```
POST /api/v1/prescriptions/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Form fields:
- `images` (up to 5 image files) — **required**
- `notes` (text) — optional

#### Get My Prescriptions

```
GET /api/v1/prescriptions/my-prescriptions
GET /api/v1/prescriptions/my-prescriptions?status=approved
Authorization: Bearer <token>
```

#### Check Valid Prescription

```
GET /api/v1/prescriptions/check-valid
Authorization: Bearer <token>
```

#### Get Prescription by ID

```
GET /api/v1/prescriptions/:prescriptionId
Authorization: Bearer <token>
```

#### Delete Prescription Image

```
DELETE /api/v1/prescriptions/:prescriptionId/images/:imageId
Authorization: Bearer <token>
```

#### Get All Prescriptions 🔒 (Admin)

```
GET /api/v1/prescriptions/admin/all
Authorization: Bearer <token>
```

#### Update Prescription Status 🔒 (Admin)

```
PATCH /api/v1/prescriptions/admin/:prescriptionId/status
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "status": "approved"
}
```

> Status options: `"pending"`, `"approved"`, `"rejected"`

---

### 7. ADMIN USER ROUTES (`/api/v1/admin`) 🔒 Admin Only

#### Get All Users

```
GET /api/v1/admin/users
Authorization: Bearer <token>
```

#### Get User by ID

```
GET /api/v1/admin/users/:id
Authorization: Bearer <token>
```

#### Update User

```
PATCH /api/v1/admin/users/:id
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "isActive": true,
  "role": "admin"
}
```

> **Note:** Only `superadmin` can change user roles.

#### Delete User

```
DELETE /api/v1/admin/users/:id
Authorization: Bearer <token>
```

---

### 8. DASHBOARD ROUTES (`/api/v1/dashboard`) 🔒 Protected

#### Get Dashboard Stats

```
GET /api/v1/dashboard/stats
Authorization: Bearer <token>
```

---

## 📦 Standard Response Format

### Success

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (deleted) |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 429 | Too Many Requests (rate limit: 300/15min) |
| 500 | Server Error |
