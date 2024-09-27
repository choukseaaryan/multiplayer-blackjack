import React from "react";
import { Routes, Route } from "react-router-dom";
import ErrorPage404 from "../Components/ErrorPage404";
import Room from "../Pages/Room";
import Main from "./main";
import Login from "../Pages/Login";

const AllRoutes = () => (
	<Routes>
		<Route path="*" element={<ErrorPage404 />} />
		<Route path="/" element={<Login />} />
		<Route path="/" element={<Main />}>
			<Route path="/room/:roomId" element={<Room />} />
		</Route>
	</Routes>
);

export default AllRoutes;
