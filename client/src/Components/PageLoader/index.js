import { Grid } from "react-loader-spinner";

const PageLoader = () => {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				position: "fixed",
				zIndex: "9999",
				left: "0",
				top: "0",
				width: "100%",
				height: "100%",
				backgroundColor: "rgba(255,255,255,0.6)",
			}}
		>
			<Grid
				visible={true}
				height="80"
				width="80"
				color="#754ef9"
				ariaLabel="grid-loading"
				radius="12.5"
				wrapperStyle={{}}
				wrapperClass="grid-wrapper"
			/>
		</div>
	);
};

export default PageLoader;
