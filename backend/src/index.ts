import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import mysql from 'mysql2';

dotenv.config();

const app = express();
const PORT = 8080;

app.use(bodyParser.json());

app.use(cors({
  origin: 'http://localhost',
  methods: ['GET', 'POST', 'PATCH'],
  allowedHeaders: ['Content-Type'],
}));

interface IRide {
  customer_id:string
  id: number;
  date: string;
  origin: string;
  destination: string;
  distance: number;
  duration: string;
  value: number;
  driver: {
    id: number;
    name: string;
  };
}

interface IDriver {
  id: number;
  name: string;
  description?: string;
  vehicle?: string;
  rating?: number;
  comment?: string;
  min_km?: number;
  km_value?: number;
}

// Interface para parâmetros das queries
interface IRideQueryParams {
  driver_id?: string;
  customer_id: string;
}

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'rootpassword',
  database: process.env.MYSQL_DATABASE || 'taxi_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const getDrivers = async (column: string) => {
  return new Promise<any[]>((resolve, reject) => {
    pool.query(`SELECT ${column} FROM drivers ORDER BY name ASC`, (err: any, results: any) => {
      if (err) {
        reject(err);
      }
      resolve(results);
    });
  });
};

const checkDriver = async (driver_id: number) => {
  return new Promise<any[]>((resolve, reject) => {
    pool.query('SELECT * FROM drivers WHERE id = ?', [driver_id], (err: any, results: any) => {
      if (err) {
        reject(err);
      }
      resolve(results);
    });
  });
};

const getRides = async (sql: string, params: any) => {
  return new Promise<any[]>((resolve, reject) => {
    pool.query(sql, params, (err: any, results: any) => {
      if (err) {
        reject(err);
      }
      resolve(results);
    });
  });
};

const insertRide = async (props: any) => {
  return new Promise<any[]>((resolve, reject) => {
    pool.query('INSERT INTO rides (customer_id, origin, destination, distance, duration, driver_id, value) VALUES (?, ?, ?, ?, ?, ?, ?)', props, (err: any, results: any) => {
      if (err) {
        reject(err);
      }
      resolve(results);
    });
  });
}

