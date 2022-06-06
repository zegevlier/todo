import "./App.css";
import ItemList from "./pages/ItemList";
import ReadOnlyItemList from "./pages/ReadOnlyList";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Helmet from "react-helmet";
import { useEffect, useState } from "react";

function App() {
  // @ts-ignore
  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    if (localStorage.getItem("theme") === "dark") {
      setDarkMode(true);
    } else {
      setDarkMode(false);
    }
    document.documentElement.classList.remove("dark");
  }, [darkMode]);

  return (
    <div className={darkMode ? "dark" : ""}>
      <Helmet>
        <title>Todo & Shopping list app</title>
        <meta name="description" content="Todo and shopping list app" />
      </Helmet>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={<Home darkMode={darkMode} setDarkMode={setDarkMode} />}
          />
          <Route path="/r/:id" element={<ReadOnlyItemList />} />
          <Route path="/:id" element={<ItemList />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
