import "./App.css";
import ItemList from "./pages/ItemList";

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:id" element={<ItemList />} />
      </Routes>
    </Router>
  );
}

export default App;
