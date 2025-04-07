import * as vscode from "vscode";
import path from "path";
import fs from "fs";
import { showProblem } from "./showProblem";
import { headerComment } from "./headerComment";
import { searchProblem } from "../libs/searchProblem";
import { tierAxios } from "../libs/tierAxios";

// HTML 콘텐츠에서 불필요한 탭과 공백을 제거하는 함수
function cleanHtmlContent(content: string | null): string {
	if (!content) {
		return "";
	}

	// 앞뒤 공백 제거
	let cleaned = content.trim();

	// 각 줄 시작 부분의 탭과 불필요한 공백 제거
	cleaned = cleaned.replace(/^[ \t]+/gm, "");

	// 연속된 빈 줄을 하나로 줄이기
	cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

	return cleaned;
}

export function createProblem(context: vscode.ExtensionContext) {
	vscode.window
		.showInputBox({
			prompt: "문제 번호를 입력해주세요.",
			placeHolder: "예: 1000",
		})
		.then(async (problemNumber) => {
			if (!problemNumber) {
				vscode.window.showErrorMessage("문제 번호가 입력되지 않았습니다.");
				return;
			}

			try {
				const config = vscode.workspace.getConfiguration("BOJ");
				const extension = config.get<string>("extension", "");

				const sp = await searchProblem(problemNumber, context);
				const tier = await tierAxios(problemNumber);

				// 제목 추출
				// 운영체제별로 폴더명에 사용할 수 없는 문자를 바꿔준다.
				let problemName = sp.title;

				// 운영체제 확인
				const platform = process.platform;

				console.log(`Platform: ${platform}`);

				// 모든 OS에서 공통으로 사용할 수 없는 문자 처리
				problemName = problemName.replace(/\//g, "／").replace(/\\/g, "＼");

				// Windows에서만 사용할 수 없는 문자 처리
				if (platform === "win32") {
					problemName = problemName
						.replace(/:/g, "：")
						.replace(/\*/g, "＊")
						.replace(/\?/g, "？")
						.replace(/"/g, "＂")
						.replace(/</g, "＜")
						.replace(/>/g, "＞")
						.replace(/\|/g, "｜")
						.replace(/\^/g, "＾");
				}

				// 윈도우에서는 콜론(:) 문자를 파일명에 사용할 수 없으므로 폴더명 생성 시 분리자 변경
				let folderName;
				if (platform === "win32") {
					// 윈도우에서는 `-` 또는 `_`와 같은 구분자 사용
					folderName = `${problemNumber}번 - ${problemName}`;
				} else {
					// 다른 OS에서는 원래 의도한 콜론을 사용
					folderName = `${problemNumber}번: ${problemName}`;
				}

				const folderPath = path.join(
					vscode.workspace.workspaceFolders![0].uri.fsPath,
					folderName
				);
				fs.mkdirSync(folderPath);

				// 파일명 생성
				let fileName = "";
				if (extension === "java") {
					fileName = `Main.java`;
				} else {
					fileName = `${problemName}.${extension}`;
				}
				// md 파일명 생성
				const readme = `README.md`;

				// 폴더 생성 후 폴더 안에 파일 생성
				const fnUri = vscode.Uri.joinPath(
					vscode.workspace.workspaceFolders![0].uri,
					folderName,
					fileName
				);
				const readmeUri = vscode.Uri.joinPath(
					vscode.workspace.workspaceFolders![0].uri,
					folderName,
					readme
				);

				// README.md 파일 내용
				const readmeContent = `# ${problemNumber}번: ${problemName} - <img src="${
					tier.svg
				}" style="height:20px" /> ${
					tier.name
				}\n\n<!-- performance -->\n\n<!-- 문제 제출 후 깃허브에 푸시를 했을 때 제출한 코드의 성능이 입력될 공간입니다.-->\n\n<!-- end -->\n\n## 문제\n\n[문제 링크](https://boj.kr/${problemNumber})\n\n${cleanHtmlContent(
					sp.description
				)}\n\n## 입력\n\n${cleanHtmlContent(
					sp.input
				)}\n\n## 출력\n\n${cleanHtmlContent(
					sp.output
				)}\n\n## 소스코드\n\n[소스코드 보기](${fileName.replace(/ /g, "%20")})`;
				const encoder = new TextEncoder();
				const readmeData = encoder.encode(readmeContent);

				// 파일 생성
				await vscode.workspace.fs.writeFile(fnUri, new Uint8Array());
				await vscode.workspace.fs.writeFile(readmeUri, readmeData);

				// 왼쪽 분할 화면에 텍스트 에디터를 열기
				const document = await vscode.workspace.openTextDocument(fnUri);
				await vscode.window.showTextDocument(document, {
					viewColumn: vscode.ViewColumn.One,
				});

				// 완료 메시지 표시
				vscode.window.showInformationMessage(
					`'${fileName}' 파일이 생성되었습니다.`
				);

				showProblem(problemNumber, context);
				headerComment(problemNumber);
			} catch (error) {
				if (error instanceof Error && (error as any).code === "EEXIST") {
					vscode.window.showErrorMessage("이미 해당 문제의 폴더가 존재합니다.");
				} else if (
					error instanceof Error &&
					(error as any).code === "ERR_BAD_REQUEST"
				) {
					vscode.window.showErrorMessage("문제를 찾을 수 없습니다.");
				}
				console.log(error);
				return;
			}
		});
}
