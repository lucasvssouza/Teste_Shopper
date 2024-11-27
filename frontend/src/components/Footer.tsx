import React from "react";
import { Container, Row, Col } from "react-bootstrap";

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark text-white py-3">
      <Container>
        <Row>
         
          <Col md={4} className="mb-3 mb-md-0">
            <h5>Links Úteis</h5>
            <ul className="list-unstyled">
              <li><a href="/" className="text-white">Linkedin</a></li>
            </ul>
          </Col>
          <Col md={4} className="mb-3 mb-md-0">
            <h5>Contato</h5>
            <ul className="list-unstyled">
              <li>Email: lucas_vss@hotmaill.com</li>
              <li>Telefone: +55 11 96692-9698</li>
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
