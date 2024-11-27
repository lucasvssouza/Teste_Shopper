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
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = 8080;
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)({
    origin: "http://localhost:3000", // Substitua pela URL do seu frontend
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
}));
const drivers = [
    {
        id: 1,
        name: "Homer Simpson",
        description: "Olá! Sou o Homer, seu motorista camarada! Relaxe e aproveite o passeio, com direito a rosquinhas e boas risadas (e talvez alguns desvios).",
        vehicle: "Plymouth Valiant 1973 rosa e enferrujado",
        review: { rating: 2, comment: "Motorista simpático, mas errou o caminho 3 vezes. O carro cheira a donuts." },
        ratePerKm: 2.5,
        minKm: 1,
    },
    {
        id: 2,
        name: "Dominic Toretto",
        description: "Ei, aqui é o Dom. Pode entrar, vou te levar com segurança e rapidez ao seu destino. Só não mexa no rádio, a playlist é sagrada.",
        vehicle: "Dodge Charger R/T 1970 modificado",
        review: { rating: 4, comment: "Que viagem incrível! O carro é um show à parte e o motorista foi super gente boa. Recomendo!" },
        ratePerKm: 5.0,
        minKm: 5,
    },
    {
        id: 3,
        name: "James Bond",
        description: "Boa noite, sou James Bond. À seu dispor para um passeio suave e discreto. Aperte o cinto e aproveite a viagem.",
        vehicle: "Aston Martin DB5 clássico",
        review: { rating: 5, comment: "Serviço impecável! Uma experiência digna de um agente secreto." },
        ratePerKm: 10.0,
        minKm: 10,
    },
];
const getRouteDetails = (origin, destination) => __awaiter(void 0, void 0, void 0, function* () {
    const apiKey = process.env.GOOGLE_API_KEY;
    // console.log(encodeURIComponent(origin));
    // console.log(encodeURIComponent(destination));
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${apiKey}`;
    console.log("URL gerada:", url);
    const response = yield axios_1.default.get(url, {
        headers: {
            Accept: "application/json",
            "User-Agent": "axios/1.7.7",
        },
    });
    ;
    console.log(response);
    return response.data;
});
app.get("/test", (req, res) => {
    res.send("Servidor ativo!");
});
// Endpoint /ride/estimate
app.post("/ride/estimate", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { customer_id, origin, destination } = req.body;
        if (!customer_id || !origin || !destination) {
            res.status(400).json({
                error_code: "INVALID_DATA",
                error_description: "Os campos customer_id, origin e destination são obrigatórios.",
            });
            return;
        }
        if (origin === destination) {
            res.status(400).json({
                error_code: "INVALID_DATA",
                error_description: "Os endereços de origem e destino não podem ser iguais.",
            });
            return;
        }
        const routeData = yield getRouteDetails(origin, destination);
        if (!routeData.routes || routeData.routes.length === 0) {
            res.status(400).json({
                error_code: "INVALID_DATA",
                error: routeData.routes,
                error_description: "Não foi possível calcular a rota entre os pontos fornecidos.",
            });
            return;
        }
        const route = routeData.routes[0];
        const distanceInMeters = route.legs[0].distance.value; // distância em metros
        const duration = route.legs[0].duration.text;
        const originLocation = route.legs[0].start_location;
        const destinationLocation = route.legs[0].end_location;
        // Conversão de distância para quilômetros
        const distanceInKm = distanceInMeters / 1000;
        // Filtrar motoristas disponíveis
        const availableDrivers = drivers
            .filter((driver) => distanceInKm >= driver.minKm)
            .map((driver) => ({
            id: driver.id,
            name: driver.name,
            description: driver.description,
            vehicle: driver.vehicle,
            review: driver.review,
            value: parseFloat((distanceInKm * driver.ratePerKm).toFixed(2)),
        }))
            .sort((a, b) => a.value - b.value);
        // Resposta
        res.status(200).json({
            origin: {
                latitude: originLocation.lat,
                longitude: originLocation.lng,
            },
            destination: {
                latitude: destinationLocation.lat,
                longitude: destinationLocation.lng,
            },
            distance: distanceInKm,
            duration,
            options: availableDrivers,
            routeResponse: routeData,
        });
        return;
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error_code: "INTERNAL_SERVER_ERROR",
            error_description: "Ocorreu um erro ao processar sua solicitação.",
        });
        return;
    }
}));
// Inicializar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
