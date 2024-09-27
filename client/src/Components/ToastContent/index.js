const ToastContent = ({ title, text }) => {
	return (
		<>
			<div>
				<div>
					<span>{title}</span>
				</div>
			</div>
			<div style={{ marginTop: "10px" }}>
				<span>{text}</span>
			</div>
		</>
	);
};
export default ToastContent;
