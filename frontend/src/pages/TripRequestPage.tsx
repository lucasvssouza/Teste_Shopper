import React, { useState, useRef, useEffect } from "react";
import { Button, FormControl, Row, Col, Container, FormLabel, Offcanvas } from "react-bootstrap";
import { GoogleMap, useJsApiLoader, Libraries } from '@react-google-maps/api';
import axios, { AxiosResponse } from "axios";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import RatingStars from "../components/RatingStars";

interface IDriver {
  id: string;
  name: string;
  description: string;
  vehicle: string;
  review: {
    rating: number;
    comment: string;
  };
  value: number;
}

interface ITripRequestPageState {
  customerId: string;
  distance: string | null;
  duration: string | null;
  drivers: IDriver[];
  show: boolean;
  center: {
    lat: number;
    lng: number;
  };
}

const libraries: Libraries = ['places'];

const TripRequestPage: React.FC = () => {
  const [state, setState] = useState<ITripRequestPageState>({
    customerId: '',
    distance: null,
    duration: null,
    drivers: [],
    show: false,
    center: { lat: -23.523078203911453, lng: -46.67423087273223 },
  });

  const [directionsRenderer, setDirectionsRenderer] = useState<any>()

  const originRef = useRef<HTMLInputElement>(null);
  const destinationRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const containerStyle = {
    width: '100%',
    height: '600px',
  };

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_API_KEY!,
    libraries
  });

  const handleMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
  };

  useEffect(() => {
    if (isLoaded && originRef.current && destinationRef.current) {
      new google.maps.places.Autocomplete(originRef.current, {
        fields: ['place_id', 'geometry', 'name', 'formatted_address'],
        bounds: new google.maps.LatLngBounds(new google.maps.LatLng(state.center.lat, state.center.lng)),
      });

      new google.maps.places.Autocomplete(destinationRef.current, {
        fields: ['place_id', 'geometry', 'name', 'formatted_address'],
        bounds: new google.maps.LatLngBounds(new google.maps.LatLng(state.center.lat, state.center.lng)),
      });

      setDirectionsRenderer(new google.maps.DirectionsRenderer())
    }
  }, [isLoaded, state.center]);

  async function calculateRoute() {
    if (!originRef.current || !destinationRef.current || originRef.current.value === '' || destinationRef.current.value === '' || state.customerId === '') {
      toast.error("Por favor, preencha todos os campos (incluindo o ID do usuário).");
      return;
    }

    try {
      let response: AxiosResponse = await axios.post('http://localhost:8080/ride/estimate', {
        customer_id: state.customerId,
        origin: originRef.current.value,
        destination: destinationRef.current.value,
      });

      setState(prevState => ({
        ...prevState,
        distance: response.data.distance,
        duration: response.data.duration,
        drivers: response.data.options,
        show: true,
      }));

      if (response.data.origin && response.data.destination) {
        setState(prevState => ({
          ...prevState,
          center: {
            lat: (response.data.origin.latitude + response.data.destination.latitude) / 2,
            lng: (response.data.origin.longitude + response.data.destination.longitude) / 2,
          }
        }));

        const directionsService = new google.maps.DirectionsService();
        // const directionsRenderer = new google.maps.DirectionsRenderer();
        directionsRenderer.setMap(mapRef.current);

        const request = {
          origin: originRef.current.value,
          destination: destinationRef.current.value,
          travelMode: google.maps.TravelMode.DRIVING,
        };

        directionsService.route(request, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
          } else {
            toast.error("Não foi possível calcular a rota.");
          }
        });
      }

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

  async function requestTravel(driver: IDriver) {
    if (!originRef.current || !destinationRef.current || originRef.current.value === '' || destinationRef.current.value === '' || state.customerId === '') {
      toast.error("Não foi possível receber os dados da corrida.");
      return;
    }

    try {
      const travel = {
        customer_id: state.customerId,
        origin: originRef.current.value,
        destination: destinationRef.current.value,
        driver: {
          id: driver.id,
          name: driver.name,
        },
        value: driver.value,
        distance: state.distance,
        duration: state.duration,
      };

      const response: AxiosResponse = await axios.patch('http://localhost:8080/ride/confirm', travel);

      if (response.data.success === true) {
        toast.success(
          <>
            <strong>Corrida realizada com sucesso!</strong> <br /> Verifique a listagem de corridas.
          </>
        );
        originRef.current.value = '';
        destinationRef.current.value = '';
        setState(prevState => ({
          ...prevState,
          customerId: '',
          show: false,
          drivers: [],
          distance: null,
          duration: null
        }));


        directionsRenderer.setMap(null);
      }
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
              value={state.customerId}
              onChange={(e) => setState(prevState => ({ ...prevState, customerId: e.target.value }))}
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
            <p>Distância: {state.distance ? state.distance + 'm' : null}</p>
          </Col>
          <Col md={6}>
            <p>Duração: {state.duration}</p>
          </Col>
        </Row>
      </div>

      {isLoaded ? (
        <GoogleMap
          id="map"
          zoom={18}
          mapContainerStyle={containerStyle}
          center={state.center}
          onLoad={handleMapLoad}
        >
        </GoogleMap>
      ) : (
        <p>Carregando o Mapa...</p>
      )}

      <Offcanvas show={state.show} onHide={() => setState(prevState => ({ ...prevState, show: false }))} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Motoristas Disponíveis</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <ul className="list-group">
            {state.drivers.map((driver) => (
              <li key={driver.id} className="list-group-item">
                <div className="d-flex row m-0 p-0">
                  <span>
                    <strong>Motorista: </strong>{driver.name}
                  </span>
                  <span>
                    <strong>Veículo: </strong>{driver.vehicle}
                  </span>
                  <span>
                    <span>
                      <strong>Avaliação: </strong>
                      <RatingStars rating={driver.review.rating} />
                    </span>
                  </span>
                  <span>
                    <strong>Valor: </strong>R$ {driver.value.toFixed(2).replace('.', ',')}
                  </span>
                  <div className="d-flex justify-content-end m-0 p-0 mb-1 mt-2">
                    <button
                      className="btn btn-secondary"
                      onClick={() => requestTravel(driver)}
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
