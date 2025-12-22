import { useNavigate } from "react-router"
import { BASE_ROUTES } from "constants"

export default function Navbar() {
  let navigate = useNavigate()

  return (
    <nav className="navbar navbar-expand bg-light px-4 py-3 d-flex justify-content-evenly align-items-center w-100">
        <button className="btn btn-outline-secondary" onClick={() => navigate(BASE_ROUTES.CARDS)}>CARDS</button>
        <button className="btn btn-outline-secondary" onClick={() => navigate(BASE_ROUTES.EXPANSIONS)}>EXPANSIONS</button>

        <span className="text-muted small">IMG</span>

        <button className="btn btn-outline-secondary" onClick={() => navigate(BASE_ROUTES.CHARACTERS)}>CHARACTERS</button>
        <button className="btn btn-outline-secondary" onClick={() => navigate(BASE_ROUTES.CAMPAIGNS)}>CAMPAIGNS</button>
    </nav>
  );
}