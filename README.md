# Non-Ideal Reactor Dynamics Engine

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)
![SciPy](https://img.shields.io/badge/SciPy-Numerical_Integration-orange.svg)

## Overview
The Non-Ideal Reactor Dynamics Engine is a structurally decoupled web application engineered to solve the 1D Advection-Dispersion-Reaction Boundary Value Problem (BVP). 

Unlike standard ideal-flow calculators, this engine specifically targets physical back-mixing and axial dispersion in chemical reactors, providing industrial-grade numerical simulations for systems that deviate from perfect Plug Flow (PFR) or Continuously Stirred Tank (CSTR) behavior.

## Mathematical Core
The engine numerically resolves the dimensionless steady-state governing equation:

$$D_a \frac{d^2y}{dx^2} - \frac{dy}{dx} - Da \cdot y^n = 0$$

Where:
* **$y$**: Dimensionless concentration ($C/C_0$)
* **$x$**: Dimensionless reactor length ($z/L$)
* **$D_a$**: Dispersion Number ($D/uL$)
* **$Da$**: Damköhler Number ($k \tau C_0^{n-1}$)
* **$n$**: Reaction Order

**Danckwerts Boundary Conditions:**
* **Inlet ($x = 0$):** $$1 = y(0) - D_a \frac{dy}{dx}\bigg|_{x=0}$$
* **Outlet ($x = 1$):** $$\frac{dy}{dx}\bigg|_{x=1} = 0$$

### Numerical Stability & Constraints
The solver utilizes `scipy.integrate.solve_bvp`. A critical mathematical safeguard is implemented within the ODE system to prevent structural collapse during high-gradient fractional-order reactions (e.g., $n=0.5$). The engine floors concentration overshoots to absolute zero, preventing the computation of complex numbers and subsequent matrix inversion failures.

## System Architecture
The application employs a strict decoupled architecture, separating the heavy numerical computation from the edge-network user interface.

* **Frontend (Next.js / TypeScript):** Statically exported React application utilizing Tailwind CSS for UI and Plotly.js for dynamic, interactive concentration profiling. Deployed to the edge via **Netlify**.
* **Backend API (FastAPI / Python):** High-performance microservice dedicated strictly to executing SciPy mathematical operations. Configured with strict CORS middleware. Deployed as a persistent web service via **Render**.

## Key Features
* **Peclet Number Integration:** Automatically calculates $Pe$ ($1/D_a$) and classifies the fluid flow regime (Near PFR, Low/Moderate/High Dispersion, CSTR-like).
* **Ideal Benchmarking:** Visually overlays the calculated non-ideal BVP curve against analytical solutions for ideal PFR and CSTR systems, acting as a visual failsafe for structural integrity.
* **Stiff Gradient Handling:** Dynamically handles extreme parameters (e.g., $D_a = 100.0$) without crashing, intercepting numerical divergence and returning clean API error boundaries.

## Local Development Setup

### 1. Backend Initialization
```bash
cd engine-backend
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Frontend Initialization
```bash
cd engine-frontend
npm install
# Ensure .env.local points NEXT_PUBLIC_API_URL to http://localhost:8000/api/solve
npm run dev
```
