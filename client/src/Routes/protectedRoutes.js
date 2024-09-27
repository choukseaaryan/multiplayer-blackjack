import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { GameContext } from "../context";

const ProtectedRoute = () => {
  const { username, roomId } = useContext(GameContext);


  return username && roomId ? <Outlet /> : <Navigate to="/" />;
};

export default ProtectedRoute;
