import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { searchProblem } from "../libs/searchProblem";
import { headerComment } from "./headerComment";
import { showProblem } from "./showProblem";

export async function createProblem(
	context: vscode.ExtensionContext,
	problemNumber?: string
) {
	// 문제 번호가 전달되지 않은 경우 사용자에게 입력 요청
	if (!problemNumber) {
		problemNumber = await vscode.window.showInputBox({
			prompt: "문제 번호를 입력하세요.",
			placeHolder: "예: 1000",
		});
	}

	if (!problemNumber) {
		vscode.window.showInformationMessage("문제 번호를 입력해주세요.");
		return;
	}

	try {
		// 문제 정보 가져오기
		const problemInfo = await searchProblem(problemNumber, context);

		// 현재 워크스페이스 경로 가져오기
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			vscode.window.showErrorMessage("열린 워크스페이스가 없습니다.");
			return;
		}

		const rootPath = workspaceFolders[0].uri.fsPath;

		// 사용자 설정에서 확장자 가져오기
		const config = vscode.workspace.getConfiguration("BOJ");
		const extension = config.get<string>("extension", "");

		if (!extension) {
			vscode.window.showErrorMessage(
				"언어 확장자 설정이 되어있지 않습니다. 설정에서 확인해주세요."
			);
			return;
		}

		// 간결하게 수정 - 직접 콜론 사용
		const problemFolderName = `${problemNumber}번: ${problemInfo.title}`;
		const problemFolderPath = path.join(rootPath, problemFolderName);

		// 폴더가 없으면 생성
		if (!fs.existsSync(problemFolderPath)) {
			fs.mkdirSync(problemFolderPath, { recursive: true });
		}

		// 문제 파일 경로 (문제 이름.확장자)
		const problemFilePath = path.join(
			problemFolderPath,
			`${problemInfo.title}.${extension}`
		);

		// 파일이 이미 존재하는지 확인
		if (fs.existsSync(problemFilePath)) {
			const overwrite = await vscode.window.showWarningMessage(
				"파일이 이미 존재합니다. 덮어쓰시겠습니까?",
				"예",
				"아니오"
			);

			if (overwrite !== "예") {
				return;
			}
		}

		// 파일 생성
		fs.writeFileSync(problemFilePath, "");

		// 생성된 파일 열기
		const document = await vscode.workspace.openTextDocument(problemFilePath);
		await vscode.window.showTextDocument(document);

		// 헤더 코멘트 추가
		await headerComment(problemNumber);

		vscode.window.showInformationMessage(
			`${problemNumber}번 문제 파일이 생성되었습니다.`
		);

		// 전역 상태에 현재 문제 번호 저장
		context.globalState.update("currentProblemNumber", problemNumber);

		// 문제 내용 표시
		await showProblem(problemNumber, context);
	} catch (error) {
		vscode.window.showErrorMessage(
			`문제 생성 중 오류가 발생했습니다: ${error}. 네트워크 연결을 확인하고 다시 시도해주세요.`
		);
	}
}
