import './App.css';
import TodoList from './components/TodoList';

import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import Home from './components/Home';

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
