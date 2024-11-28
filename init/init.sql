-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS taxi_db;

USE taxi_db;

CREATE TABLE IF NOT EXISTS drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  vehicle VARCHAR(255),
  rating FLOAT,
  comment VARCHAR(255),
  km_value DECIMAL(10, 2),
  min_km DECIMAL(10, 2)
);

INSERT INTO drivers (name, description, vehicle, rating, comment, km_value, min_km) VALUES
('Homer Simpson', 'Motorista amigável, sempre com um sorriso e uma rosquinha.', 'Plymouth Valiant 1973', 2.5,'Totalmente desastrado', 2.5, 1),
('Dominic Toretto', 'Motorista experiente, adora velocidade e desafios.', 'Dodge Charger R/T 1970', 4.5, 'Ele fez um racha comigo dentro do veículo', 5.0, 5),
('James Bond', 'Elegante e discreto, ideal para uma viagem tranquila.', 'Aston Martin DB5', 5.0, 'Alguns motoristas tentaram fazer agente (James Bond) capotar', 10.0, 10);

CREATE TABLE IF NOT EXISTS rides (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id VARCHAR(255) NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    distance INT,
    duration VARCHAR(255),
    driver_id INT,
    value DECIMAL(20, 2),
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES drivers(id)
);