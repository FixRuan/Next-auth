import axios, {AxiosError} from "axios";
import {parseCookies, setCookie} from "nookies";

let cookies = parseCookies(); 

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
		if(error.response.data.code === "token.expired"){
			cookies = parseCookies();
			const {"nextauth.refreshToken": refreshtoken} = cookies;

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
			});
		} else {
			//logout
		}
	}
});

export { api };