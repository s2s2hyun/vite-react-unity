import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import "./App.css";
// import Home from "./pages/home/Home";
import About from "./pages/about/About";
import Layout from "./components/layout/Layout";
import Test from "./pages/test/Test";

function App() {
  // 모바일 viewport height 맞추기
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Test />} />
          <Route path="/about" element={<About />} />
          <Route path="/test" element={<Test />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
