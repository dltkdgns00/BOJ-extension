import * as vscode from "vscode";
import axios from "axios";
import * as cheerio from "cheerio";

interface ProblemData {
	title: string;
	info: string | null;
	description: string;
	input: string | null;
	output: string | null;
	limit: string | null;
	sampleInputs: string[] | null;
	sampleOutputs: string[] | null;
	sampleExplains: string[] | null;
	hint: string | null;
	source: string | null;
}

export async function searchProblem(
	problemNumber: string,
	context: vscode.ExtensionContext
): Promise<ProblemData> {
	console.log(`[BOJ-EX] searchProblem 호출: ${problemNumber}번`);

	const cacheKey = `problem-${problemNumber}`;
	const cachedData = context.globalState.get<ProblemData>(cacheKey);

	// 캐시 데이터 유효성 검사
	if (cachedData) {
		console.log(`[BOJ-EX] 캐시된 데이터 발견: ${problemNumber}번`);

		// 캐시 데이터가 유효한지 확인
		const isValidCache = isValidProblemData(cachedData);

		if (isValidCache) {
			console.log(`[BOJ-EX] 유효한 캐시 데이터 사용: ${problemNumber}번`);
			return cachedData;
		} else {
			console.log(
				`[BOJ-EX] 캐시 데이터가 유효하지 않음: ${problemNumber}번, 새로 요청합니다.`
			);
			// 잘못된 캐시 데이터 삭제
			await context.globalState.update(cacheKey, undefined);
		}
	}

	try {
		console.log(`[BOJ-EX] 백준 사이트에서 데이터 요청 중...`);

		// 최대 재시도 횟수 설정
		const maxRetries = 3;
		let retryCount = 0;
		let response;

		while (retryCount < maxRetries) {
			response = await axios.get(
				`https://www.acmicpc.net/problem/${problemNumber}`,
				{
					headers: {
						"User-Agent":
							"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
					},
					responseType: "arraybuffer",
				}
			);

			console.log(`[BOJ-EX] 데이터 요청 완료 ${response.data}`);

			console.log(`[BOJ-EX] 상태 코드: ${response.status}`);

			// 상태 코드가 200이면 성공, 계속 진행
			if (response.status === 200) {
				break;
			}

			// 상태 코드가 202면 아직 처리 중이므로 재시도
			if (response.status === 202) {
				retryCount++;
				console.log(
					`[BOJ-EX] 상태 코드 202 수신, 재시도 중... (${retryCount}/${maxRetries})`
				);
				// 1초 대기 후 재시도
				await new Promise((resolve) => setTimeout(resolve, 1000));
				continue;
			}

			// 다른 상태 코드는 그냥 진행
			break;
		}

		if (response.status !== 200) {
			console.log(
				`[BOJ-EX] 최종 상태 코드: ${response.status}, 데이터 처리를 시도합니다.`
			);
		}

		const htmlData = response.data.toString("utf-8");
		console.log(`[BOJ-EX] HTML 파싱 시작 (HTML 길이: ${htmlData.length})`);

		// Cheerio를 사용하여 HTML 파싱
		const $ = cheerio.load(htmlData);

		// 타이틀 추출
		const title = $("#problem_title").text();
		console.log(`[BOJ-EX] 문제 제목: ${title}`);

		// 각 섹션 추출 시 컨솔에 로그 출력
		const info = $("#problem-info").html();
		console.log(`[BOJ-EX] info 추출: ${info ? "성공" : "실패"}`);

		const description = $("#problem_description").html();
		console.log(`[BOJ-EX] description 추출: ${description ? "성공" : "실패"}`);

		const input = $("#problem_input").html();
		console.log(`[BOJ-EX] input 추출: ${input ? "성공" : "실패"}`);

		const output = $("#problem_output").html();
		console.log(`[BOJ-EX] output 추출: ${output ? "성공" : "실패"}`);

		// 제한 추출
		const limit = $("#problem_limit").html();
		console.log(`[BOJ-EX] limit 추출: ${limit ? "성공" : "실패"}`);

		// 예제 입력, 예제 출력, 예제 설명 추출 (배열로 처리)
		const sampleInputs: string[] = [];
		const sampleOutputs: string[] = [];
		const sampleExplains: string[] = [];

		let i = 1;
		while (true) {
			const sampleInput = $(`#sample-input-${i}`).html();
			const sampleOutput = $(`#sample-output-${i}`).html();
			const sampleExplain = $(`#sample_explain_${i}`).html();

			if (!sampleInput || !sampleOutput) {
				break;
			}

			sampleInputs.push(sampleInput);
			sampleOutputs.push(sampleOutput);
			if (sampleExplain) {
				sampleExplains.push(sampleExplain);
			}
			i++;
		}
		console.log(`[BOJ-EX] 예제 데이터 추출: ${sampleInputs.length}개`);

		// 힌트 추출
		const hint = $("#problem_hint").html();
		console.log(`[BOJ-EX] hint 추출: ${hint ? "성공" : "실패"}`);

		// 출처 추출
		const source = $("#source").html();
		console.log(`[BOJ-EX] source 추출: ${source ? "성공" : "실패"}`);

		const problemData: ProblemData = {
			title: title || "제목 없음",
			info: info || "",
			description: description || "문제 내용이 없습니다.",
			input: input || "입력 설명이 없습니다.",
			output: output || "출력 설명이 없습니다.",
			limit: limit || "",
			sampleInputs: sampleInputs.length > 0 ? sampleInputs : [],
			sampleOutputs: sampleOutputs.length > 0 ? sampleOutputs : [],
			sampleExplains: sampleExplains,
			hint: hint || "",
			source: source || "",
		};

		console.log(`[BOJ-EX] 최종 데이터 생성 완료:`, problemData);
		await context.globalState.update(cacheKey, problemData);

		return problemData;
	} catch (error) {
		console.error(`[BOJ-EX] searchProblem 오류:`, error);
		// 오류 시 기본 데이터 반환
		return {
			title: "제목 없음",
			info: "",
			description: "문제 내용을 불러오는 중 오류가 발생했습니다.",
			input: "입력 설명을 불러오는 중 오류가 발생했습니다.",
			output: "출력 설명을 불러오는 중 오류가 발생했습니다.",
			limit: "",
			sampleInputs: [],
			sampleOutputs: [],
			sampleExplains: [],
			hint: "",
			source: "",
		};
	}
}

