import React from "react";
import ProtectedRoute from "./protectedRoutes";

const Main = () => {
  return (
    <main>
      <ProtectedRoute />
    </main>
  );
};

export default Main;
