CREATE DATABASE IF NOT EXISTS `db-voyages`;
USE `db-voyages`;

CREATE TABLE trajets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    depart VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    heure TIME NOT NULL,
    prix DECIMAL(10,2) NOT NULL,
    places_total INT NOT NULL DEFAULT 22
);

CREATE TABLE reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trajet_id INT NOT NULL,
    client_nom VARCHAR(100) NOT NULL,
    client_email VARCHAR(150) NOT NULL,
    date_reservation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut VARCHAR(20) DEFAULT 'confirmée',
    FOREIGN KEY (trajet_id) REFERENCES trajets(id)
);

CREATE TABLE reservations_sieges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL,
    siege_numero INT NOT NULL,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
);

-- Trajets d'exemple à Madagascar (22 places, prix en Ariary)
INSERT INTO trajets (depart, destination, date, heure, prix, places_total) VALUES
('Antananarivo', 'Toamasina', '2026-07-15', '08:00', 45000, 22),
('Antananarivo', 'Mahajanga', '2026-07-16', '09:00', 55000, 22),
('Toamasina', 'Antananarivo', '2026-07-15', '14:00', 42000, 22),
('Antananarivo', 'Toliara', '2026-07-17', '06:30', 75000, 22),
('Mahajanga', 'Antananarivo', '2026-07-16', '12:00', 50000, 22);