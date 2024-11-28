import React, { useEffect, useState } from 'react';
import { Container, Row, Col, FormControl, FormLabel, Button, FormSelect } from 'react-bootstrap';
import axios, { AxiosResponse } from 'axios';
import DataTable, { TableColumn } from 'react-data-table-component';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Interfaces para os dados
interface IDriver {
  id: string;
  name: string;
}

interface IRide {
  date: string;
  origin: string;
  destination: string;
  distance: number;
  duration: string;
  value: number;
  driver: {
    id: string;
    name: string;
  };
}

const TripHistoryPage: React.FC = () => {
  const [drivers, setDrivers] = useState<IDriver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>(''); 
  const [rides, setRides] = useState<IRide[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Busca os motoristas
  useEffect(() => {
    async function fetchDrivers() {
      try {
        const response: AxiosResponse<IDriver[]> = await axios.get('http://localhost:8080/drivers');
        setDrivers([{ id: '', name: 'Todos os Motoristas' }, ...response.data]);
      } catch (error) {
        console.error('Erro ao buscar motoristas:', error);
        toast.error('Erro ao carregar motoristas.');
      }
    }
    fetchDrivers();
  }, []);

  // Função para buscar corridas
  const fetchRides = async () => {
    if (!customerId) {
      toast.error('Por favor, insira o ID do usuário.');
      return;
    }

    setLoading(true);
    try {
      const response: AxiosResponse<{ rides: IRide[] }> = await axios.get('http://localhost:8080/ride/'+customerId, {
        params: { driver_id: selectedDriver },
      });

      setRides(response.data.rides || []);
    } catch (error: any) {
      console.error('Erro ao buscar corridas:', error);

      if (error.response && error.response.data) {
        const { error_code, error_description } = error.response.data;

        if (error_code === 'INVALID_DRIVER') {
          toast.error(`Motorista inválido: ${error_description}`);
        } else if (error_code === 'NO_RIDES_FOUND') {
          toast.info('Nenhuma corrida encontrada.');
        } else {
          toast.error('Erro ao buscar corridas.');
        }
      } else {
        toast.error('Erro ao conectar ao servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Configurações do DataTable
  const columns: TableColumn<IRide>[] = [
    {
      name: 'Data',
      selector: (row) => new Date(row.date).toLocaleString(),
      sortable: true,
    },
    {
      name: 'Origem',
      selector: (row) => row.origin,
      sortable: true,
    },
    {
      name: 'Destino',
      selector: (row) => row.destination,
      sortable: true,
    },
    {
      name: 'Distância',
      selector: (row) => `${row.distance} km`,
      sortable: true,
    },
    {
      name: 'Duração',
      selector: (row) => row.duration,
      sortable: true,
    },
    {
      name: 'Valor',
      selector: (row) => row.value ? `R$ ${Number(row.value).toFixed(2).replace('.', ',')}` : 'R$ 0,00',
      sortable: true,
    },
    {
      name: 'Motorista',
      selector: (row) => row.driver.name,
      sortable: true,
    },
  ];

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col xs={12} md={12} lg={4} className="mb-3">
          <FormLabel>ID do Usuário:</FormLabel>
          <FormControl
            type="text"
            placeholder="Digite o ID do usuário"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          />
        </Col>
        <Col xs={12} md={12} lg={4} className="mb-3">
          <FormLabel>Selecione o Motorista:</FormLabel>
          <FormSelect
            as="select"
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
          >
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name}
              </option>
            ))}
          </FormSelect>
        </Col>
        <Col xs={12} md={12} lg={4} className="d-flex justify-content-end align-items-end mb-3">
          <Button variant="primary" onClick={fetchRides}>
            Pesquisar
          </Button>
        </Col>
      </Row>
      <Row>
        <Col>
          <DataTable
            title="Histórico de Corridas"
            columns={columns}
            data={rides}
            pagination
            progressPending={loading}
            noDataComponent="Nenhuma corrida encontrada."
          />
        </Col>
      </Row>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop />
    </Container>
  );
};

export default TripHistoryPage;
