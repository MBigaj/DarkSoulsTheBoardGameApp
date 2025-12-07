export default function Navbar() {
  return (
    <nav className="navbar navbar-expand bg-light px-4 py-3 d-flex justify-content-evenly align-items-center w-100">
        <button className="btn btn-outline-secondary">CARDS</button>
        <button className="btn btn-outline-secondary">EXPANSIONS</button>

        <span className="text-muted small">IMG</span>

        <button className="btn btn-outline-secondary">CHARACTERS</button>
        <button className="btn btn-outline-secondary">CAMPAIGN</button>
    </nav>
  );
}