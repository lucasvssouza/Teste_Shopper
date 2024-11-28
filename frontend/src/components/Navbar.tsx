import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { Offcanvas } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { faHome, faHistory } from "@fortawesome/free-solid-svg-icons"; 
import "../styles/Navbar.css"; // Certifique-se de importar o CSS

const Navbar: React.FC = () => {
    const [showSidebar, setShowSidebar] = useState(false);

    const toggleSidebar = () => setShowSidebar(!showSidebar);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 992 && showSidebar) {
                setShowSidebar(false);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [showSidebar]);

    return (
        <>
            <nav className="navbar navbar-expand-lg navbar-light bg-dark">
                <div className="container d-flex justify-content-between align-items-end">
                    <Link className="navbar-brand text-light fs-4" to="/">
                        <img src="/logo.png" alt="App de Táxi Logo" style={{ height: '40px', marginRight: '10px' }} />
                        AppTaxi
                    </Link>

                    <button
                        className="navbar-toggler text-light ms-auto"
                        type="button"
                        onClick={toggleSidebar}
                    >
                        <FontAwesomeIcon icon={faBars} style={{ color: "white" }} />
                    </button>

                    <div className="collapse navbar-collapse d-none d-lg-flex">
                        <ul className="navbar-nav">
                            <li className="nav-item text-light">
                                <NavLink
                                    to="/"
                                    end
                                    className={({ isActive }) =>
                                        isActive ? 'nav-link text-light fs-5 nav-link-top active' : 'nav-link text-light fs-5 nav-link-top'
                                    }
                                >
                                    Solicitar Viagem
                                </NavLink>
                            </li>
                            <li className="nav-item text-light">
                                <NavLink
                                    to="/history"
                                    end
                                    className={({ isActive }) =>
                                        isActive ? 'nav-link text-light fs-5 nav-link-top active' : 'nav-link text-light fs-5 nav-link-top'
                                    }
                                >
                                    Histórico de Viagens
                                </NavLink>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <Offcanvas
                show={showSidebar}
                onHide={toggleSidebar}
                placement="start"
                scroll={true}
                backdrop={false}
            >
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>AppTaxi</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <div className="d-flex flex-column align-items-start">
                        <NavLink
                            to="/"
                            onClick={toggleSidebar}
                            className={({ isActive }) =>
                                isActive ? 'nav-link d-flex align-items-center text-light p-3 m-0 bg-dark w-100 sidebar-link active' : 'nav-link d-flex align-items-center text-dark p-3 m-0 w-100 sidebar-link'
                            }
                        >
                            <FontAwesomeIcon icon={faHome} style={{ marginRight: "10px" }} />
                            Solicitar Viagem
                        </NavLink>
                        <NavLink
                            to="/history"
                            onClick={toggleSidebar}
                            className={({ isActive }) =>
                                isActive ? 'nav-link d-flex align-items-center text-light p-3 m-0 bg-dark w-100 sidebar-link active' : 'nav-link d-flex align-items-center text-dark p-3 m-0 w-100 sidebar-link'
                            }
                        >
                            <FontAwesomeIcon icon={faHistory} style={{ marginRight: "10px" }} />
                            Histórico de Viagens
                        </NavLink>
                    </div>
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
};

export default Navbar;
