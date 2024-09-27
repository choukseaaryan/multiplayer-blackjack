import React, { useState } from "react";
import { toast } from "react-toastify";
import PageLoader from "../../Components/PageLoader";

const Signup = () => {
	const [data, setData] = useState({
		name: "",
		email: "",
		password: "",
		phone: "",
		gender: "",
		source: [],
		city: "",
		state: "",
	});

	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);

	const cityArray = ["Mumbai", "Pune", "Ahmedabad"];
	const stateArray = ["Gujarat", "Maharashtra", "Karnataka"];

	const toggleShowPassword = () => {
		setShowPassword(!showPassword);
	};

	const submitHandler = () => {
		setLoading(true);
		const { email, password, name, phone, gender, source, city, state } =
			data;

		if (
			!email ||
			!password ||
			!name ||
			!phone ||
			!gender ||
			!source.length ||
			!city ||
			!state
		) {
			toast.error("Please fill all fields!");
			return;
		}

		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		const phoneRegex = /^[0-9]{10}$/;

		if (!emailRegex.test(email)) {
			toast.error("Please enter a valid email!");
			return;
		}

		if (!phoneRegex.test(phone)) {
			toast.error("Please enter a valid phone number!");
			return;
		}

		if (!stateArray.includes(state)) {
			toast.error("Please enter a valid state!");
			return;
		}
		console.log("Signup data: ", data);
		setLoading(false);

	};

	const changeHandler = (e) => {
		if (e.target.name === "source") {
			if (e.target.checked) {
				setData((prevData) => ({
					...prevData,
					source: [...prevData.source, e.target.value],
				}));
			} else {
				setData((prevData) => ({
					...prevData,
					source: prevData.source.filter(
						(item) => item !== e.target.value
					),
				}));
			}
		} else {
			setData({ ...data, [e.target.name]: e.target.value });
		}
	};

	return (<>
		{loading && <PageLoader />}
		<div className="login">
			<div className="bg-white shadow-lg rounded-2xl p-12 flex flex-col items-center justify-center w-4/5 max-w-[1000px]">
				<h1>Sign Up</h1>
				<div className="register__form">
					<div>
						<h4>Name</h4>
						<input
							name="name"
							type="text"
							placeholder="Enter Name"
							onChange={changeHandler}
						/>
					</div>
					<div>
						<h4>Phone</h4>
						<input
							name="phone"
							type="number"
							placeholder="Enter Phone Number"
							onChange={changeHandler}
						/>
					</div>
					<div>
						<h4>E-mail</h4>
						<input
							name="email"
							type="email"
							placeholder="Enter E-mail"
							onChange={changeHandler}
						/>
					</div>
					<div>
						<h4>Password</h4>
						<div className="password__container">
							<input
								name="password"
								type={showPassword ? "text" : "password"}
								placeholder="Enter Password"
								onChange={changeHandler}
								className="password__input"
							/>
							<button
								className="toggle__passwordBtn"
								onClick={toggleShowPassword}
							>
								{showPassword ? (
									<i class="bx bx-hide"></i>
								) : (
									<i class="bx bx-show"></i>
								)}
							</button>
						</div>
					</div>
					<div>
						<h4>Gender</h4>
						<div>
							<input
								type="radio"
								id="male"
								name="gender"
								value="male"
								onChange={changeHandler}
							/>
							<label htmlFor="male">Male</label>
						</div>
						<div>
							<input
								type="radio"
								id="female"
								name="gender"
								value="female"
								onChange={changeHandler}
							/>
							<label htmlFor="female">Female</label>
						</div>
						<div>
							<input
								type="radio"
								id="other"
								name="gender"
								value="other"
								onChange={changeHandler}
							/>
							<label htmlFor="other">Other</label>
						</div>
					</div>
					<div>
						<h4>How did you hear about this?</h4>
						<div>
							<input
								type="checkbox"
								id="linkedin"
								name="source"
								value="linkedin"
								onChange={changeHandler}
							/>
							<label htmlFor="linkedin">LinkedIn</label>
						</div>
						<div>
							<input
								type="checkbox"
								id="friends"
								name="source"
								value="friends"
								onChange={changeHandler}
							/>
							<label htmlFor="friends">Friends</label>
						</div>
						<div>
							<input
								type="checkbox"
								id="jobPortal"
								name="source"
								value="jobPortal"
								onChange={changeHandler}
							/>
							<label htmlFor="jobPortal">Job Portal</label>
						</div>
						<div>
							<input
								type="checkbox"
								id="others"
								name="source"
								value="others"
								onChange={changeHandler}
							/>
							<label htmlFor="others">Others</label>
						</div>
					</div>
					<div>
						<h4>City</h4>
						<select onChange={changeHandler} name="city">
							<option value="">Select city</option>
							{cityArray?.map((city, i) => {
								return (
									<option key={i} value={city}>
										{city}
									</option>
								);
							})}
						</select>
					</div>
					<div>
						<h4>State</h4>
						<input
							list="states"
							name="state"
							onChange={changeHandler}
						/>
						<datalist id="states">
							{stateArray?.map((state, i) => {
								return <option key={i} value={state} />;
							})}
						</datalist>
					</div>
				</div>

				<button onClick={submitHandler} className="register__button">
					Sign Up
				</button>

				<p className="login__registerPara">
					Already a member?{" "}
					<a href="/login" className="login__registerButton">
						Login
					</a>
				</p>
			</div>
		</div>
	</>
	);
};

export default Signup;
