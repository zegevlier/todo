import "./App.css";
import ItemList from "./pages/ItemList";
import ReadOnlyItemList from "./pages/ReadOnlyList";

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/r/:id" element={<ReadOnlyItemList />} />
        <Route path="/:id" element={<ItemList />} />
      </Routes>
    </Router>
  );
}

export default App;
