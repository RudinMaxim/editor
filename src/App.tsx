import { Toolbar } from "./components/Toolbar";
import { Canvas } from "./components/Canvas";
import { StatusBar } from "./components/StatusBar";

function App() {
  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr auto", height: "100vh", background: "#111" }}>
      <Toolbar />
      <Canvas />
      <StatusBar />
    </div>
  );
}

export default App;
