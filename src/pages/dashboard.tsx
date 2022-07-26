import Router from "next/router";
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

export default function Dashboard() {

	const { user } = useAuth();

	useEffect(() => {
		api.get("/me").then(response => console.log(response))
			.catch(error => console.log(error));
	}, []);

	return (
		<div>
			<h1>Dashboard</h1>
			<h2>{user?.email}</h2>
		</div>
	);
}