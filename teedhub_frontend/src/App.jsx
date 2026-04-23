import "./assets/main.css";
import "./App.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AuthStateProvider } from "./context/AuthStateContext";

function App() {
  return (
    <AuthStateProvider>
      <RouterProvider router={router} />
    </AuthStateProvider>
  );
}

export default App;