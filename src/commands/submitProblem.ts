import * as vscode from "vscode";
import { getProbNum } from "../libs/getProbNum";
import { getSourceCodeByProblemNumber } from "../libs/findSourceFile";

/**
 * 백준 문제 제출 페이지를 엽니다.
 * @param problemNumber 문제 번호 (선택적)
 * @param code 제출할 코드 (선택적)
 */
export function submitProblem(problemNumber?: string, code?: string) {
	// 문제 번호가 전달되지 않은 경우, 현재 열린 파일에서 자동으로 추출 시도
	if (!problemNumber) {
		const extractedNumber = getProbNum();
		if (!extractedNumber) {
			vscode.window
				.showInputBox({
					prompt: "제출할 문제 번호를 입력하세요.",
					placeHolder: "예: 1000",
				})
				.then(async (input) => {
					if (input) {
						// 코드가 전달되지 않은 경우 소스 파일을 찾아 코드 가져오기
						if (!code) {
							code = await getSourceCodeByProblemNumber(input);
						}
						openSubmitPage(input, code);
					} else {
						vscode.window.showInformationMessage("문제 번호를 입력해주세요.");
					}
				});
			return;
		}
		problemNumber = extractedNumber;
	}

	// 코드가 전달되지 않은 경우 소스 파일을 찾아 코드 가져오기
	if (!code) {
		getSourceCodeByProblemNumber(problemNumber).then((foundCode) => {
			openSubmitPage(problemNumber, foundCode);
		});
	} else {
		openSubmitPage(problemNumber, code);
	}
}

/**
 * 백준 문제 제출 페이지를 브라우저에서 열고 코드를 자동으로 삽입합니다.
 * @param problemNumber 문제 번호
 * @param code 제출할 코드 (선택적)
 */
function openSubmitPage(problemNumber: string, code?: string) {
	const submitUrl = `https://www.acmicpc.net/submit/${problemNumber}`;

	if (!code) {
		// 코드가 없는 경우 기존 동작 수행
		vscode.env.openExternal(vscode.Uri.parse(submitUrl));
		vscode.window.showInformationMessage(
			`문제 ${problemNumber}번 제출 페이지로 이동합니다.`
		);
		return;
	}

	// 먼저 코드를 클립보드에 복사
	vscode.env.clipboard.writeText(code).then(() => {
		// 사용자에게 제출 전 안내 메시지 표시
		const message = `문제 ${problemNumber}번 코드가 클립보드에 복사되었습니다. 제출 페이지로 이동하시겠습니까?`;

		vscode.window
			.showInformationMessage(message, "제출 페이지로 이동", "취소")
			.then((selection) => {
				if (selection === "제출 페이지로 이동") {
					// 제출 페이지 열기
					vscode.env.openExternal(vscode.Uri.parse(submitUrl)).then(() => {
						// 제출 페이지 열린 후 추가 안내 메시지
						setTimeout(() => {
							vscode.window.showInformationMessage(
								`백준 제출 페이지에서 코드 편집기를 클릭한 후 Ctrl+V(Mac: ⌘+V)를 눌러 붙여넣으세요.`,
								"확인"
							);
						}, 1000);
					});
				}
			});
	});
}
