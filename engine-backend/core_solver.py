import numpy as np
from scipy.integrate import solve_bvp
from typing import Tuple, Optional


class ReactorBVPSolver:
    def __init__(
        self,
        dispersion_num: float,
        damkohler_num: float,
        reaction_order: float,
        mesh_points: int = 100
    ):
        if dispersion_num <= 0:
            raise ValueError("Dispersion number must be positive")
        if damkohler_num < 0:
            raise ValueError("Damköhler number must be non-negative")
        if reaction_order <= 0:
            raise ValueError("Reaction order must be positive")
        if mesh_points < 10:
            raise ValueError("Mesh points must be at least 10")

        self.D_a = dispersion_num
        self.Da = damkohler_num
        self.n = reaction_order
        self.mesh_points = mesh_points

    def _ode_system(self, x: np.ndarray, y: np.ndarray) -> np.ndarray:
        concentration = y[0]
        derivative = y[1]
        safe_concentration = np.maximum(concentration, 0)

        dydx = derivative
        d2ydx2 = (derivative + self.Da * (safe_concentration ** self.n)) / self.D_a

        return np.vstack([dydx, d2ydx2])

    def _boundary_conditions(self, ya: np.ndarray, yb: np.ndarray) -> np.ndarray:
        inlet_bc = ya[0] - self.D_a * ya[1] - 1
        outlet_bc = yb[1]

        return np.array([inlet_bc, outlet_bc])

    def _initial_guess(self, x: np.ndarray) -> np.ndarray:
        y_guess = np.exp(-self.Da * x)
        dydx_guess = -self.Da * np.exp(-self.Da * x)

        return np.vstack([y_guess, dydx_guess])

    def solve(self, max_nodes: int = 1000, tolerance: float = 1e-6) -> Tuple[np.ndarray, np.ndarray, dict]:
        x_init = np.linspace(0, 1, self.mesh_points)
        y_init = self._initial_guess(x_init)

        sol = solve_bvp(
            fun=self._ode_system,
            bc=self._boundary_conditions,
            x=x_init,
            y=y_init,
            max_nodes=max_nodes,
            tol=tolerance
        )

        if not sol.success:
            raise RuntimeError(
                f"BVP solver failed to converge: {sol.message}. "
                f"Try adjusting parameters or increasing mesh points."
            )

        x_sol = np.linspace(0, 1, 200)
        y_sol = sol.sol(x_sol)[0]

        metrics = self._calculate_metrics(y_sol)

        return x_sol, y_sol, metrics

    def _calculate_metrics(self, y_sol: np.ndarray) -> dict:
        exit_concentration = float(y_sol[-1])
        conversion = (1.0 - exit_concentration) * 100.0

        peclet_number = 1.0 / self.D_a

        if peclet_number > 100:
            reactor_type = "Near Plug Flow (PFR-like)"
        elif peclet_number > 10:
            reactor_type = "Low Dispersion"
        elif peclet_number > 1:
            reactor_type = "Moderate Dispersion"
        else:
            reactor_type = "High Dispersion (CSTR-like)"

        if self.n == 1.0:
            pfr_conversion = (1.0 - np.exp(-self.Da)) * 100.0
            cstr_conversion = (self.Da / (1.0 + self.Da)) * 100.0
        else:
            pfr_conversion = None
            cstr_conversion = None

        deviation_from_ideal = None
        if self.n == 1.0 and pfr_conversion is not None:
            deviation_from_ideal = abs(conversion - pfr_conversion)

        return {
            "exit_concentration": exit_concentration,
            "conversion": conversion,
            "peclet_number": peclet_number,
            "reactor_type": reactor_type,
            "cstr_conversion": cstr_conversion,
            "pfr_conversion": pfr_conversion,
            "deviation_from_ideal": deviation_from_ideal
        }


def solve_reactor_bvp(
    dispersion_num: float,
    damkohler_num: float,
    reaction_order: float,
    mesh_points: int = 100
) -> Tuple[np.ndarray, np.ndarray, dict]:
    solver = ReactorBVPSolver(
        dispersion_num=dispersion_num,
        damkohler_num=damkohler_num,
        reaction_order=reaction_order,
        mesh_points=mesh_points
    )

    return solver.solve()
