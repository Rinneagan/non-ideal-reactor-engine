from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import List
import numpy as np

from core_solver import solve_reactor_bvp
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class SolveRequest(BaseModel):
    dispersion_num: float = Field(
        ...,
        gt=0,
        description="Dispersion Number (D_a = D/uL), must be positive"
    )
    damkohler_num: float = Field(
        ...,
        ge=0,
        description="Damköhler Number (Da = k*tau*C0^(n-1)), must be non-negative"
    )
    reaction_order: float = Field(
        ...,
        gt=0,
        description="Reaction order (n), must be positive"
    )
    mesh_points: int = Field(
        default=100,
        ge=10,
        le=1000,
        description="Number of mesh points for initial guess (10-1000)"
    )

    @field_validator('dispersion_num')
    @classmethod
    def dispersion_num_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Dispersion number must be positive')
        return v

    @field_validator('damkohler_num')
    @classmethod
    def damkohler_num_must_be_non_negative(cls, v):
        if v < 0:
            raise ValueError('Damköhler number must be non-negative')
        return v

    @field_validator('reaction_order')
    @classmethod
    def reaction_order_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Reaction order must be positive')
        return v


class SolveResponse(BaseModel):
    x: List[float] = Field(..., description="Spatial coordinate array (dimensionless length)")
    y: List[float] = Field(..., description="Concentration profile array (dimensionless concentration)")
    exit_concentration: float = Field(..., description="Exit concentration at x=1")
    conversion: float = Field(..., description="Overall conversion percentage (0-100)")
    peclet_number: float = Field(..., description="Peclet number (Pe = 1/D_a)")
    reactor_type: str = Field(..., description="Qualitative description of flow regime")
    cstr_conversion: float | None = Field(None, description="Conversion for ideal CSTR (first-order only)")
    pfr_conversion: float | None = Field(None, description="Conversion for ideal PFR (first-order only)")
    deviation_from_ideal: float | None = Field(None, description="Deviation from ideal PFR (first-order only)")
    success: bool = Field(..., description="Whether the solver converged successfully")
    message: str = Field(default="", description="Status message or error details")


app = FastAPI(
    title="Non-Ideal Reactor Dynamics Engine",
    description="API for solving 1D advection-dispersion-reaction Boundary Value Problems",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(f"Validation error: {exc}")
    print(f"Request body: {await request.body()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": str(await request.body())},
    )


@app.get("/")
async def root():
    return {
        "name": "Non-Ideal Reactor Dynamics Engine",
        "version": "1.0.0",
        "endpoints": {
            "POST /api/solve": "Solve the reactor BVP",
            "GET /": "API information"
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/api/solve", response_model=SolveResponse)
async def solve_bvp(request: SolveRequest):
    print(f"Received request: dispersion_num={request.dispersion_num}, "
          f"damkohler_num={request.damkohler_num}, "
          f"reaction_order={request.reaction_order}, "
          f"mesh_points={request.mesh_points}")

    try:
        x, y, metrics = solve_reactor_bvp(
            dispersion_num=request.dispersion_num,
            damkohler_num=request.damkohler_num,
            reaction_order=request.reaction_order,
            mesh_points=request.mesh_points
        )

        x_list = x.tolist()
        y_list = y.tolist()

        return SolveResponse(
            x=x_list,
            y=y_list,
            exit_concentration=metrics["exit_concentration"],
            conversion=metrics["conversion"],
            peclet_number=metrics["peclet_number"],
            reactor_type=metrics["reactor_type"],
            cstr_conversion=metrics["cstr_conversion"],
            pfr_conversion=metrics["pfr_conversion"],
            deviation_from_ideal=metrics["deviation_from_ideal"],
            success=True,
            message="BVP solved successfully"
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Parameter validation error: {str(e)}"
        )

    except RuntimeError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Solver convergence error: {str(e)}"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
