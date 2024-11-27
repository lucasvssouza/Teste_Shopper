import React from "react";
import { Link } from "react-router-dom";

const Navbar: React.FC = () => (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container">
            <Link className="navbar-brand" to="/">
                App de Táxi
            </Link>
            <div className="collapse navbar-collapse">
                <ul className="navbar-nav me-auto">
                    <li className="nav-item">
                        <Link className="nav-link" to="/">
                            Solicitar Viagem
                        </Link>
                    </li>
            
                    <li className="nav-item">
                        <Link className="nav-link" to="/history">
                            Histórico de Viagens
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
);

export default Navbar;