const getRouteDetails = async (origin: string, destination: string) => {
  const apiKey = process.env.GOOGLE_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
    origin
  )}&destination=${encodeURIComponent(destination)}&key=${apiKey}&travelMode=driving`;

  const response = await axios.get(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'axios/1.7.7',
    },
  });
  return response.data;
};

app.post(
  '/ride/estimate',
  async (
    req: Request<
      {}, // Parâmetros de rota 
      {}, // Corpo da resposta
      { 'customer_id': string; 'origin': string; 'destination': string } // Corpo da requisição
    >,
    res: Response
  ): Promise<void> => {
    try {
      const { customer_id, origin, destination } = req.body;

      if (!customer_id || !origin || !destination) {
        res.status(400).json({
          error_code: 'INVALID_DATA',
          error_description: 'Os campos customer_id, origin e destination são obrigatórios.',
        });
        return;
      }

      if (origin === destination) {
        res.status(400).json({
          error_code: 'INVALID_DATA',
          error_description: 'Os endereços de origem e destino não podem ser iguais.',
        });
        return;
      }

      const routeData = await getRouteDetails(origin, destination);

      if (!routeData.routes || routeData.routes.length === 0) {
        res.status(400).json({
          error_code: 'INVALID_DATA',
          error: routeData.routes,
          error_description: 'Não foi possível calcular a rota entre os pontos fornecidos.',
        });
        return;
      }

      const route = routeData.routes[0];
      const distanceInMeters = route.legs[0].distance.value;
      const duration = route.legs[0].duration.text;
      const originLocation = route.legs[0].start_location;
      const destinationLocation = route.legs[0].end_location;

      const distanceInKm = distanceInMeters / 1000;

      const drivers = await getDrivers('*');
      const availableDrivers = drivers
        .filter((driver) => distanceInKm >= driver.min_km)
        .map((driver) => ({
          id: driver.id,
          name: driver.name,
          description: driver.description,
          vehicle: driver.vehicle,
          review: {
            rating: driver.rating,
            comment: driver.comment,
          },
          value: parseFloat((distanceInKm * driver.km_value).toFixed(2)),
        }))
        .sort((a, b) => a.value - b.value);

      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        origin: {
          latitude: originLocation.lat,
          longitude: originLocation.lng,
        },
        destination: {
          latitude: destinationLocation.lat,
          longitude: destinationLocation.lng,
        },
        distance: distanceInMeters,
        duration,
        options: availableDrivers,
        routeResponse: routeData,
      });

      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error_code: 'INTERNAL_SERVER_ERROR',
        error_description: 'Ocorreu um erro ao processar sua solicitação.',
      });
      return;
    }
  }
);

app.patch(
  '/ride/confirm',
  async (
    req: Request<
      {}, // Parâmetros de rota
      {}, // Corpo da resposta
      {
        'customer_id': string,
        'origin': string,
        'destination': string,
        'distance': number,
        'duration': string,
        'driver': {
          'id': number,
          'name': string
        },
        'value': number
      } // Corpo da requisição
    >,
    res: Response
  ): Promise<void> => {
    try {
      const { customer_id, origin, destination, distance, duration, driver, value } = req.body;

      if (!customer_id || !origin || !destination || !driver || !distance || !value) {
        res.status(400).json({
          error_code: 'INVALID_DATA',
          error_description: 'Todos os campos devem ser preenchidos.',
        });
        return;
      }

      const driverData: any = await checkDriver(driver.id);

      if (driverData.length === 0) {
        res.status(404).json({
          error_code: 'DRIVER_NOT_FOUND',
          error_description: 'Motorista não encontrado.',
        });
        return;
      }

      if (distance < driverData.min_km) {
        res.status(406).json({
          error_code: 'INVALID_DISTANCE',
          error_description: 'A distância é menor que o mínimo permitido pelo motorista.',
        });
        return;
      }

      await insertRide([customer_id, origin, destination, distance, duration, driver.id, value]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error_code: 'INTERNAL_SERVER_ERROR',
        error_description: 'Erro ao salvar a corrida.',
      });
    }
  });

app.get('/ride/:customer_id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { customer_id } = req.params;
    const { driver_id } = req.query;

    if (!customer_id) {
      res.status(400).json({
        error_code: 'MISSING_CUSTOMER_ID',
        error_description: 'O ID do usuário é obrigatório.',
      });
      return;
    }

    let query = `
        SELECT r.id, r.date, r.origin, r.destination, r.distance, r.duration, r.value,
               d.id AS driver_id, d.name AS driver_name
        FROM rides r
        INNER JOIN drivers d ON r.driver_id = d.id
        WHERE r.customer_id = ?
      `;
    const params: any[] = [customer_id];

    if (driver_id) {
      query += ' AND r.driver_id = ?';
      params.push(driver_id);
    }

    query += ' ORDER BY r.date DESC';

    const rides: any = await getRides(query, params);
    if (rides.length === 0) {
      res.status(404).json({
        error_code: 'NO_RIDES_FOUND',
        error_description: 'Nenhuma corrida encontrada.',
      });
      return;
    }

    res.status(200).json({
      customer_id,
      rides: rides.map((ride: any) => ({
        id: ride.id,
        date: ride.date,
        origin: ride.origin,
        destination: ride.destination,
        distance: ride.distance,
        duration: ride.duration,
        driver: {
          id: ride.driver_id,
          name: ride.driver_name,
        },
        value: ride.value,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error_code: 'INTERNAL_SERVER_ERROR',
      error_description: 'Erro ao buscar o histórico de corridas.',
    });
  }
});

app.get('/drivers', async (req: Request, res: Response): Promise<void> => {
  try {
    const drivers = await getDrivers('id, name');

    res.status(200).json(drivers);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error_code: 'INTERNAL_SERVER_ERROR',
      error_description: 'Erro ao buscar os motoristas.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

