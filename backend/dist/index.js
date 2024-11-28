"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const mysql2_1 = __importDefault(require("mysql2"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = 8080;
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)({
    origin: 'http://localhost',
    methods: ['GET', 'POST', 'PATCH'],
    allowedHeaders: ['Content-Type'],
}));
const pool = mysql2_1.default.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'rootpassword',
    database: process.env.MYSQL_DATABASE || 'taxi_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
const getDrivers = (column) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        pool.query(`SELECT ${column} FROM drivers ORDER BY name ASC`, (err, results) => {
            if (err) {
                reject(err);
            }
            resolve(results);
        });
    });
});
const checkDriver = (driver_id) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM drivers WHERE id = ?', [driver_id], (err, results) => {
            if (err) {
                reject(err);
            }
            resolve(results);
        });
    });
});
const getRides = (sql, params) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, results) => {
            if (err) {
                reject(err);
            }
            resolve(results);
        });
    });
});
const insertRide = (props) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        pool.query('INSERT INTO rides (customer_id, origin, destination, distance, duration, driver_id, value) VALUES (?, ?, ?, ?, ?, ?, ?)', props, (err, results) => {
            if (err) {
                reject(err);
            }
            resolve(results);
        });
    });
});
const getRouteDetails = (origin, destination) => __awaiter(void 0, void 0, void 0, function* () {
    const apiKey = process.env.GOOGLE_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${apiKey}&travelMode=driving`;
    const response = yield axios_1.default.get(url, {
        headers: {
            Accept: 'application/json',
            'User-Agent': 'axios/1.7.7',
        },
    });
    return response.data;
});
app.post('/ride/estimate', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const routeData = yield getRouteDetails(origin, destination);
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
        const drivers = yield getDrivers('*');
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error_code: 'INTERNAL_SERVER_ERROR',
            error_description: 'Ocorreu um erro ao processar sua solicitação.',
        });
        return;
    }
}));
app.patch('/ride/confirm', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { customer_id, origin, destination, distance, duration, driver, value } = req.body;
        if (!customer_id || !origin || !destination || !driver || !distance || !value) {
            res.status(400).json({
                error_code: 'INVALID_DATA',
                error_description: 'Todos os campos devem ser preenchidos.',
            });
            return;
        }
        const driverData = yield checkDriver(driver.id);
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
        yield insertRide([customer_id, origin, destination, distance, duration, driver.id, value]);
        res.status(200).json({ success: true });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error_code: 'INTERNAL_SERVER_ERROR',
            error_description: 'Erro ao salvar a corrida.',
        });
    }
}));
app.get('/rides', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { driver_id, customer_id } = req.query;
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
        const params = [customer_id];
        if (driver_id) {
            query += ' AND r.driver_id = ?';
            params.push(driver_id);
        }
        query += ' ORDER BY r.date DESC';
        const rides = yield getRides(query, params);
        if (rides.length === 0) {
            res.status(404).json({
                error_code: 'NO_RIDES_FOUND',
                error_description: 'Nenhuma corrida encontrada.',
            });
            return;
        }
        res.status(200).json({
            customer_id,
            rides: rides.map((ride) => ({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error_code: 'INTERNAL_SERVER_ERROR',
            error_description: 'Erro ao buscar o histórico de corridas.',
        });
    }
}));
app.get('/drivers', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const drivers = yield getDrivers('id, name');
        res.status(200).json(drivers);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error_code: 'INTERNAL_SERVER_ERROR',
            error_description: 'Erro ao buscar os motoristas.',
        });
    }
}));
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
