import axios, {AxiosError} from "axios";
import  Router from "next/router";
import {destroyCookie, parseCookies, setCookie} from "nookies";
import { signOut } from "../contexts/AuthContext";

let cookies = parseCookies();
let isRefreshing = false;
let failedRequestQueue:any = []; 

const api = axios.create({
	baseURL: "http://localhost:3333",
	headers: {
		Authorization: `Bearer ${cookies["nextauth.token"]}`
	}
});

api.interceptors.response.use(response => {
	return response;
}, (error:AxiosError) => {
	if(error.response?.status === 401){
		console.log(error.response.data);
		if(error.response.data?.code === "token.expired"){
			cookies = parseCookies();
			const {"nextauth.refreshToken": refreshtoken} = cookies;

			const originalConfig = error.config;

			if(!isRefreshing){
				isRefreshing = true;

				api.post("/refresh", {
					refreshtoken,
				}).then(response => {
					const { token } = response.data;
	
					setCookie(undefined, "nextauth.token", token, {
						maxAge: 60 * 60 * 24 * 30, // 30 dias
						path: "/"
					});
					setCookie(undefined, "nextauth.refreshToken", response.data.refreshtoken, {
						maxAge: 60 * 60 * 24 * 30, // 30 dias
						path: "/"
					});
	
					api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

					failedRequestQueue.forEach(request => request.onSuccess(token));
					failedRequestQueue = [];

				}).catch((err) => {
					failedRequestQueue.forEach(request => request.onSuccess(err));
					failedRequestQueue = [];
				}).finally(() => {
					isRefreshing = false;
				});
			}

			return new Promise((resolve, reject) => {
				failedRequestQueue.push({
					onSuccess: (token: string) => {
						originalConfig.headers["Authorization"] = `Bearer ${token}`;
						resolve(api(originalConfig));
					},
					onFailure: (err: AxiosError) => {
						reject(err);
					},
				});
			});
		} else {
			signOut();
		}
	}
});

export { api };