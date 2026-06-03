# Non-Ideal Reactor Dynamics Engine

A web-based simulation tool for solving 1D advection-dispersion-reaction boundary value problems in chemical reactors. This application provides real-time visualization and analysis of non-ideal reactor behavior with comparison to ideal reactor models.

## Features

- **BVP Solver**: Solves the 1D steady-state advection-dispersion-reaction equation with Danckwerts boundary conditions
- **Real-time Visualization**: Interactive Plotly.js charts showing concentration profiles
- **Chemical Engineering Metrics**:
  - Peclet number (Pe) calculation and flow regime classification
  - Exit concentration and overall conversion
  - Ideal CSTR and PFR comparisons (first-order reactions)
  - Deviation from ideal PFR analysis
- **Physical Interpretation**: Context-aware explanations based on calculated metrics
- **Industrial Parameter Ranges**: Pre-configured realistic input ranges for dispersion number, Damköhler number, and reaction order
- **Responsive Design**: Modern UI built with Next.js and Tailwind CSS

## Tech Stack

### Backend
- **Python 3.11+**
- **FastAPI**: REST API framework
- **SciPy**: BVP solver using `solve_bvp`
- **NumPy**: Numerical computations
- **Pydantic**: Data validation

### Frontend
- **Next.js 16**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **Plotly.js**: Interactive data visualization
- **Google Fonts**: Jost and EB Garamond typography

## Project Structure

```
non-ideal-reactor-engine/
├── engine-backend/
│   ├── core_solver.py      # BVP solver implementation
│   ├── main.py             # FastAPI application
│   └── requirements.txt    # Python dependencies
└── engine-frontend/
    ├── src/
    │   └── app/
    │       ├── page.tsx    # Main dashboard component
    │       ├── layout.tsx # Root layout with fonts
    │       └── globals.css # Global styles
    ├── next.config.ts      # Next.js configuration
    └── package.json        # Node.js dependencies
```

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd engine-backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install fastapi uvicorn scipy numpy pydantic
```

4. Run the backend server:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd engine-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set the API URL environment variable (optional):
```bash
# For local development
export NEXT_PUBLIC_API_URL=http://localhost:8000/api/solve

# For production deployment
export NEXT_PUBLIC_API_URL=https://your-backend-url.com/api/solve
```

4. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Usage

1. Open the application in your browser
2. Adjust the input parameters:
   - **Dispersion Number (Dₐ)**: Controls axial dispersion (0.001-1.0)
   - **Damköhler Number (Da)**: Ratio of reaction rate to residence time (0-20)
   - **Reaction Order (n)**: Kinetic order of the reaction (0.1-5)
   - **Mesh Points**: Numerical resolution for the solver (10-1000)
3. Click "Solve BVP" to compute the solution
4. View the concentration profile, metrics, and physical interpretation

## API Documentation

### POST /api/solve

Solves the reactor BVP with given parameters.

**Request Body:**
```json
{
  "dispersion_num": 0.01,
  "damkohler_num": 2.0,
  "reaction_order": 1.0,
  "mesh_points": 100
}
```

**Response:**
```json
{
  "x": [0.0, 0.005, 0.01, ...],
  "y": [1.0, 0.99, 0.98, ...],
  "exit_concentration": 0.1353,
  "conversion": 86.47,
  "peclet_number": 100.0,
  "reactor_type": "Near Plug Flow (PFR-like)",
  "cstr_conversion": 66.67,
  "pfr_conversion": 86.47,
  "deviation_from_ideal": 0.0,
  "success": true,
  "message": "BVP solved successfully"
}
```

### GET /

Returns API information and available endpoints.

### GET /health

Health check endpoint.

## Mathematical Model

The solver solves the dimensionless governing equation:

```
Dₐ · d²y/dx² - dy/dx - Da · yⁿ = 0
```

With Danckwerts boundary conditions:

- **Inlet (x = 0)**: 1 = y(0) - Dₐ · y'(0)
- **Outlet (x = 1)**: y'(1) = 0

Where:
- `Dₐ` = Dispersion Number (D/uL)
- `Da` = Damköhler Number (k·τ·C₀ⁿ⁻¹)
- `n` = Reaction order
- `y` = Dimensionless concentration (C/C₀)
- `x` = Dimensionless length (z/L)

## Deployment

### Backend Deployment

Deploy the FastAPI backend to a cloud provider (e.g., Railway, Render, AWS):

1. Set up a production server with Gunicorn:
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

2. Update CORS origins in `main.py` to include your frontend URL

### Frontend Deployment

The frontend is configured for static export and can be deployed to Netlify, Vercel, or any static hosting service:

1. Build the static export:
```bash
npm run build
```

2. Deploy the `.next` directory to your hosting platform

3. Set the `NEXT_PUBLIC_API_URL` environment variable to your backend URL

## License

This project is provided as-is for educational and research purposes.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
