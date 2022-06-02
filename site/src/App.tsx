import './App.css';
import TodoList from './pages/TodoList';

import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import Home from './pages/Home';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:id" element={<TodoList />} />
      </Routes>
    </Router>
  );
}

export default App;
