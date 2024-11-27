import React, { useState } from "react";

const TripHistoryPage: React.FC = () => {
  const [trips, setTrips] = useState([]);

  const fetchTrips = async () => {
    // Adicionar lógica para buscar histórico de viagens
  };

  return (
    <div>
      <h1>Histórico de Viagens</h1>
      <button onClick={fetchTrips}>Carregar Histórico</button>
      <ul>
        {trips.map((trip: any) => (
          <li key={trip.id}>
            <p>Motorista: {trip.driver.name}</p>
            <p>Origem: {trip.origin}</p>
            <p>Destino: {trip.destination}</p>
            <p>Distância: {trip.distance} km</p>
            <p>Tempo: {trip.duration}</p>
            <p>Valor: R$ {trip.value.toFixed(2)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TripHistoryPage;
