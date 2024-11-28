
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import TripRequestPage from "./pages/TripRequestPage";
import TripHistoryPage from "./pages/TripHistoryPage";
import Footer from "./components/Footer";

function App() {
  return (
    <Router>
      <Navbar />
      <div className="container mt-4 mb-4 main-content">
        <Routes>
          <Route path="/" element={<TripRequestPage />} />
          <Route path="/history" element={<TripHistoryPage />} />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;
