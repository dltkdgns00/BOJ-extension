import axios from "axios";

async function tierAxios(
	problemNumber: string
): Promise<{ name: string; svg: string }> {
	const tierNames: string[] = [
		"Unrated",
		"Bronze V",
		"Bronze IV",
		"Bronze III",
		"Bronze II",
		"Bronze I",
		"Silver V",
		"Silver IV",
		"Silver III",
		"Silver II",
		"Silver I",
		"Gold V",
		"Gold IV",
		"Gold III",
		"Gold II",
		"Gold I",
		"Platinum V",
		"Platinum IV",
		"Platinum III",
		"Platinum II",
		"Platinum I",
		"Diamond V",
		"Diamond IV",
		"Diamond III",
		"Diamond II",
		"Diamond I",
		"Ruby V",
		"Ruby IV",
		"Ruby III",
		"Ruby II",
		"Ruby I",
	];

	const tierAxios = await axios.get(
		`https://solved.ac/api/v3/problem/show?problemId=${problemNumber}`,
		{
			headers: { Accept: "application/json" },
		}
	);

	const level = tierAxios.data.level;
	var name = tierNames[level];
	const svg = `https://static.solved.ac/tier_small/${level}.svg`;

	return { name, svg };
}

export { tierAxios };

// 0	Unrated
// 1	Bronze V
// 2	Bronze IV
// 3	Bronze III
// 4	Bronze II
// 5	Bronze I
// 6	Silver V
// 7	Silver IV
// 8	Silver III
// 9	Silver II
// 10	Silver I
// 11	Gold V
// 12	Gold IV
// 13	Gold III
// 14	Gold II
// 15	Gold I
// 16	Platinum V
// 17	Platinum IV
// 18	Platinum III
// 19	Platinum II
// 20	Platinum I
// 21	Diamond V
// 22	Diamond IV
// 23	Diamond III
// 24	Diamond II
// 25	Diamond I
// 26	Ruby V
// 27	Ruby IV
// 28	Ruby III
// 29	Ruby II
// 30	Ruby I
