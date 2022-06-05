import "./App.css";
import ItemList from "./pages/ItemList";
import ReadOnlyItemList from "./pages/ReadOnlyList";

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Helmet from "react-helmet";

function App() {
  return (
    <div>
      <Helmet>
        <title>Todo & Shopping list app</title>
        <link rel="canonical" href="https://todo.note.autos/" />
        <meta name="description" content="Todo and shopping list app" />
      </Helmet>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/r/:id" element={<ReadOnlyItemList />} />
          <Route path="/:id" element={<ItemList />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
