import { ImageResponse } from "next/og";

export const alt = "QC Schedules - Queens College Course Schedules & Professor Grades";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

export default async function Image() {
	return new ImageResponse(
		(
			<div
				style={{
					height: "100%",
					width: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#121212",
					color: "#ffffff",
					padding: "40px",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						marginBottom: "24px",
					}}
				>
					<div
						style={{
							display: "flex",
							backgroundColor: "#7e22ce",
							color: "#ffffff",
							padding: "10px 24px",
							borderRadius: "9999px",
							fontSize: "22px",
							fontWeight: 800,
							letterSpacing: "0.05em",
						}}
					>
						QUEENS COLLEGE (CUNY)
					</div>
				</div>
				<div
					style={{
						display: "flex",
						fontSize: "68px",
						fontWeight: 900,
						textAlign: "center",
						lineHeight: 1.1,
						marginBottom: "20px",
					}}
				>
					QC Schedules
				</div>
				<div
					style={{
						display: "flex",
						fontSize: "26px",
						color: "#a3a3a3",
						textAlign: "center",
						maxWidth: "800px",
					}}
				>
					Complete Course Schedules & Real Professor Grade Distributions
				</div>
			</div>
		),
		{
			...size,
		}
	);
}
