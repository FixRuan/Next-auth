import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { api } from "../services/api";

import { setCookie, parseCookies, destroyCookie } from "nookies";
import Router from "next/router";

type User = {
	email: string;
	permissions: string[];
	roles: string[];
}

interface AuthProviderProps {
	children: ReactNode;
}

type SignInCredentials = {
	email: string;
	password: string;
}

interface AuthContextData {
	signIn(credentials: SignInCredentials): Promise<void>
	isAuthenticated: boolean;
	user: User | null;
}

const AuthContext = createContext({} as AuthContextData);

export function signOut() {
	destroyCookie(undefined, "nextauth.token");
	destroyCookie(undefined, "nextauth.nextauth.refreshToken");
	Router.push("/");
}

export function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<User | null>(null);
	const isAuthenticated = !!user;


	useEffect(() => {
		const { "nextauth.token": token } = parseCookies();

		if (token) {
			api.get("/me").then(response => {
				const { email, permissions, roles } = response.data;
				setUser({ email, permissions, roles });
			})
				.catch(() => {
					signOut();
				});
		}


	}, []);

	async function signIn({ email, password }: SignInCredentials) {
		try {
			const response = await api.post("/sessions", {
				email,
				password
			});

			const { token, refreshToken, permissions, roles } = response.data;

			setCookie(undefined, "nextauth.token", token, {
				maxAge: 60 * 60 * 24 * 30, // 30 dias
				path: "/"
			});
			setCookie(undefined, "nextauth.refreshToken", refreshToken, {
				maxAge: 60 * 60 * 24 * 30, // 30 dias
				path: "/"
			});

			setUser({
				email,
				permissions,
				roles
			});

			api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

			Router.push("/dashboard");

		} catch (error) {
			console.log(error);
		}
	}


	return (
		<AuthContext.Provider value={{ signIn, isAuthenticated, user }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	return context;
}