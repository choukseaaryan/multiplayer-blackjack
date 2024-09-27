import React from "react";
import { BrowserRouter } from "react-router-dom";
import AllRoutes from "./routes";

const Routing = () => {
  return (
    <BrowserRouter>
      <AllRoutes />
    </BrowserRouter>
  );
};

export default Routing;
