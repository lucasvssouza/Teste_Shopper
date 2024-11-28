import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons"; // Corrigido
import { faLinkedin, faWhatsapp } from "@fortawesome/free-brands-svg-icons"; // Importando os ícones
import React from "react";
import { Container, Row, Col } from "react-bootstrap";

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark text-white py-3 custom-footer">
      <Container>

        <Row className="mt-2 text-center"> {/* Adicionada classe 'text-center' */}
          <Col md={4} className="mb-1">
            <h5>Links Úteis</h5>
            <ul className="list-unstyled mb-0">
              <li>
                <a
                  href="https://www.linkedin.com/in/lucas-vssouza/"
                  className="text-white d-flex align-items-center justify-content-center">
                  <FontAwesomeIcon icon={faLinkedin} style={{ marginRight: "8px", color: "white" }} />
                  Linkedin
                </a>
              </li>
            </ul>
          </Col>

          <Col md={4} className="mb-1">
            <h5>Email</h5>
            <ul className="list-unstyled m-0">
              <li>
                <a href="mailto:lucas_vss@hotmail.com" className="text-white d-flex align-items-center justify-content-center">
                  <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: "8px", color: "white" }} />
                  lucas_vss@hotmail.com
                </a>
              </li>
            </ul>
          </Col>

          <Col lg={4} md={4} sm={12} className="mb-1">
            <h5>Telefone</h5>
            <ul className="list-unstyled m-0">
              <li>
                <a
                  href="https://wa.me/5511966929698"
                  className="text-white d-flex align-items-center justify-content-center"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FontAwesomeIcon icon={faWhatsapp} style={{ marginRight: "8px", color: "white" }} />
                  WhatsApp: +55 11 96692-9698
                </a>
              </li>
            </ul>
          </Col>
        </Row>

        <Row className="mt-3">
          <Col className="text-center">
            <p>&copy; 2024 TaxiApp. Todos os direitos reservados.</p>
          </Col>
        </Row>

      </Container>
    </footer>
  );
};

export default Footer;
