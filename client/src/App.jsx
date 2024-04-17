import { useEffect } from "react";
import TextEditor from "./components/text-editor";
import "./App.css";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link,
    useNavigate,
} from "react-router-dom";
import { v4 as uuidv4 } from "uuid";


function RedirectToNewDocument() {
  const navigate = useNavigate();

  useEffect(() => {
      navigate(`/documents/${uuidv4()}`);
  }, [navigate]);

  return null;
}


function App() {
    return (
        <Router>
            <Routes>
                <Route
                    path="/"
                    element={<RedirectToNewDocument />}
                />
                <Route path="/documents/:id" element={<TextEditor />} />
            </Routes>
        </Router>
    );
}

export default App;
