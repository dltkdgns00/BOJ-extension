import * as vscode from "vscode";
import { getProbNum } from "../libs/getProbNum";

/**
 * 백준 문제 제출 페이지를 엽니다.
 * @param problemNumber 문제 번호 (선택적)
 */
export function submitProblem(problemNumber?: string) {
	// 문제 번호가 전달되지 않은 경우, 현재 열린 파일에서 자동으로 추출 시도
	if (!problemNumber) {
		const extractedNumber = getProbNum();

		// 추출에 실패한 경우 사용자에게 입력 요청
		if (!extractedNumber) {
			vscode.window
				.showInputBox({
					prompt: "제출할 문제 번호를 입력하세요.",
					placeHolder: "예: 1000",
				})
				.then((input) => {
					if (input) {
						openSubmitPage(input);
					} else {
						vscode.window.showInformationMessage("문제 번호를 입력해주세요.");
					}
				});
			return;
		}
		problemNumber = extractedNumber;
	}

	openSubmitPage(problemNumber);
}

/**
 * 백준 문제 제출 페이지를 브라우저에서 엽니다.
 * @param problemNumber 문제 번호
 */
function openSubmitPage(problemNumber: string) {
	const submitUrl = `https://www.acmicpc.net/submit/${problemNumber}`;
	vscode.env.openExternal(vscode.Uri.parse(submitUrl));
	vscode.window.showInformationMessage(
		`문제 ${problemNumber}번 제출 페이지로 이동합니다.`
	);
}
