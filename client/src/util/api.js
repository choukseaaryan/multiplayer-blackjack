import axios from "axios";

import ToastContent from "../Components/ToastContent";
import { toast } from "react-toastify";

const AlertError = (text) => {
	return toast.error(
		<ToastContent
			title={"Fail :("}
			text={
				typeof text === "object"
					? "Something went wrong. Please try again later"
					: text
			}
		/>
	);
};

const AlertSuccess = (text) => {
	return toast.success(
		<ToastContent
			title="Success!"
			text={typeof text === "object" ? "Request Successful" : text}
		/>
	);
};

let cancelTokens = {};

const MakeProtectedApiCall = async (
	apiPath,
	method,
	bodyData = {},
	requestKey
) => {
	if (requestKey) {
		if (cancelTokens[requestKey]) {
			cancelTokens[requestKey].cancel(
				"Operation canceled due to new request."
			);
		}

		cancelTokens[requestKey] = axios.CancelToken.source();
	}

	switch (method.toLowerCase()) {
		case "get":
			try {
				const res = await axios.get(apiPath, {
					cancelToken: cancelTokens[requestKey]?.token,
				});
				return res;
			} catch (error) {
				if (axios.isCancel(error)) {
					return { status: 200 };
				}
				const msg = error.response?.data?.msg;
				AlertError(msg);
				toast.clearWaitingQueue();
				if (error.response?.status === 401) {
					localStorage.clear();
					window.location.href = "/login";
				}
				return { status: error.response?.status };
			}
		case "post":
			try {
				const res = await axios.post(apiPath, bodyData);
				AlertSuccess(res.data?.data?.msg || res.data.msg);
				return res;
			} catch (error) {
				const msg = error.response?.data?.msg || "Something went wrong";
				if (error?.response?.status === 500) {
					AlertError(msg?.msg);
					return { status: error.response?.status };
				}
				if (error.response?.status === 401) {
					localStorage.clear();
					window.location.href = "/login";
				}
				AlertError(msg);
				toast.clearWaitingQueue();
				return { status: error.response?.status };
			}
		case "put":
			try {
				const res = await axios.put(apiPath, bodyData);
				AlertSuccess(res.data?.data?.msg || res.data.msg);
				return res;
			} catch (error) {
				const msg = error.response?.data?.msg;
				AlertError(msg);
				toast.clearWaitingQueue();
				if (error.response?.status === 401) {
					localStorage.clear();
					window.location.href = "/login";
				}
				return { status: error.response?.status };
			}
		case "patch":
			try {
				const res = await axios.patch(apiPath, bodyData);
				AlertSuccess(res.data?.data?.msg || res.data.msg);
				return res;
			} catch (error) {
				const msg = error.response?.data?.msg;
				AlertError(msg);
				toast.clearWaitingQueue();
				if (error.response?.status === 401) {
					localStorage.clear();
					window.location.href = "/login";
				}
				return { status: error.response?.status };
			}
		case "delete":
			try {
				const res = await axios.delete(apiPath, bodyData);
				AlertSuccess(res.data?.data?.msg || res.data.msg);
				return res;
			} catch (error) {
				const msg = error.response?.data?.msg;
				AlertError(msg);
				toast.clearWaitingQueue();
				if (error.response?.status === 401) {
					localStorage.clear();
					window.location.href = "/login";
				}
				return { status: error.response?.status };
			}
		default:
			break;
	}
};

export default MakeProtectedApiCall;

export const isOnline = () => {
	return window.navigator.onLine;
};