// 문제 데이터의 유효성을 검사하는 함수
function isValidProblemData(data: ProblemData): boolean {
	// 필수 필드가 존재하는지 확인
	if (!data.title || data.title === "제목 없음") {
		console.log("[BOJ-EX] 캐시 검증 실패: 제목 없음");
		return false;
	}

	if (
		!data.description ||
		data.description === "문제 내용이 없습니다." ||
		data.description === "문제 내용을 불러오는 중 오류가 발생했습니다."
	) {
		console.log("[BOJ-EX] 캐시 검증 실패: 문제 내용 없음");
		return false;
	}

	if (
		!data.input ||
		data.input === "입력 설명이 없습니다." ||
		data.input === "입력 설명을 불러오는 중 오류가 발생했습니다."
	) {
		console.log("[BOJ-EX] 캐시 검증 실패: 입력 설명 없음");
		return false;
	}

	if (
		!data.output ||
		data.output === "출력 설명이 없습니다." ||
		data.output === "출력 설명을 불러오는 중 오류가 발생했습니다."
	) {
		console.log("[BOJ-EX] 캐시 검증 실패: 출력 설명 없음");
		return false;
	}

	// 예제 입출력이 있어야 함 (최소 하나 이상)
	if (
		!Array.isArray(data.sampleInputs) ||
		!Array.isArray(data.sampleOutputs) ||
		data.sampleInputs.length === 0 ||
		data.sampleOutputs.length === 0
	) {
		console.log("[BOJ-EX] 캐시 검증 실패: 예제 입출력 없음");
		return false;
	}

	// 예제 입력과 출력의 개수가 일치해야 함
	if (data.sampleInputs.length !== data.sampleOutputs.length) {
		console.log("[BOJ-EX] 캐시 검증 실패: 예제 입력과 출력 개수 불일치");
		return false;
	}

	// 모든 검증 통과
	console.log("[BOJ-EX] 캐시 검증 성공: 모든 필수 데이터 존재");
	return true;
}
