import React, { useState, useRef, useEffect } from "react";
import { Button, FormControl, Row, Col, Container, FormLabel, Offcanvas } from "react-bootstrap";
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import axios from "axios";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TripRequestPage: React.FC = () => {
  const [customerId, setCustomerId] = useState('');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [show, setShow] = useState(false);

  const originRef = useRef<HTMLInputElement>(null);
  const destinationRef = useRef<HTMLInputElement>(null);

  const center = {
    lat: -23.523078203911453,
    lng: -46.67423087273223,
  };

  const containerStyle = {
    width: '100%',
    height: '600px',
  };

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_API_KEY!,
    libraries: ['places'],
  });

  const handleMapLoad = (map: google.maps.Map) => {
    setMapInstance(map);
    console.log('Mapa carregado:', map);
  };

  useEffect(() => {
    if (mapInstance && originRef.current && destinationRef.current) {
      new google.maps.places.Autocomplete(originRef.current, {
        fields: ['place_id', 'geometry', 'name', 'formatted_address'],
        bounds: new google.maps.LatLngBounds(new google.maps.LatLng(center.lat, center.lng)),
      } as google.maps.places.AutocompleteOptions);

      new google.maps.places.Autocomplete(destinationRef.current, {
        fields: ['place_id', 'geometry', 'name', 'formatted_address'],
        bounds: new google.maps.LatLngBounds(new google.maps.LatLng(center.lat, center.lng)),
      } as google.maps.places.AutocompleteOptions);
    }
  }, [mapInstance]);

  async function calculateRoute() {
    if (!originRef.current || !destinationRef.current || originRef.current.value === '' || destinationRef.current.value === '' || customerId === '') {
      toast.error("Por favor, preencha todos os campos (incluindo o ID do usuário).");
      return;
    }

    try {
      const response = await axios.post('http://localhost:8080/ride/estimate', {
        customer_id: customerId,
        origin: originRef.current.value,
        destination: destinationRef.current.value,
      });

      setDistance(response.data.distance);
      setDuration(response.data.duration);
      setDrivers(response.data.options); 
      setShow(true); 

      console.log(response);

    } catch (error: any) {
      if (error.response && error.response.data) {
        const { error_code, error_description } = error.response.data;
        toast.error(
          <>
            <strong>{error_code}</strong> <br /> {error_description}
          </>
        );
      } else {
        toast.error("Erro ao calcular a rota.");
      }
    }
  }

  return (
    <Container fluid className="d-flex flex-column align-items-center vh-100">
      <div className="p-4 bg-white shadow-lg rounded w-100">
        <Row className="mb-3">
          <Col xs={12} md={12} lg={4} className="mb-3">
            <FormLabel>Customer ID: </FormLabel>
            <FormControl
              type="text"
              placeholder="Digite o ID do usuário"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
            />
          </Col>
          <Col xs={12} md={12} lg={4} className="mb-3">
            <FormLabel>Origem: </FormLabel>
            <FormControl
              type="text"
              placeholder="Digite o endereço de origem"
              ref={originRef}
              required
            />
          </Col>
          <Col xs={12} md={12} lg={4} className="mb-3">
            <FormLabel>Destino: </FormLabel>
            <FormControl
              type="text"
              placeholder="Digite o endereço de destino"
              ref={destinationRef}
              required
            />
          </Col>
          <Col xs={12} md={12} lg={12} className="d-flex justify-content-end align-items-center mb-3">
            <Button variant="danger" onClick={calculateRoute}>
              Calcular Rota
            </Button>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <p>Distância: {distance}</p>
          </Col>
          <Col md={6}>
            <p>Duração: {duration}</p>
          </Col>
        </Row>
      </div>

      {isLoaded ? (
        <GoogleMap
          id="map"
          zoom={18}
          mapContainerStyle={containerStyle}
          center={center}
          onLoad={handleMapLoad}
        >
        </GoogleMap>
      ) : (
        <p>Carregando o Mapa...</p>
      )}

      <Offcanvas show={show} onHide={() => setShow(false)} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Motoristas Disponíveis</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <ul className="list-group">
            {drivers.map((driver) => (
              <li key={driver.id} className="list-group-item">
                <div className="d-flex row m-0 p-0">
                  <span>
                    <strong>Motorista: </strong>{driver.name}
                  </span>
                  <span>
                    <strong>Veículo: </strong>{driver.vehicle}
                  </span>
                  <span>
                    <strong>Avaliação: </strong>{driver.review.rating}
                  </span>
                  <span>
                    <strong>Valor: </strong>R$ {driver.value.toFixed(2).replace('.', ',')}
                  </span>
                  <div className="d-flex justify-content-end m-0 p-0 mb-1 mt-2">
                    <button
                      className="btn btn-secondary"
                      onClick={() => alert(`Você escolheu o motorista ${driver.name}`)}
                    >
                      Escolher
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Offcanvas.Body>
      </Offcanvas>

      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop />
    </Container>
  );
};

export default TripRequestPage;
